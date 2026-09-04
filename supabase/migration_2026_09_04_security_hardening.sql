-- Run this in Supabase → SQL Editor. Safe to run more than once.
--
-- Closes four gaps found in a security pass over the money/spam-sensitive
-- RPCs and Vercel functions (promo codes, gifted Premium, purchase
-- verification, account deletion):
--
-- 1. `users` had `for select using (true)` with no column restriction, so
--    the public anon key (embedded in the app bundle and in
--    admin-panel/index.html's page source) could dump every user's email
--    address in bulk — a standing PII leak, and the exact list an
--    attacker would need to target admin-panel/api/delete-account.js (see
--    below) at every real account. Nothing in the app ever reads another
--    user's email through this table (grep confirms only id/name/plan/
--    referral_code/language/muted_notification_types are read client-
--    side), so this is safe to lock down with no feature impact.
--
-- 2. redeem_promo_code had no throttling at all and didn't even check the
--    caller's user id was a real users row — an attacker could script
--    unlimited code guesses, or exhaust a low-max_redemptions giveaway
--    code's pool with entirely made-up ids before real recipients got to
--    it, for zero cost.
--
-- 3. verify-purchase.js / verify-purchase-android.js re-verify a
--    transactionId/purchaseToken against Apple/Google on every call but
--    never recorded that one had already been consumed — Apple/Google
--    keep confirming the same real, unexpired transaction forever, so one
--    purchase's id (visible in device logs, a proxied request, or shared
--    by its owner) could be replayed against different userIds to grant
--    unlimited free Premium.
--
-- 4. delete-account.js's self-service path is gated by NOTIFY_SECRET — a
--    single static value shipped in every app install, not a per-user
--    credential — so it never actually proved the caller *was* the
--    account named in the request body. Combined with #1's PII leak, this
--    let anyone holding that secret permanently delete any account. This
--    migration adds the table the fix's push-confirmation-code flow
--    needs; the flow itself lives in delete-account.js.

-- ---------------------------------------------------------------------
-- 1. Stop anon/authenticated from reading users.email in bulk.
-- ---------------------------------------------------------------------
revoke select (email) on users from anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Throttle + validate redeem_promo_code.
-- ---------------------------------------------------------------------
create table if not exists promo_code_attempts (
  user_id text primary key,
  window_start timestamptz not null default now(),
  attempt_count int not null default 0
);
alter table promo_code_attempts enable row level security;
-- Deliberately no anon/authenticated policies — this is only ever read or
-- written from inside the security-definer function below, which runs as
-- its owner regardless of RLS. No direct client access is needed.

create or replace function redeem_promo_code(p_user_id text, p_code text)
returns table (granted_days int, new_expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(trim(p_code));
  v_row promo_codes%rowtype;
  v_base timestamptz;
  v_new_expires timestamptz;
  v_attempts promo_code_attempts%rowtype;
begin
  if p_user_id is null or length(trim(p_user_id)) = 0 or v_code is null or length(v_code) = 0 then
    return;
  end if;

  -- Per-caller-id sliding window: at most 8 attempts per rolling 10
  -- minutes. This doesn't stop an attacker who mints unlimited fake ids,
  -- but it kills naive single-identity guessing/hammering, and paired
  -- with the real-user check below, a fake id can no longer siphon a
  -- code's redemption pool for free either — it now needs a real
  -- registered account, which has its own cost/friction.
  select * into v_attempts from promo_code_attempts where user_id = p_user_id for update;
  if v_attempts is null then
    insert into promo_code_attempts (user_id, window_start, attempt_count) values (p_user_id, now(), 1);
  elsif v_attempts.window_start < now() - interval '10 minutes' then
    update promo_code_attempts set window_start = now(), attempt_count = 1 where user_id = p_user_id;
  else
    if v_attempts.attempt_count >= 8 then
      return;
    end if;
    update promo_code_attempts set attempt_count = attempt_count + 1 where user_id = p_user_id;
  end if;

  if not exists (select 1 from users where id = p_user_id) then
    return;
  end if;

  select * into v_row from promo_codes where code = v_code for update;
  if v_row.code is null then
    return;
  end if;
  if v_row.expires_at is not null and v_row.expires_at < now() then
    return;
  end if;
  if v_row.redeemed_count >= v_row.max_redemptions then
    return;
  end if;
  if exists (select 1 from promo_code_redemptions where code = v_code and user_id = p_user_id) then
    return;
  end if;

  insert into promo_code_redemptions (code, user_id) values (v_code, p_user_id);
  update promo_codes set redeemed_count = redeemed_count + 1 where code = v_code;

  select case
    when plan = 'premium' and premium_expires_at is not null and premium_expires_at > now()
    then premium_expires_at
    else now()
  end into v_base
  from users where id = p_user_id;

  v_new_expires := v_base + (v_row.premium_days || ' days')::interval;
  update users set plan = 'premium', premium_expires_at = v_new_expires, updated_at = now() where id = p_user_id;

  return query select v_row.premium_days, v_new_expires;
end;
$$;

grant execute on function redeem_promo_code(text, text) to anon, authenticated;

-- Same per-caller throttle applied to gift_premium_from_points — it was
-- already safe against a stranger draining a specific victim's points
-- (p_from_user_id must have real committed points, so guessing wrong ids
-- just fails), but had no floor against a script hammering it either.
create or replace function gift_premium_from_points(p_from_user_id text, p_to_referral_code text, p_days int)
returns table (to_user_id text, to_name text, new_expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cost int;
  v_points int;
  v_to_id text;
  v_to_name text;
  v_base timestamptz;
  v_new_expires timestamptz;
  v_attempts promo_code_attempts%rowtype;
begin
  if p_days is null or p_days < 1 or p_from_user_id is null then
    return;
  end if;

  select * into v_attempts from promo_code_attempts where user_id = p_from_user_id for update;
  if v_attempts is null then
    insert into promo_code_attempts (user_id, window_start, attempt_count) values (p_from_user_id, now(), 1);
  elsif v_attempts.window_start < now() - interval '10 minutes' then
    update promo_code_attempts set window_start = now(), attempt_count = 1 where user_id = p_from_user_id;
  else
    if v_attempts.attempt_count >= 8 then
      return;
    end if;
    update promo_code_attempts set attempt_count = attempt_count + 1 where user_id = p_from_user_id;
  end if;

  v_cost := p_days * 10; -- must match lib/points.ts's POINTS_PER_PREMIUM_DAY

  select points into v_points from user_points where user_id = p_from_user_id;
  if v_points is null or v_points < v_cost then
    return;
  end if;

  select id, name into v_to_id, v_to_name from users where referral_code = upper(trim(p_to_referral_code));
  if v_to_id is null or v_to_id = p_from_user_id then
    return;
  end if;

  update user_points set points = points - v_cost, updated_at = now() where user_id = p_from_user_id;

  select case
    when plan = 'premium' and premium_expires_at is not null and premium_expires_at > now()
    then premium_expires_at
    else now()
  end into v_base
  from users where id = v_to_id;

  v_new_expires := v_base + (p_days || ' days')::interval;

  update users set plan = 'premium', premium_expires_at = v_new_expires, updated_at = now() where id = v_to_id;

  return query select v_to_id, v_to_name, v_new_expires;
end;
$$;

grant execute on function gift_premium_from_points(text, text, int) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. Purchase-verification replay guard (both stores).
-- ---------------------------------------------------------------------
-- One row per (platform, transaction id) ever successfully verified.
-- platform + transaction_id together are the store's own guarantee of
-- uniqueness for one purchase event; android's "transaction_id" is the
-- subscription-level purchaseToken (stable across renewal re-checks of
-- the same subscription, which is why the app is allowed to re-verify it
-- repeatedly — see verify-purchase.js/verify-purchase-android.js for how
-- this is used: insert-if-new, and only reject when the row that already
-- exists belongs to a *different* user).
create table if not exists verified_purchases (
  platform text not null check (platform in ('ios', 'android')),
  transaction_id text not null,
  user_id text not null,
  product_id text not null,
  verified_at timestamptz not null default now(),
  primary key (platform, transaction_id)
);
alter table verified_purchases enable row level security;
-- No anon/authenticated policies — only ever touched by the service_role
-- key from verify-purchase.js / verify-purchase-android.js.

-- ---------------------------------------------------------------------
-- 4. Account-deletion push-confirmation codes (apple-/google- accounts,
--    which never get a Supabase Auth session to verify instead).
-- ---------------------------------------------------------------------
create table if not exists account_deletion_codes (
  user_id text primary key,
  code text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table account_deletion_codes enable row level security;
-- No anon/authenticated policies — only ever touched by the service_role
-- key from delete-account.js.

-- ---------------------------------------------------------------------
-- 5. Generic IP-keyed rate limiter, used by github-issue.js's
--    NOTIFY_SECRET-gated "create" action (that secret is, like above,
--    shipped in every app install rather than being per-user — this
--    bounds how many public GitHub issues one source can spam).
-- ---------------------------------------------------------------------
create table if not exists api_rate_limits (
  bucket text not null,
  identifier text not null,
  window_start timestamptz not null default now(),
  request_count int not null default 0,
  primary key (bucket, identifier)
);
alter table api_rate_limits enable row level security;
-- No anon/authenticated policies — only ever touched by the service_role
-- key from admin-panel/lib/rateLimit.js.

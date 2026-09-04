-- Broadcast delivery history — admin-panel/lib/broadcast.js already
-- computes a sent/total count per send; this just persists it instead of
-- discarding it, so "Bildiriş çatdırılma statistikası" has real history
-- to show. "Açıldı" (opened) isn't tracked — that needs the app to report
-- notification-tap events back, which nothing currently does — so this is
-- delivery (sent/total), not an open-rate.
create table if not exists broadcast_log (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  audience_plan text,
  audience_language text,
  mode text not null, -- 'topic' (everyone) or 'targeted' (plan/language filtered)
  sent_count int,
  total_count int,
  created_at timestamptz not null default now()
);
alter table broadcast_log enable row level security;
drop policy if exists "Public read/insert" on broadcast_log;
create policy "Public read/insert" on broadcast_log for all using (true) with check (true);

-- Admin-generated promo codes redeemable for Premium days — mirrors
-- gift_premium_from_points (migration_2026_09_04_gift_premium.sql) but
-- keyed by an admin-issued code instead of a friend's referral code. Real
-- store-level "offer codes" already exist natively in App Store Connect/
-- Play Console for actual subscription discounts; this is a separate,
-- simpler mechanism for hand-issued full-Premium-day grants (giveaways,
-- partnerships, support goodwill) that doesn't touch either store.
create table if not exists promo_codes (
  code text primary key,
  premium_days int not null check (premium_days > 0),
  max_redemptions int not null default 1 check (max_redemptions > 0),
  redeemed_count int not null default 0,
  expires_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);
alter table promo_codes enable row level security;
drop policy if exists "Public read/insert/update/delete" on promo_codes;
create policy "Public read/insert/update/delete" on promo_codes for all using (true) with check (true);

create table if not exists promo_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  code text not null references promo_codes (code) on delete cascade,
  user_id text not null,
  redeemed_at timestamptz not null default now(),
  unique (code, user_id)
);
alter table promo_code_redemptions enable row level security;
drop policy if exists "Public read/insert" on promo_code_redemptions;
create policy "Public read/insert" on promo_code_redemptions for all using (true) with check (true);

-- security definer so the redemption-count bump + Premium grant happen
-- atomically, same reasoning as gift_premium_from_points.
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
begin
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

-- Manual refund/chargeback log — a record-keeping panel, not a live
-- payment-processor integration (Apple/Google don't push refund events
-- to this app anywhere yet); an admin enters what they see in App Store
-- Connect/Play Console's own refund reports.
create table if not exists refund_log (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  user_label text,
  amount_usd numeric,
  platform text check (platform in ('iOS', 'Android', 'other')),
  reason text,
  admin_note text,
  created_at timestamptz not null default now()
);
alter table refund_log enable row level security;
drop policy if exists "Public read/insert/delete" on refund_log;
create policy "Public read/insert/delete" on refund_log for all using (true) with check (true);

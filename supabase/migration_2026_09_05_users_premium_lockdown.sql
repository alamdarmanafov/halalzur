-- Closes the single most severe gap found in this audit: `users` has had
-- "Public update using (true) with check (true)" since the very first
-- schema — needed for real self-service edits (name, language,
-- muted_notification_types, referral_code, last_seen_at) — but that
-- policy was never narrowed to exclude plan/premium_expires_at/
-- claimed_achievements/banned/ban_reason. Concretely: anyone holding the
-- app's public anon key (trivially extractable from any install) could
-- grant themselves permanent free Premium, or un-ban themselves, or ban
-- someone else, with a single direct PATCH to Supabase's REST API --
-- entirely outside the app, no purchase, no referral, no exploit chain
-- needed. verify-purchase.js's own comment already flagged that this
-- policy was the root cause of the original "PATCH yourself into
-- Premium" bug it fixed for the *purchase* path specifically, but the
-- underlying RLS was never actually closed — every other write path
-- (referral/points/achievement/promo Premium grants, all now server-side
-- via SECURITY DEFINER functions) remained exposed to the same PATCH.
--
-- Column-level REVOKE (the technique used for users.email/sync_token in
-- earlier migrations) doesn't work here: Supabase has exactly one
-- Postgres role for every logged-in user regardless of admin status
-- (`authenticated`) plus `anon` for signed-out/no-session requests --
-- admin-panel's own admin session IS `authenticated`, indistinguishable
-- from any other signed-in user's REST calls at the role level. Only a
-- row-aware check (is_admin(), or "was this actually issued by one of
-- our trusted SECURITY DEFINER functions") can tell them apart, so this
-- uses a trigger instead: current_user reveals which of those it was
-- (client roles are anon/authenticated; a SECURITY DEFINER function like
-- grant_achievement_premium/redeem_points_for_premium/
-- gift_premium_from_points/redeem_promo_code/merge_users runs as its
-- owner role, e.g. postgres, for the duration of its execution; Vercel
-- functions use service_role). Anything else reaching this table
-- directly as anon/authenticated, without is_admin() true, has these
-- five columns silently forced back to their prior/default value rather
-- than erroring — same "just don't let it happen" posture as this
-- session's other RLS fixes.

create or replace function protect_premium_fields() returns trigger
language plpgsql
as $$
begin
  if current_user in ('anon', 'authenticated') and not is_admin() then
    if TG_OP = 'INSERT' then
      new.plan := 'free';
      new.premium_expires_at := null;
      new.claimed_achievements := '{}';
      new.banned := false;
      new.ban_reason := null;
    else
      new.plan := old.plan;
      new.premium_expires_at := old.premium_expires_at;
      new.claimed_achievements := old.claimed_achievements;
      new.banned := old.banned;
      new.ban_reason := old.ban_reason;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_premium_fields on users;
create trigger trg_protect_premium_fields
before insert or update on users
for each row execute function protect_premium_fields();

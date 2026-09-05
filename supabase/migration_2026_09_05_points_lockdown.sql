-- Closes a free-Premium exploit: `user_points` had "Public insert"/
-- "Public update" policies (using (true)), so anyone holding the app's
-- public anon key could set ANY account's points balance to any number
-- directly — e.g. `update user_points set points = 999999 where user_id
-- = '<their own id>'` — with zero connection to a real referral or
-- approved submission. redeem_points_for_premium() (see
-- migration_2026_09_04_server_side_reward_premium.sql) already deducts
-- and grants Premium atomically and safely, but it trusts
-- user_points.points as ground truth, so a forged balance there was a
-- direct path to unlimited free Premium. gift_premium_from_points() has
-- the same dependency.
--
-- points_log has the same "Public insert" hole (lower stakes — it only
-- feeds the admin panel's "this month's most active" leaderboard display
-- — but no reason to leave it forgeable either).
--
-- Both tables are still written directly by the admin panel (approval
-- awards, manual point adjustments) using the admin's own real,
-- is_admin()-checkable Supabase session — see admin-panel/index.html's
-- approveSubmission()/adjustUserPoints() — so gating writes behind
-- is_admin() keeps that working unchanged.

drop policy if exists "Public insert" on user_points;
drop policy if exists "Public update" on user_points;
create policy "Admin insert" on user_points for insert with check (is_admin());
create policy "Admin update" on user_points for update using (is_admin()) with check (is_admin());

drop policy if exists "Public insert" on points_log;
create policy "Admin insert" on points_log for insert with check (is_admin());

-- referrals also had "Public insert" (using check(true)): anyone could
-- insert an arbitrary {referrer_id, referred_id} row directly — skipping
-- redeemReferralCode's "does this code actually exist" check entirely —
-- and referred_id's unique constraint only capped it at one forged
-- referral per account they control, not zero. Folding the whole
-- redemption (code lookup, self-referral check, the insert, and the
-- points award) into one security-definer function, same pattern as
-- redeem_promo_code, closes that: the insert only ever happens after
-- this function itself has verified the code, and only this function
-- (or admin/service_role) can ever create a referrals row.
drop policy if exists "Public insert" on referrals;

create or replace function redeem_referral_code(p_user_id text, p_code text)
returns table (referrer_id text, referrer_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(trim(p_code));
  v_owner_id text;
  v_owner_name text;
  v_referred_name text;
  v_amount constant int := 20; -- must match lib/referrals.ts's REFERRAL_BONUS_POINTS
begin
  if v_code = '' then
    return;
  end if;

  select id, name into v_owner_id, v_owner_name from users where referral_code = v_code;
  if v_owner_id is null or v_owner_id = p_user_id then
    return; -- code not found, or a self-referral attempt
  end if;

  begin
    insert into referrals (referrer_id, referred_id) values (v_owner_id, p_user_id);
  exception when unique_violation then
    return; -- this account already redeemed a code (referred_id is unique)
  end;

  select name into v_referred_name from users where id = p_user_id;

  insert into user_points (user_id, user_name, points, updated_at)
  values (v_owner_id, v_owner_name, v_amount, now())
  on conflict (user_id) do update
    set points = user_points.points + v_amount, user_name = excluded.user_name, updated_at = now();

  insert into user_points (user_id, user_name, points, updated_at)
  values (p_user_id, v_referred_name, v_amount, now())
  on conflict (user_id) do update
    set points = user_points.points + v_amount, user_name = excluded.user_name, updated_at = now();

  insert into points_log (user_id, user_name, amount) values (v_owner_id, v_owner_name, v_amount);
  insert into points_log (user_id, user_name, amount) values (p_user_id, v_referred_name, v_amount);

  referrer_id := v_owner_id;
  referrer_name := v_owner_name;
  return next;
end;
$$;

grant execute on function redeem_referral_code(text, text) to anon, authenticated;

-- refund_log: entirely admin-panel-driven (see admin-panel/index.html's
-- refund tab — read, insert, and delete all go through the admin's own
-- session) with no legitimate app-side write, so the "Public
-- read/insert/delete" policy was pure over-permissioning: anyone with
-- the anon key could forge or delete refund records.
drop policy if exists "Public read/insert/delete" on refund_log;
create policy "Admin select" on refund_log for select using (is_admin());
create policy "Admin insert" on refund_log for insert with check (is_admin());
create policy "Admin delete" on refund_log for delete using (is_admin());

-- broadcast_log: inserted only by admin-panel/lib/broadcast.js using the
-- service_role key (bypasses RLS regardless of policy), never from the
-- app or an anon/authenticated session — so "Public insert" served no
-- purpose and "Public read" needlessly exposed every broadcast's content
-- and per-send delivery counts to anyone holding the anon key.
drop policy if exists "Public read/insert" on broadcast_log;
create policy "Admin select" on broadcast_log for select using (is_admin());

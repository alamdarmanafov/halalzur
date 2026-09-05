-- Run this in Supabase → SQL Editor. Safe to run more than once.
--
-- Two changes to the referral-milestone bonus (grant_referral_milestone_bonus,
-- added in migration_2026_09_04_server_side_reward_premium.sql):
--
-- 1. Reward sizes changed to 30/60/90 days' worth at the existing 5/10/25
--    invite thresholds.
-- 2. The reward is no longer an automatic direct Premium grant — it's now
--    a credited points balance (days * 10, matching lib/points.ts's
--    POINTS_PER_PREMIUM_DAY) that the person redeems into Premium
--    themselves whenever they want, through the same self-redeem flow
--    (redeemPointsForPremium / redeem_points_for_premium) as any other
--    earned points.
--
-- Each milestone still fires exactly once per account, tracked the same
-- way via users.granted_referral_milestones.

create or replace function grant_referral_milestone_bonus(p_user_id text)
returns table (granted_points int, milestone_days int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_milestone record;
  v_user_name text;
  v_points int;
begin
  select count(*) into v_count from referrals where referrer_id = p_user_id;

  -- Must match lib/referrals.ts's REFERRAL_MILESTONES.
  select m.threshold, m.days into v_milestone from (
    values (5, 30), (10, 60), (25, 90)
  ) as m(threshold, days)
  where m.threshold <= v_count
    and not (m.threshold = any (
      select coalesce(u.granted_referral_milestones, '{}') from users u where u.id = p_user_id
    ))
  order by m.threshold desc
  limit 1;

  if v_milestone is null then
    return;
  end if;

  select name into v_user_name from users where id = p_user_id;
  if not found then
    return;
  end if;

  v_points := v_milestone.days * 10; -- must match lib/points.ts's POINTS_PER_PREMIUM_DAY

  insert into user_points (user_id, user_name, points, updated_at)
  values (p_user_id, v_user_name, v_points, now())
  on conflict (user_id) do update
    set points = user_points.points + v_points, user_name = excluded.user_name, updated_at = now();

  insert into points_log (user_id, user_name, amount) values (p_user_id, v_user_name, v_points);

  update users
  set granted_referral_milestones = array_append(coalesce(granted_referral_milestones, '{}'), v_milestone.threshold),
      updated_at = now()
  where id = p_user_id;

  granted_points := v_points;
  milestone_days := v_milestone.days;
  return next;
end;
$$;

grant execute on function grant_referral_milestone_bonus(text) to anon, authenticated;

-- Run this in Supabase → SQL Editor. Safe to run more than once.
--
-- Unifies the last remaining "direct Premium grant" reward path onto the
-- same points currency referral milestones already use (see
-- migration_2026_09_05_referral_milestones_to_points.sql for the same
-- move, done for the same reason: one balance, one redeem flow, instead
-- of two different reward mechanics both triggered by product-submission
-- activity — achievement tiers granting Premium directly while approved
-- submissions separately earn admin-panel points into user_points).
--
-- grant_achievement_premium (added in
-- migration_2026_09_04_server_side_reward_premium.sql, tiers last touched
-- in migration_2026_09_05_achievement_tiers_update.sql) extended
-- users.premium_expires_at directly. Replaced with grant_achievement_points,
-- which credits user_points instead — the tier's `days` value times
-- POINTS_PER_PREMIUM_DAY (10, must match lib/points.ts), the same
-- conversion rate referral milestones use. The person redeems the points
-- into Premium themselves via the existing redeemPointsForPremium flow
-- (or gifts them, same as any other earned points).
--
-- Return columns changed (granted_days/tier_threshold/new_expires_at →
-- granted_points/tier_threshold), and Postgres won't let CREATE OR REPLACE
-- change a function's OUT-parameter row type — the old signature must be
-- dropped first.
drop function if exists grant_achievement_premium(text);

create or replace function grant_achievement_points(p_user_id text)
returns table (granted_points int, tier_threshold int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_tier record;
  v_user_name text;
  v_points int;
begin
  select count(*) into v_count
  from product_submissions
  where submitted_by = p_user_id and review_status = 'approved';

  -- Must match lib/achievements.ts's ACHIEVEMENT_TIERS.
  select t.threshold, t.days into v_tier from (
    values (1,1), (5,7), (10,30), (20,60), (30,90), (50,180), (75,270), (100,365)
  ) as t(threshold, days)
  where t.threshold <= v_count
    and not (t.threshold = any (
      select coalesce(u.claimed_achievements, '{}') from users u where u.id = p_user_id
    ))
  order by t.threshold desc
  limit 1;

  if v_tier is null then
    return;
  end if;

  select name into v_user_name from users where id = p_user_id;
  if not found then
    return;
  end if;

  v_points := v_tier.days * 10; -- must match lib/points.ts's POINTS_PER_PREMIUM_DAY

  insert into user_points (user_id, user_name, points, updated_at)
  values (p_user_id, v_user_name, v_points, now())
  on conflict (user_id) do update
    set points = user_points.points + v_points, user_name = excluded.user_name, updated_at = now();

  insert into points_log (user_id, user_name, amount) values (p_user_id, v_user_name, v_points);

  update users
  set claimed_achievements = array_append(coalesce(claimed_achievements, '{}'), v_tier.threshold),
      updated_at = now()
  where id = p_user_id;

  granted_points := v_points;
  tier_threshold := v_tier.threshold;
  return next;
end;
$$;

grant execute on function grant_achievement_points(text) to anon, authenticated;

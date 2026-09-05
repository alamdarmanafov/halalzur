-- Run this in Supabase → SQL Editor. Safe to run more than once.
--
-- Bumps the achievement-tier (approved-submission) Premium rewards to
-- match the referral-milestone scheme: same thresholds (1/5/10/20/30/
-- 50/75/100 approved submissions), larger days at each tier from the
-- 5-submission mark up. This grant stays a direct automatic Premium
-- extension (unlike the referral milestones, which now pay points) —
-- only the day amounts changed. See grant_achievement_premium, added in
-- migration_2026_09_04_server_side_reward_premium.sql.

create or replace function grant_achievement_premium(p_user_id text)
returns table (granted_days int, tier_threshold int, new_expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_tier record;
  v_current_plan text;
  v_current_expires timestamptz;
  v_base timestamptz;
  v_new_expires timestamptz;
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

  select plan, premium_expires_at into v_current_plan, v_current_expires from users where id = p_user_id;
  if not found then
    return;
  end if;

  v_base := case
    when v_current_plan = 'premium' and v_current_expires is not null and v_current_expires > now()
    then v_current_expires
    else now()
  end;
  v_new_expires := v_base + (v_tier.days || ' days')::interval;

  update users
  set plan = 'premium',
      premium_expires_at = v_new_expires,
      claimed_achievements = array_append(coalesce(claimed_achievements, '{}'), v_tier.threshold),
      updated_at = now()
  where id = p_user_id;

  granted_days := v_tier.days;
  tier_threshold := v_tier.threshold;
  new_expires_at := v_new_expires;
  return next;
end;
$$;

grant execute on function grant_achievement_premium(text) to anon, authenticated;

-- Run this in Supabase → SQL Editor. Safe to run more than once.
--
-- Closes the smaller, lower-urgency gap flagged in
-- admin-panel/api/verify-purchase.js's header comment: referral-milestone
-- and achievement Premium grants used to be computed entirely client-side
-- (lib/referrals.ts's grantMilestoneBonusIfEarned, lib/auth-context.tsx's
-- grantAchievementPremium) and then written straight to users.plan via
-- the same open ("Public update") RLS policy real profile edits need —
-- so anyone holding the public anon key could PATCH themselves into
-- Premium by claiming a referral count or approved-submission count they
-- never actually had, the same class of bypass the purchase-verification
-- fix closed for real purchases.
--
-- Fix: two security-definer functions recompute eligibility from the
-- actual `referrals` / `product_submissions` rows (not a client-supplied
-- number) and track which milestones/tiers have already been granted, so
-- calling either function — with any user id, since this app has no
-- server-verified per-request identity to check against — can only ever
-- grant a reward that id has genuinely already earned; it can no longer
-- be used to self-grant free Premium out of thin air.

alter table users add column if not exists granted_referral_milestones int[] not null default '{}';

create or replace function grant_referral_milestone_bonus(p_user_id text)
returns table (granted_days int, new_expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_milestone record;
  v_current_plan text;
  v_current_expires timestamptz;
  v_base timestamptz;
  v_new_expires timestamptz;
begin
  select count(*) into v_count from referrals where referrer_id = p_user_id;

  -- Must match lib/referrals.ts's REFERRAL_MILESTONES.
  select m.threshold, m.days into v_milestone from (
    values (5, 30), (10, 60), (25, 180)
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

  select plan, premium_expires_at into v_current_plan, v_current_expires from users where id = p_user_id;
  if not found then
    return;
  end if;

  v_base := case
    when v_current_plan = 'premium' and v_current_expires is not null and v_current_expires > now()
    then v_current_expires
    else now()
  end;
  v_new_expires := v_base + (v_milestone.days || ' days')::interval;

  update users
  set plan = 'premium',
      premium_expires_at = v_new_expires,
      granted_referral_milestones = array_append(coalesce(granted_referral_milestones, '{}'), v_milestone.threshold),
      updated_at = now()
  where id = p_user_id;

  granted_days := v_milestone.days;
  new_expires_at := v_new_expires;
  return next;
end;
$$;

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
    values (1,1), (5,3), (10,7), (20,14), (30,30), (50,90), (75,180), (100,365)
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

-- Same fix applied to lib/points.ts's redeemPointsForPremium: it already
-- read a real points balance and deducted it correctly, but the actual
-- Premium grant then happened as a second, separate client write through
-- the same open users.plan policy, trusting the day count the client
-- passed back rather than recomputing it — and being two non-atomic
-- steps, a crash between them could deduct points without ever granting
-- the time. This does both in one transaction.
create or replace function redeem_points_for_premium(p_user_id text)
returns table (granted_days int, new_expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points int;
  v_days int;
  v_spent int;
  v_current_plan text;
  v_current_expires timestamptz;
  v_base timestamptz;
  v_new_expires timestamptz;
begin
  select points into v_points from user_points where user_id = p_user_id;
  v_points := coalesce(v_points, 0);

  -- Must match lib/points.ts's POINTS_PER_PREMIUM_DAY (10) / MIN_REDEEMABLE_DAYS (3).
  v_days := floor(v_points / 10);
  if v_days < 3 then
    return;
  end if;
  v_spent := v_days * 10;

  update user_points
  set points = points - v_spent, updated_at = now()
  where user_id = p_user_id;

  select plan, premium_expires_at into v_current_plan, v_current_expires from users where id = p_user_id;
  if not found then
    return;
  end if;

  v_base := case
    when v_current_plan = 'premium' and v_current_expires is not null and v_current_expires > now()
    then v_current_expires
    else now()
  end;
  v_new_expires := v_base + (v_days || ' days')::interval;

  update users
  set plan = 'premium', premium_expires_at = v_new_expires, updated_at = now()
  where id = p_user_id;

  granted_days := v_days;
  new_expires_at := v_new_expires;
  return next;
end;
$$;

-- Callable by anon/authenticated (Supabase's default for new functions) —
-- deliberately not admin-gated, every user needs to trigger their own
-- reward check. Safe to be public: each function only ever pays out
-- against rows already committed to referrals/product_submissions/
-- user_points by legitimate flows, never a client-supplied number.
grant execute on function grant_referral_milestone_bonus(text) to anon, authenticated;
grant execute on function grant_achievement_premium(text) to anon, authenticated;
grant execute on function redeem_points_for_premium(text) to anon, authenticated;

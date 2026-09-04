-- "Hədiyyə abunəlik" — a user spends their own earned points (the same
-- currency redeem_points_for_premium already lets them redeem for
-- themselves) to gift Premium days to a friend, found by referral code.
-- Real store-level subscription gifting isn't offered by react-native-iap/
-- StoreKit here, so this reuses the existing points economy instead of
-- requiring a new IAP product (which would need App Store Connect/Play
-- Console setup and a fresh build).
--
-- security definer so the point deduction + Premium grant happen in one
-- atomic transaction, following the same pattern as
-- migration_2026_09_04_server_side_reward_premium.sql's three functions —
-- the grant decision depends only on real committed rows (the sender's
-- actual point balance, the recipient's actual referral code), never a
-- client-supplied number.
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
begin
  if p_days is null or p_days < 1 then
    return;
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

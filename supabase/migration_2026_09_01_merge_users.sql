-- Run this in Supabase → SQL Editor. Adds a merge_users(primary_id,
-- duplicate_id) function the admin panel's "Dublikat hesabları birləşdir"
-- tool calls via RPC. Everything happens in one transaction (a single
-- Postgres function call) rather than a sequence of REST requests from
-- the browser, since a merge touches ~10 tables — several with a
-- unique(user_id, X) constraint that needs conflict handling — and a
-- half-finished merge from a dropped connection would be much worse than
-- an all-or-nothing failure. Safe to run more than once.

create or replace function merge_users(primary_id text, duplicate_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not authorized';
  end if;
  if primary_id is null or duplicate_id is null or primary_id = duplicate_id then
    raise exception 'primary_id and duplicate_id must be different, non-null user ids';
  end if;
  if not exists (select 1 from users where id = primary_id) then
    raise exception 'primary user % not found', primary_id;
  end if;
  if not exists (select 1 from users where id = duplicate_id) then
    raise exception 'duplicate user % not found', duplicate_id;
  end if;

  -- Tables with unique(user_id, X): move the duplicate's rows only where
  -- the primary doesn't already have one for the same X — the primary's
  -- own row wins any tie — then drop whatever's left over.
  insert into favorites (user_id, barcode, data, created_at)
    select primary_id, barcode, data, created_at from favorites where user_id = duplicate_id
  on conflict (user_id, barcode) do nothing;
  delete from favorites where user_id = duplicate_id;

  insert into product_ratings (user_id, barcode, rating, updated_at)
    select primary_id, barcode, rating, updated_at from product_ratings where user_id = duplicate_id
  on conflict (user_id, barcode) do nothing;
  delete from product_ratings where user_id = duplicate_id;

  insert into brand_follows (user_id, brand, created_at)
    select primary_id, brand, created_at from brand_follows where user_id = duplicate_id
  on conflict (user_id, brand) do nothing;
  delete from brand_follows where user_id = duplicate_id;

  insert into product_recommendations (user_id, barcode, created_at)
    select primary_id, barcode, created_at from product_recommendations where user_id = duplicate_id
  on conflict (user_id, barcode) do nothing;
  delete from product_recommendations where user_id = duplicate_id;

  insert into place_recommendations (user_id, place_id, created_at)
    select primary_id, place_id, created_at from place_recommendations where user_id = duplicate_id
  on conflict (user_id, place_id) do nothing;
  delete from place_recommendations where user_id = duplicate_id;

  -- user_points has one row per user (user_id is its primary key), so
  -- sum the two totals instead of skip-on-conflict.
  if exists (select 1 from user_points where user_id = duplicate_id) then
    insert into user_points (user_id, user_name, points)
      select primary_id, coalesce((select user_name from user_points where user_id = primary_id), user_name), points
      from user_points where user_id = duplicate_id
    on conflict (user_id) do update set points = user_points.points + excluded.points;
    delete from user_points where user_id = duplicate_id;
  end if;

  -- referrals.referred_id is unique (a user is referred at most once) —
  -- only adopt the duplicate's "who referred me" record if the primary
  -- doesn't already have one of its own.
  if exists (select 1 from referrals where referred_id = duplicate_id)
     and not exists (select 1 from referrals where referred_id = primary_id) then
    update referrals set referred_id = primary_id where referred_id = duplicate_id;
  else
    delete from referrals where referred_id = duplicate_id;
  end if;
  -- referrer_id has no such constraint — every invite the duplicate sent
  -- out now counts toward the primary.
  update referrals set referrer_id = primary_id where referrer_id = duplicate_id;

  -- Plain reassignment — no per-user uniqueness constraint on these.
  update device_tokens set user_id = primary_id where user_id = duplicate_id;
  update product_submissions set submitted_by = primary_id where submitted_by = duplicate_id;
  update feedback_reports set user_id = primary_id where user_id = duplicate_id;
  update purchase_events set user_id = primary_id where user_id = duplicate_id;
  update points_log set user_id = primary_id where user_id = duplicate_id;

  -- Fold the duplicate's own users-row fields into the primary's, then
  -- drop the duplicate row itself.
  update users u set
    plan = case when d.plan = 'premium' then 'premium' else u.plan end,
    premium_expires_at = case
      when u.premium_expires_at is null and d.premium_expires_at is null then null
      else greatest(coalesce(u.premium_expires_at, '-infinity'::timestamptz), coalesce(d.premium_expires_at, '-infinity'::timestamptz))
    end,
    claimed_achievements = (
      select coalesce(array_agg(distinct x order by x), '{}')
      from unnest(u.claimed_achievements || d.claimed_achievements) x
    )
  from users d
  where u.id = primary_id and d.id = duplicate_id;

  delete from users where id = duplicate_id;
end;
$$;

revoke all on function merge_users(text, text) from public;
grant execute on function merge_users(text, text) to authenticated;

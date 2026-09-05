-- Closes the same IDOR pattern as favorites/ratings/brand_follows on the
-- two remaining fully-open tables: product_recommendations and
-- place_recommendations both had "Public insert/update/delete" (using
-- (true)) with a client-supplied user_id nothing verified. Anyone with
-- the anon key could insert a fake "tövsiyə et" as any user (inflating a
-- product/place's public recommend count and the admin panel's "most
-- recommended" reports) or delete someone else's real recommendation.
--
-- product_recommendations keeps an admin-only update/delete policy on
-- top of the token-gated RPCs below — admin-panel/index.html's
-- mergeProducts() reassigns/deletes recommendation rows by barcode
-- across many different users' rows when two duplicate products are
-- merged, which doesn't fit the per-caller RPC shape the way a user's
-- own toggle does. place_recommendations has no equivalent admin
-- feature (admin-panel only ever reads it), so it needs no such
-- carve-out.

drop policy if exists "Public insert" on product_recommendations;
drop policy if exists "Public update" on product_recommendations;
drop policy if exists "Public delete" on product_recommendations;

create policy "Admin update" on product_recommendations for update using (is_admin()) with check (is_admin());
create policy "Admin delete" on product_recommendations for delete using (is_admin());

create or replace function recommend_product_add(p_user_id text, p_token uuid, p_barcode text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into product_recommendations (user_id, barcode)
  select p_user_id, p_barcode
  where exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token)
  on conflict (user_id, barcode) do nothing;
$$;

create or replace function recommend_product_remove(p_user_id text, p_token uuid, p_barcode text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from product_recommendations r
  where r.user_id = p_user_id and r.barcode = p_barcode
    and exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token);
$$;

grant execute on function recommend_product_add(text, uuid, text) to anon, authenticated;
grant execute on function recommend_product_remove(text, uuid, text) to anon, authenticated;

drop policy if exists "Public insert" on place_recommendations;
drop policy if exists "Public delete" on place_recommendations;

create or replace function recommend_place_add(p_user_id text, p_token uuid, p_place_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into place_recommendations (user_id, place_id)
  select p_user_id, p_place_id
  where exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token)
  on conflict (user_id, place_id) do nothing;
$$;

create or replace function recommend_place_remove(p_user_id text, p_token uuid, p_place_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from place_recommendations r
  where r.user_id = p_user_id and r.place_id = p_place_id
    and exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token);
$$;

grant execute on function recommend_place_add(text, uuid, uuid) to anon, authenticated;
grant execute on function recommend_place_remove(text, uuid, uuid) to anon, authenticated;

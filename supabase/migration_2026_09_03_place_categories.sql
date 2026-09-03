-- Run this in Supabase → SQL Editor.
--
-- Adds 3 new place categories (şirniyyat mağazası/sweets shop, qəssabxana/
-- butcher, market/grocery store) alongside the existing restoran/kafe/
-- coffee_shop — admin panel and app code already updated to know about
-- them. Safe to run more than once.

-- places.category has a check constraint limiting it to the old 3 values
-- — without widening it, the admin panel's "Məkanı əlavə et" would fail
-- with a check-constraint violation the moment one of the new categories
-- is picked. Auto-named by Postgres since the original had no explicit
-- constraint name.
alter table places drop constraint if exists places_category_check;
alter table places add constraint places_category_check
  check (category in ('restoran', 'kafe', 'coffee_shop', 'sirniyyat', 'qessabxana', 'market'));

-- Seeds place_category_icons so the admin panel's icon-editor PATCH
-- (which only updates existing rows) has something to update.
insert into place_category_icons (category, icon) values
  ('sirniyyat', '🍬'),
  ('qessabxana', '🥩'),
  ('market', '🛒')
on conflict (category) do nothing;

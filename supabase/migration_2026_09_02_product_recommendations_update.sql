-- Run this in Supabase → SQL Editor.
--
-- The admin panel's "merge duplicate products" action (mergeProducts() in
-- admin-panel/index.html) reassigns a dropped product's recommendation
-- rows to the surviving product's barcode via PATCH — but
-- product_recommendations only had select/insert/delete policies, no
-- update. RLS silently rejected the PATCH (0 rows affected, no error),
-- so merging two duplicate products quietly dropped the "who recommended
-- this" signal for whichever product got merged away. Safe to run more
-- than once.
drop policy if exists "Public update" on product_recommendations;
create policy "Public update" on product_recommendations
  for update using (true) with check (true);

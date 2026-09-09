-- Run this in Supabase → SQL Editor. Safe to run more than once.
--
-- Not a certifier — same placeholder role as 'openfoodfacts' and
-- 'azexport' (see migration_2026_09_02_azexport_certifier.sql): barcoded
-- items pulled from a Wolt venue link (admin-panel's "Linkdən qiymət
-- çək" import) get inserted as status='unknown' rows tagged with this
-- id, never a real halal claim.
insert into certifiers (id, name, short_name, country, source_url) values
  ('wolt', 'Wolt (market tətbiqi, hələ yoxlanılmayıb)', 'Wolt', 'Azərbaycan', 'https://wolt.com/')
on conflict (id) do nothing;

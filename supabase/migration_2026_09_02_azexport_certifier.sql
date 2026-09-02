-- Run this in Supabase → SQL Editor.
--
-- Not a certifier — same placeholder role as 'openfoodfacts', for
-- scripts/sync/azexport.ts's bulk import from azexport.az (AZPROMO's
-- export directory, real Azerbaijani-market products with real
-- barcodes). Every row synced under this id is status='unknown': it's
-- raw product data, not a halal claim. Required before running the
-- azexport sync — certified_entries.certifier_id is a foreign key into
-- this table. Safe to run more than once.
insert into certifiers (id, name, short_name, country, source_url) values
  ('azexport', 'AzExport.az (açıq baza, hələ yoxlanılmayıb)', 'AzExport', 'Azərbaycan', 'https://azexport.az/')
on conflict (id) do nothing;

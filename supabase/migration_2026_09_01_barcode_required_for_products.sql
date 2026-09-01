-- One-time migration: makes it impossible for any future insert path
-- (sync scripts, admin panel forms/CSV import, or a manual SQL script
-- run more than once) to create a 'product' row with no barcode.
-- 'company' rows (GIMDES-style brand-level certificates, including the
-- AZSTANDART ones) are unaffected — they're supposed to have no barcode.
--
-- Run this once in Supabase → SQL Editor. If it fails with a check
-- violation, you still have some entry_type='product' rows with a null
-- barcode somewhere — find them first with:
--   select id, brand, product_name, certifier_id from certified_entries
--   where entry_type = 'product' and barcode is null;
-- then either delete them or set entry_type to 'company' as appropriate,
-- and re-run this migration.

alter table certified_entries
  add constraint chk_product_requires_barcode check (entry_type <> 'product' or barcode is not null);

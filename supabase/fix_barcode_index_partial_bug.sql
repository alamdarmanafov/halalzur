-- Fixes the partial-unique-index bug: certified_entries.barcode's index
-- was created with `where barcode is not null`, but Postgres will not
-- use a partial unique index as an ON CONFLICT target unless the INSERT
-- repeats that exact WHERE clause — which Supabase's
-- .upsert({ onConflict: 'barcode' }) has no way to do, so the Open Food
-- Facts sync always failed its preflight check with "there is no unique
-- or exclusion constraint matching the ON CONFLICT specification" even
-- though the index existed. Run this once in Supabase → SQL Editor.

drop index if exists idx_certified_entries_barcode_unique;

create unique index idx_certified_entries_barcode_unique
  on certified_entries (barcode);

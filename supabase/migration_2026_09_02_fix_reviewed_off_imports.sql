-- Run this in Supabase -> SQL Editor. One-time data fix, not a schema
-- change (not folded into schema.sql).
--
-- scripts/sync/openFoodFacts.ts imports every Open Food Facts product
-- with certifier_id='openfoodfacts' and a notes field saying "halal
-- statusu hələ yoxlanılmayıb" (status not yet verified) — correct at
-- import time, since every such row starts at status='unknown'.
--
-- But once an admin later reviews one of these (accepting the E-code-
-- based status suggestion, or setting a status by hand) via the admin
-- panel's product edit form or its bulk status-change action, the
-- product's `status` changed while `certifier_id`/`notes` stayed exactly
-- as imported — so the product detail screen ended up showing a
-- confirmed "✓ HALAL" badge right next to a certifier card and note both
-- still saying "not yet verified". The admin panel no longer does this
-- (see updateProduct / the bulk status-change handler in
-- admin-panel/index.html) — this migration corrects every row already
-- affected before that fix shipped. Safe to run more than once.
update certified_entries
set certifier_id = 'halalzur', notes = null
where certifier_id = 'openfoodfacts' and status <> 'unknown';

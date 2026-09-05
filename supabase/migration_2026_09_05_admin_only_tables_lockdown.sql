-- ignored_scan_barcodes and place_category_icons are never written by
-- the app (only admin-panel/index.html touches either), so their
-- "Public insert/delete"/"Public update" policies were pure over-
-- permissioning left open with no legitimate anon-key user. Concretely:
-- anyone could insert arbitrary barcodes into ignored_scan_barcodes to
-- make a real popular unclassified product silently disappear from the
-- admin's "Ən çox axtarılan naməlum məhsullar" review widget, or repaint
-- place_category_icons (cosmetic, but still no reason to leave open).
-- Select stays public on ignored_scan_barcodes — the anon-facing
-- unclassified_scan_counts view (security_invoker = true) needs it to
-- evaluate its own WHERE clause for the anon role.

drop policy if exists "Public insert" on ignored_scan_barcodes;
create policy "Admin insert" on ignored_scan_barcodes for insert with check (is_admin());

drop policy if exists "Public delete" on ignored_scan_barcodes;
create policy "Admin delete" on ignored_scan_barcodes for delete using (is_admin());

drop policy if exists "Public update" on place_category_icons;
create policy "Admin update" on place_category_icons for update using (is_admin()) with check (is_admin());

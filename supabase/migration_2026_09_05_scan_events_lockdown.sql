-- scan_events had "Public delete" (using (true)) with no scoping at
-- all — anyone with the anon key could wipe the app's entire scan
-- history (the admin Dashboard's daily/weekly/monthly/yearly usage
-- counts), not just a specific barcode's rows. The only legitimate
-- caller is admin-panel/index.html's dismissUnclassified() (clears a
-- barcode's scan events from the admin's own is_admin()-authenticated
-- session) — its own error message already anticipated this policy
-- might need to be admin-gated ("scan_events delete policy Supabase-də
-- işə salınmayıb"). Insert/select stay public: the app logs scans
-- anonymously (no user_id column at all) and the admin Dashboard's
-- counts aren't sensitive.
drop policy if exists "Public delete" on scan_events;
create policy "Admin delete" on scan_events for delete using (is_admin());

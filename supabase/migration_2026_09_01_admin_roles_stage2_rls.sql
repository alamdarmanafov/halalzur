-- STAGE 2 of 2 — run this ONLY after:
--   1. migration_2026_09_01_admin_roles_stage1.sql has been run,
--   2. you've created your Supabase Auth admin account and inserted
--      your admin_profiles row (see the bootstrap steps you were
--      given separately),
--   3. you've confirmed logging into the (newly deployed) admin panel
--      with that account works and you can still see your data.
--
-- This is the step that actually starts requiring is_admin() to write
-- to the tables the web admin panel exclusively manages. If something
-- looks wrong after running this, the fastest fix is to re-run the
-- OLD "using (true)" version of whichever policy is misbehaving —
-- every "create policy" below replaces exactly one named policy, so
-- reverting one table doesn't affect the others. Every drop/create pair
-- is idempotent — safe to run this whole file more than once.
--
-- NOT touched here (deliberately — see schema.sql's admin_profiles
-- comment for why): certified_entries insert, product_submissions
-- update, places insert, feedback_reports insert, users update.

-- certifiers
drop policy if exists "Public insert" on certifiers;
drop policy if exists "Admin insert" on certifiers;
create policy "Admin insert" on certifiers for insert with check (is_admin());
drop policy if exists "Public update" on certifiers;
drop policy if exists "Admin update" on certifiers;
create policy "Admin update" on certifiers for update using (is_admin()) with check (is_admin());
drop policy if exists "Public delete" on certifiers;
drop policy if exists "Admin delete" on certifiers;
create policy "Admin delete" on certifiers for delete using (is_admin());

-- certified_entries (insert stays open — app/admin.tsx's approval flow needs it)
drop policy if exists "Public update" on certified_entries;
drop policy if exists "Admin update" on certified_entries;
create policy "Admin update" on certified_entries for update using (is_admin()) with check (is_admin());
drop policy if exists "Public delete" on certified_entries;
drop policy if exists "Admin delete" on certified_entries;
create policy "Admin delete" on certified_entries for delete using (is_admin());

-- announcements
drop policy if exists "Public insert" on announcements;
drop policy if exists "Admin insert" on announcements;
create policy "Admin insert" on announcements for insert with check (is_admin());
drop policy if exists "Public update" on announcements;
drop policy if exists "Admin update" on announcements;
create policy "Admin update" on announcements for update using (is_admin()) with check (is_admin());
drop policy if exists "Public delete" on announcements;
drop policy if exists "Admin delete" on announcements;
create policy "Admin delete" on announcements for delete using (is_admin());

-- guide_articles (was one combined "for all" policy — split so select stays public)
drop policy if exists "Public read/insert/update/delete" on guide_articles;
drop policy if exists "Public read" on guide_articles;
create policy "Public read" on guide_articles for select using (true);
drop policy if exists "Admin write" on guide_articles;
create policy "Admin write" on guide_articles for insert with check (is_admin());
drop policy if exists "Admin update" on guide_articles;
create policy "Admin update" on guide_articles for update using (is_admin()) with check (is_admin());
drop policy if exists "Admin delete" on guide_articles;
create policy "Admin delete" on guide_articles for delete using (is_admin());

-- custom_ecodes
drop policy if exists "Public insert" on custom_ecodes;
drop policy if exists "Admin insert" on custom_ecodes;
create policy "Admin insert" on custom_ecodes for insert with check (is_admin());
drop policy if exists "Public delete" on custom_ecodes;
drop policy if exists "Admin delete" on custom_ecodes;
create policy "Admin delete" on custom_ecodes for delete using (is_admin());

-- haram_keywords (was one combined "for all" policy — split so select stays public)
drop policy if exists "Public read/insert/delete" on haram_keywords;
drop policy if exists "Public read" on haram_keywords;
create policy "Public read" on haram_keywords for select using (true);
drop policy if exists "Admin insert" on haram_keywords;
create policy "Admin insert" on haram_keywords for insert with check (is_admin());
drop policy if exists "Admin delete" on haram_keywords;
create policy "Admin delete" on haram_keywords for delete using (is_admin());

-- notification_templates
drop policy if exists "Public insert" on notification_templates;
drop policy if exists "Admin insert" on notification_templates;
create policy "Admin insert" on notification_templates for insert with check (is_admin());
drop policy if exists "Public delete" on notification_templates;
drop policy if exists "Admin delete" on notification_templates;
create policy "Admin delete" on notification_templates for delete using (is_admin());

-- scheduled_broadcasts
drop policy if exists "Public insert" on scheduled_broadcasts;
drop policy if exists "Admin insert" on scheduled_broadcasts;
create policy "Admin insert" on scheduled_broadcasts for insert with check (is_admin());
drop policy if exists "Public update" on scheduled_broadcasts;
drop policy if exists "Admin update" on scheduled_broadcasts;
create policy "Admin update" on scheduled_broadcasts for update using (is_admin()) with check (is_admin());

-- product_categories
drop policy if exists "Public insert" on product_categories;
drop policy if exists "Admin insert" on product_categories;
create policy "Admin insert" on product_categories for insert with check (is_admin());
drop policy if exists "Public update" on product_categories;
drop policy if exists "Admin update" on product_categories;
create policy "Admin update" on product_categories for update using (is_admin()) with check (is_admin());
drop policy if exists "Public delete" on product_categories;
drop policy if exists "Admin delete" on product_categories;
create policy "Admin delete" on product_categories for delete using (is_admin());

-- place_category_icons
drop policy if exists "Public update" on place_category_icons;
drop policy if exists "Admin update" on place_category_icons;
create policy "Admin update" on place_category_icons for update using (is_admin()) with check (is_admin());

-- app_versions
drop policy if exists "Public insert" on app_versions;
drop policy if exists "Admin insert" on app_versions;
create policy "Admin insert" on app_versions for insert with check (is_admin());
drop policy if exists "Public delete" on app_versions;
drop policy if exists "Admin delete" on app_versions;
create policy "Admin delete" on app_versions for delete using (is_admin());

-- places (insert stays open — the app's own "Məkan təklif et" submits directly)
drop policy if exists "Public update" on places;
drop policy if exists "Admin update" on places;
create policy "Admin update" on places for update using (is_admin()) with check (is_admin());
drop policy if exists "Public delete" on places;
drop policy if exists "Admin delete" on places;
create policy "Admin delete" on places for delete using (is_admin());

-- feedback_reports (insert stays open — the app submits feedback directly)
drop policy if exists "Public update" on feedback_reports;
drop policy if exists "Admin update" on feedback_reports;
create policy "Admin update" on feedback_reports for update using (is_admin()) with check (is_admin());
drop policy if exists "Public delete" on feedback_reports;
drop policy if exists "Admin delete" on feedback_reports;
create policy "Admin delete" on feedback_reports for delete using (is_admin());

-- audit_log — no legitimate consumer-app use case at all, tighten both read and write
drop policy if exists "Public read" on audit_log;
drop policy if exists "Admin read" on audit_log;
create policy "Admin read" on audit_log for select using (is_admin());
drop policy if exists "Public insert" on audit_log;
drop policy if exists "Admin insert" on audit_log;
create policy "Admin insert" on audit_log for insert with check (is_admin());

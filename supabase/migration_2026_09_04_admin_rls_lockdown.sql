-- Run this in Supabase → SQL Editor. Safe to run more than once.
--
-- Closes a systemic gap found in a follow-up security pass: several
-- tables that hold admin-authority content (product certification
-- status, certifiers, E-code definitions, categories, guide articles,
-- announcements, app-version gating, promo codes, submission review) had
-- RLS policies of the form `using (true)` with no is_admin() check at
-- all — the same "Public insert/update/delete" pattern legitimately used
-- elsewhere for actual user-owned data (favorites, points, etc.). Since
-- the public anon key is, by design, embedded in both the app bundle and
-- admin-panel/index.html's page source, this meant anyone holding it
-- could write to these tables directly via the Supabase REST API,
-- completely bypassing the admin panel's real authentication
-- (admin-panel/lib/verifyAdmin.js) — e.g. certify any product as Halal,
-- delete real certified entries, edit/delete certifiers or E-code
-- definitions, deface announcements, or mint their own promo_codes row
-- granting themselves unlimited Premium (the redeem_promo_code
-- throttle/validation added in migration_2026_09_04_security_hardening.sql
-- doesn't help if an attacker can just create the code they want).
--
-- Some of these tables (scheduled_broadcasts, notification_templates,
-- storage.objects for product-images, admin_profiles itself) already got
-- is_admin() gating in an earlier migration — this finishes that same
-- rollout on the tables it missed. is_admin()/is_super_admin() are
-- defined in schema.sql above admin_profiles; this migration must run
-- after that one.
--
-- Every table below was checked against the app's own client code first
-- (lib/*.ts, app/**/*.tsx) — see each table's comment for what remains
-- open and why. Nothing here changes how the admin panel itself writes:
-- it already authenticates with the logged-in admin's real Supabase Auth
-- session token (index.html's sb()/adminApiHeaders() helpers), which
-- is_admin() checks against admin_profiles — it never relied on RLS
-- being open.

-- ---------------------------------------------------------------------
-- certifiers, custom_ecodes, product_categories, announcements,
-- app_versions, winback_templates — zero legitimate non-admin write path
-- anywhere in the app; only the admin panel ever writes to these.
-- ---------------------------------------------------------------------
drop policy if exists "Public insert" on certifiers;
create policy "Admin insert" on certifiers for insert with check (is_admin());
drop policy if exists "Public update" on certifiers;
create policy "Admin update" on certifiers for update using (is_admin()) with check (is_admin());
drop policy if exists "Public delete" on certifiers;
create policy "Admin delete" on certifiers for delete using (is_admin());

drop policy if exists "Public insert" on custom_ecodes;
create policy "Admin insert" on custom_ecodes for insert with check (is_admin());
drop policy if exists "Public update" on custom_ecodes;
create policy "Admin update" on custom_ecodes for update using (is_admin()) with check (is_admin());
drop policy if exists "Public delete" on custom_ecodes;
create policy "Admin delete" on custom_ecodes for delete using (is_admin());

drop policy if exists "Public insert" on product_categories;
create policy "Admin insert" on product_categories for insert with check (is_admin());
drop policy if exists "Public update" on product_categories;
create policy "Admin update" on product_categories for update using (is_admin()) with check (is_admin());
drop policy if exists "Public delete" on product_categories;
create policy "Admin delete" on product_categories for delete using (is_admin());

drop policy if exists "Public insert" on announcements;
create policy "Admin insert" on announcements for insert with check (is_admin());
drop policy if exists "Public update" on announcements;
create policy "Admin update" on announcements for update using (is_admin()) with check (is_admin());
drop policy if exists "Public delete" on announcements;
create policy "Admin delete" on announcements for delete using (is_admin());

drop policy if exists "Public insert" on app_versions;
create policy "Admin insert" on app_versions for insert with check (is_admin());
drop policy if exists "Public delete" on app_versions;
create policy "Admin delete" on app_versions for delete using (is_admin());

drop policy if exists "Public update" on winback_templates;
create policy "Admin update" on winback_templates for update using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------
-- guide_articles, haram_keywords — same story, but their existing policy
-- covered select+insert+update+delete in one "for all" clause, so it has
-- to be split: select stays public (the app reads both), the rest goes
-- to is_admin().
-- ---------------------------------------------------------------------
drop policy if exists "Public read/insert/update/delete" on guide_articles;
create policy "Public read" on guide_articles for select using (true);
create policy "Admin insert" on guide_articles for insert with check (is_admin());
create policy "Admin update" on guide_articles for update using (is_admin()) with check (is_admin());
create policy "Admin delete" on guide_articles for delete using (is_admin());

drop policy if exists "Public read/insert/delete" on haram_keywords;
create policy "Public read" on haram_keywords for select using (true);
create policy "Admin insert" on haram_keywords for insert with check (is_admin());
create policy "Admin update" on haram_keywords for update using (is_admin()) with check (is_admin());
create policy "Admin delete" on haram_keywords for delete using (is_admin());

-- ---------------------------------------------------------------------
-- promo_codes, promo_code_redemptions — locked down entirely, including
-- select: no client code reads either table directly (redemption goes
-- through the redeem_promo_code security-definer RPC, which bypasses RLS
-- regardless of these policies). Leaving select open served no purpose
-- and exposed real user_id/code redemption pairs.
-- ---------------------------------------------------------------------
drop policy if exists "Public read/insert/update/delete" on promo_codes;
create policy "Admin all" on promo_codes for all using (is_admin()) with check (is_admin());

drop policy if exists "Public read/insert" on promo_code_redemptions;
create policy "Admin all" on promo_code_redemptions for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------
-- places — insert stays public by design (lib/places.ts's submitPlace()
-- lets any user propose a place, always with approved=false); update and
-- delete were the actual hole — anyone could flip their own (or anyone
-- else's) approved flag straight to true, skipping admin review
-- entirely, or delete any place outright.
-- ---------------------------------------------------------------------
drop policy if exists "Public update" on places;
create policy "Admin update" on places for update using (is_admin()) with check (is_admin());
drop policy if exists "Public delete" on places;
create policy "Admin delete" on places for delete using (is_admin());

-- ---------------------------------------------------------------------
-- certified_entries — the actual halal-status database. insert/update/
-- delete were fully open; select stays public (every product screen
-- reads it). The in-app admin.tsx approval screen that used to write
-- here directly (with no real admin session — Apple/Google sign-in never
-- gets a Supabase Auth token to check) has been removed; product review
-- now only happens through the admin panel, which does authenticate
-- properly.
-- ---------------------------------------------------------------------
drop policy if exists "Public insert" on certified_entries;
create policy "Admin insert" on certified_entries for insert with check (is_admin());
drop policy if exists "Public update" on certified_entries;
create policy "Admin update" on certified_entries for update using (is_admin()) with check (is_admin());
drop policy if exists "Public delete" on certified_entries;
create policy "Admin delete" on certified_entries for delete using (is_admin());

-- ---------------------------------------------------------------------
-- product_submissions — insert/select stay public (users submit their
-- own product suggestions and read their own submission history), but
-- UPDATE was open too — meaning a user could PATCH their own row's
-- review_status straight to 'approved' without any admin ever looking at
-- it. That wouldn't put the product itself into certified_entries (this
-- migration just locked that separately), but it *would* fraudulently
-- inflate their own approved-submission count, which
-- grant_achievement_premium (migration_2026_09_04_server_side_reward_
-- premium.sql) counts directly to grant free Premium — a real path to
-- unearned Premium that had nothing to do with guessing or replaying
-- anything.
-- ---------------------------------------------------------------------
drop policy if exists "Public update" on product_submissions;
create policy "Admin update" on product_submissions for update using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------
-- Lets lib/feedback.ts's "notify the admin of new feedback" push find
-- the admin's own users.id without querying users.email directly — that
-- column was revoked from anon/authenticated in
-- migration_2026_09_04_security_hardening.sql, so a raw
-- `.eq('email', ...)` would come back empty. security definer bypasses
-- that column restriction the same way the other privileged-lookup
-- functions in this file do.
-- ---------------------------------------------------------------------
create or replace function get_admin_user_id() returns text
language sql
security definer
set search_path = public
as $$
  select id from users where email = 'alamdarmanafov@gmail.com' limit 1;
$$;

grant execute on function get_admin_user_id() to anon, authenticated;

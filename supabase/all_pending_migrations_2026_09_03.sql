-- Halalzur — bütün gözləyən SQL dəyişikliklərinin tam siyahısı (2026-09-03 üçün).
-- Bu fayl 2026-08-31-dən bu günə qədər schema.sql-ə əlavə olunan HƏR ŞEYi bir yerə yığır.
-- Hər bir hissə özü təhlükəsizdir (əgər onsuz da işlədilibsə, heç nə etməz) —
-- ona görə bütün faylı bir dəfəyə Supabase → SQL Editor-da işlətmək olar,
-- hətta əvvəllər bunlardan bəzilərini artıq işlətmiş olsan belə.
--
-- NECƏ İŞLƏTMƏLİ: Supabase panelində → SQL Editor → New query →
-- bu faylın hamısını yapışdır → Run.

-- ============================================================
-- === pending_migrations.sql
-- ============================================================
-- Halalzur — pending migrations catch-up script.
--
-- Everything below was added to supabase/schema.sql during recent work but
-- has NOT yet been confirmed as run on the live Supabase database. Every
-- statement here is written to be safe to run even if some of it already
-- went through — it will just skip whatever already exists.
--
-- HOW TO RUN: Supabase dashboard → SQL Editor → New query → paste this
-- whole file → Run. Safe to run more than once.

-- 1) Shake-to-report screenshots (feedback_reports.screenshot_url + storage)
alter table feedback_reports add column if not exists screenshot_url text;

insert into storage.buckets (id, name, public)
values ('feedback-screenshots', 'feedback-screenshots', true)
on conflict (id) do nothing;

drop policy if exists "Public upload feedback screenshots" on storage.objects;
create policy "Public upload feedback screenshots" on storage.objects
  for insert to public
  with check (bucket_id = 'feedback-screenshots');

drop policy if exists "Public read feedback screenshots" on storage.objects;
create policy "Public read feedback screenshots" on storage.objects
  for select to public
  using (bucket_id = 'feedback-screenshots');

-- 2) Admin panel "Sil" (delete) button for unclassified scan barcodes
drop policy if exists "Public delete" on scan_events;
create policy "Public delete" on scan_events
  for delete using (true);

-- 3) Places: photo + directions
alter table places add column if not exists image_url text;

-- 4) Open Food Facts bulk import (barcode coverage without in-store scanning)
insert into certifiers (id, name, short_name, country, source_url) values
  ('openfoodfacts', 'Open Food Facts (açıq baza, hələ yoxlanılmayıb)', 'Open Food Facts', 'Beynəlxalq', 'https://world.openfoodfacts.org/')
on conflict (id) do nothing;

-- 5) Admin panel: product photo + ingredient/E-code review
alter table certified_entries add column if not exists image_url text;

-- 6) Referrals ("Dostunu dəvət et")
alter table users add column if not exists referral_code text unique;

create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id text not null,
  referred_id text not null unique,
  created_at timestamptz not null default now()
);

alter table referrals enable row level security;

drop policy if exists "Public select" on referrals;
create policy "Public select" on referrals
  for select using (true);

drop policy if exists "Public insert" on referrals;
create policy "Public insert" on referrals
  for insert with check (true);

-- ============================================================
-- === migration_2026_08_31_admin_batch2.sql
-- ============================================================
-- One-time migration for the admin panel's second batch of enhancements.
-- Run this once in Supabase → SQL Editor → New query, then it's safe to
-- delete this file (it's also mirrored into schema.sql for fresh installs).
-- Every statement below is idempotent — safe to run more than once.

alter table certified_entries add column if not exists featured boolean not null default false;

create table if not exists place_category_icons (
  category text primary key,
  icon text not null default '📍'
);

insert into place_category_icons (category, icon) values
  ('restoran', '🍽️'), ('kafe', '☕'), ('coffee_shop', '🥐')
on conflict (category) do nothing;

alter table place_category_icons enable row level security;

drop policy if exists "Public read" on place_category_icons;
create policy "Public read" on place_category_icons
  for select using (true);

drop policy if exists "Public update" on place_category_icons;
create policy "Public update" on place_category_icons
  for update using (true) with check (true);

alter table users add column if not exists banned boolean not null default false;
alter table users add column if not exists ban_reason text;

alter table feedback_reports add column if not exists admin_reply text;
alter table feedback_reports add column if not exists admin_reply_at timestamptz;

-- Missing until now — both createGithubIssue()'s write-back of
-- github_issue_number/url and the admin panel's new admin_reply need this
-- to actually take effect (RLS otherwise silently matches zero rows).
drop policy if exists "Public update" on feedback_reports;
create policy "Public update" on feedback_reports
  for update using (true) with check (true);

create table if not exists sync_log (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  status text not null check (status in ('success', 'error')),
  written_count integer,
  message text,
  ran_at timestamptz not null default now()
);

alter table sync_log enable row level security;

drop policy if exists "Public read" on sync_log;
create policy "Public read" on sync_log
  for select using (true);

create table if not exists app_versions (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  release_notes text not null,
  released_at date not null default current_date,
  created_at timestamptz not null default now()
);

alter table app_versions enable row level security;

drop policy if exists "Public read" on app_versions;
create policy "Public read" on app_versions
  for select using (true);

drop policy if exists "Public insert" on app_versions;
create policy "Public insert" on app_versions
  for insert with check (true);

drop policy if exists "Public delete" on app_versions;
create policy "Public delete" on app_versions
  for delete using (true);

-- ============================================================
-- === migration_2026_08_31_broadcast_targeting.sql
-- ============================================================
-- One-time migration: broadcast push audience targeting + scheduling.
-- Run this once in Supabase → SQL Editor → New query.
-- Every statement below is idempotent — safe to run more than once.

alter table users add column if not exists language text not null default 'az' check (language in ('az', 'en'));

create table if not exists scheduled_broadcasts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  audience_plan text not null default 'all' check (audience_plan in ('all', 'free', 'premium')),
  audience_language text not null default 'all' check (audience_language in ('all', 'az', 'en')),
  send_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'canceled')),
  sent_count integer,
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

alter table scheduled_broadcasts enable row level security;

drop policy if exists "Public read" on scheduled_broadcasts;
create policy "Public read" on scheduled_broadcasts
  for select using (true);

drop policy if exists "Public insert" on scheduled_broadcasts;
create policy "Public insert" on scheduled_broadcasts
  for insert with check (true);

drop policy if exists "Public update" on scheduled_broadcasts;
create policy "Public update" on scheduled_broadcasts
  for update using (true) with check (true);

-- ============================================================
-- === migration_2026_09_01_admin_batch1.sql
-- ============================================================
-- One-time migration: the ORIGINAL first batch of 20 admin panel
-- enhancements (bulk status/category, CSV import/export, data-health
-- reports, private notes, soft-delete/trash, audit log, certifier
-- management, trend chart, leaderboard, user drill-down, global search,
-- scheduled announcements). Run in Supabase → SQL Editor.
--
-- Safe to re-run: every statement below is written to skip or replace
-- whatever already exists, so a run that got interrupted partway through
-- (or was already run once) can just be run again from the top instead
-- of needing to figure out exactly where it stopped.

alter table certified_entries add column if not exists admin_note text;
alter table certified_entries add column if not exists deleted_at timestamptz;
alter table places add column if not exists deleted_at timestamptz;
alter table announcements add column if not exists publish_at timestamptz;

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor text not null default 'admin',
  action text not null,
  entity_table text not null,
  entity_id text,
  details text,
  created_at timestamptz not null default now()
);

alter table audit_log enable row level security;

drop policy if exists "Public read" on audit_log;
create policy "Public read" on audit_log
  for select using (true);

drop policy if exists "Public insert" on audit_log;
create policy "Public insert" on audit_log
  for insert with check (true);

drop policy if exists "Public insert" on certifiers;
create policy "Public insert" on certifiers
  for insert with check (true);

drop policy if exists "Public update" on certifiers;
create policy "Public update" on certifiers
  for update using (true) with check (true);

drop policy if exists "Public delete" on certifiers;
create policy "Public delete" on certifiers
  for delete using (true);

drop view if exists confirmed_scan_counts;
create view confirmed_scan_counts
with (security_invoker = true) as
select
  se.barcode,
  count(*) as scan_count,
  max(se.created_at) as last_scanned_at,
  ce.product_name,
  ce.brand,
  ce.status
from scan_events se
join certified_entries ce on ce.barcode = se.barcode and ce.deleted_at is null
where se.barcode is not null
group by se.barcode, ce.product_name, ce.brand, ce.status
order by count(*) desc;

grant select on confirmed_scan_counts to anon;

-- ============================================================
-- === migration_2026_09_01_featured_places.sql
-- ============================================================
-- One-time migration: featured places + community product recommendations
-- (the "Tövsiyə et" button on the product detail screen). Run once in
-- Supabase → SQL Editor.

alter table places add column if not exists featured boolean not null default false;

create table if not exists product_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  barcode text not null,
  created_at timestamptz not null default now(),
  unique (user_id, barcode)
);

create index if not exists idx_product_recommendations_barcode on product_recommendations (barcode);

alter table product_recommendations enable row level security;

drop policy if exists "Public select" on product_recommendations;
create policy "Public select" on product_recommendations
  for select using (true);

drop policy if exists "Public insert" on product_recommendations;
create policy "Public insert" on product_recommendations
  for insert with check (true);

drop policy if exists "Public delete" on product_recommendations;
create policy "Public delete" on product_recommendations
  for delete using (true);

drop view if exists product_recommend_counts;
create view product_recommend_counts
with (security_invoker = true) as
select
  pr.barcode,
  count(*) as recommend_count,
  ce.product_name,
  ce.brand,
  ce.status
from product_recommendations pr
join certified_entries ce on ce.barcode = pr.barcode and ce.deleted_at is null
group by pr.barcode, ce.product_name, ce.brand, ce.status
order by count(*) desc;

grant select on product_recommend_counts to anon;

create table if not exists place_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  place_id uuid not null references places(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, place_id)
);

create index if not exists idx_place_recommendations_place on place_recommendations (place_id);

alter table place_recommendations enable row level security;

drop policy if exists "Public select" on place_recommendations;
create policy "Public select" on place_recommendations
  for select using (true);

drop policy if exists "Public insert" on place_recommendations;
create policy "Public insert" on place_recommendations
  for insert with check (true);

drop policy if exists "Public delete" on place_recommendations;
create policy "Public delete" on place_recommendations
  for delete using (true);

drop view if exists place_recommend_counts;
create view place_recommend_counts
with (security_invoker = true) as
select
  pr.place_id,
  count(*) as recommend_count,
  p.name,
  p.category,
  p.status
from place_recommendations pr
join places p on p.id = pr.place_id and p.deleted_at is null
group by pr.place_id, p.name, p.category, p.status
order by count(*) desc;

grant select on place_recommend_counts to anon;

-- ============================================================
-- === migration_2026_09_01_barcode_required_for_products.sql
-- ============================================================
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

-- ============================================================
-- === migration_2026_09_01_admin_batch3.sql
-- ============================================================
-- One-time migration: batch-3 admin panel enhancements (feedback status,
-- last-seen tracking, notification templates, referral click tracking,
-- product categories moved to a table). Run once in Supabase → SQL Editor.
-- Safe to re-run — every statement skips or replaces what's already there.

-- Feedback triage status — was previously binary (exists = open, delete
-- = resolved); this lets the admin mark something "baxılır" without
-- losing it, distinct from actually resolving/deleting it.
alter table feedback_reports add column if not exists status text not null default 'open' check (status in ('open', 'in_progress', 'resolved'));

-- Best-effort "when was this account last active" — set opportunistically
-- whenever the app calls syncUser() (plan/language changes, sign-in,
-- achievement grants), not a true real-time heartbeat/presence system.
alter table users add column if not exists last_seen_at timestamptz;

-- Reusable push notification copy so the admin doesn't retype the same
-- announcement text every time.
create table if not exists notification_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);
alter table notification_templates enable row level security;
drop policy if exists "Public read" on notification_templates;
create policy "Public read" on notification_templates for select using (true);
drop policy if exists "Public insert" on notification_templates;
create policy "Public insert" on notification_templates for insert with check (true);
drop policy if exists "Public delete" on notification_templates;
create policy "Public delete" on notification_templates for delete using (true);

-- One row per landing-page view (website/invite.html?code=X) — lets the
-- admin panel show a code's click-through rate alongside its actual
-- referrals (signups) count, not just the signup count alone.
create table if not exists referral_clicks (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  created_at timestamptz not null default now()
);
alter table referral_clicks enable row level security;
drop policy if exists "Public insert" on referral_clicks;
create policy "Public insert" on referral_clicks for insert with check (true);
drop policy if exists "Public read" on referral_clicks;
create policy "Public read" on referral_clicks for select using (true);

-- Product categories, moved out of the hardcoded PRODUCT_CATEGORIES
-- array (lib/categories.ts) so the admin can add/rename/reorder them
-- without a code change. The app still ships a hardcoded fallback for
-- when Supabase isn't configured.
create table if not exists product_categories (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table product_categories enable row level security;
drop policy if exists "Public read" on product_categories;
create policy "Public read" on product_categories for select using (true);
drop policy if exists "Public insert" on product_categories;
create policy "Public insert" on product_categories for insert with check (true);
drop policy if exists "Public update" on product_categories;
create policy "Public update" on product_categories for update using (true) with check (true);
drop policy if exists "Public delete" on product_categories;
create policy "Public delete" on product_categories for delete using (true);

insert into product_categories (label, sort_order)
select v.label, v.sort_order from (values
  ('Şirniyyat', 1), ('Çörək', 2), ('İçki', 3), ('Süd məhsulları', 4), ('Ət məhsulları', 5),
  ('Konservlər', 6), ('Dondurulmuş məhsullar', 7), ('Souslar', 8), ('Qəlyanaltılar', 9),
  ('Dənli məhsullar', 10), ('Uşaq qidası', 11), ('Makaron və düyü', 12), ('Yağlar', 13),
  ('Ədviyyat', 14), ('Kosmetika', 15)
) as v(label, sort_order)
where not exists (select 1 from product_categories pc where pc.label = v.label);

-- ============================================================
-- === migration_2026_09_01_purchase_events.sql
-- ============================================================
-- Run once in Supabase → SQL Editor. Idempotent (safe to re-run).
-- Adds a best-effort Premium purchase log for the admin panel's
-- "Premium gəlir (təxmini)" dashboard widget. See the matching comment
-- in supabase/schema.sql for what this is and, importantly, what it
-- is NOT (not verified receipts, not real Apple payout, no renewal/
-- refund tracking).

create table if not exists purchase_events (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  product_id text not null,
  estimated_usd_amount numeric not null,
  purchased_at timestamptz not null default now()
);
create index if not exists idx_purchase_events_purchased_at on purchase_events (purchased_at);
alter table purchase_events enable row level security;
drop policy if exists "Public insert" on purchase_events;
create policy "Public insert" on purchase_events for insert with check (true);
drop policy if exists "Public read" on purchase_events;
create policy "Public read" on purchase_events for select using (true);

-- ============================================================
-- === migration_2026_09_01_users_country.sql
-- ============================================================
-- Run once in Supabase → SQL Editor. Idempotent (safe to re-run).
-- See the matching comment in supabase/schema.sql.
alter table users add column if not exists country text;

-- ============================================================
-- === migration_2026_09_01_custom_ecodes.sql
-- ============================================================
-- Run once in Supabase → SQL Editor. Idempotent (safe to re-run).
-- See the matching comment in supabase/schema.sql.
create table if not exists custom_ecodes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  category text,
  status text not null check (status in ('halal', 'haram', 'mushbooh', 'depends')),
  note text,
  created_at timestamptz not null default now()
);
alter table custom_ecodes enable row level security;
drop policy if exists "Public read" on custom_ecodes;
create policy "Public read" on custom_ecodes for select using (true);
drop policy if exists "Public insert" on custom_ecodes;
create policy "Public insert" on custom_ecodes for insert with check (true);
drop policy if exists "Public delete" on custom_ecodes;
create policy "Public delete" on custom_ecodes for delete using (true);

-- ============================================================
-- === migration_2026_09_01_points_log.sql
-- ============================================================
-- Run once in Supabase → SQL Editor. Idempotent (safe to re-run).
-- See the matching comment in supabase/schema.sql.
create table if not exists points_log (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  user_name text,
  amount integer not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_points_log_created_at on points_log (created_at);
alter table points_log enable row level security;
drop policy if exists "Public read" on points_log;
create policy "Public read" on points_log for select using (true);
drop policy if exists "Public insert" on points_log;
create policy "Public insert" on points_log for insert with check (true);

-- ============================================================
-- === migration_2026_09_01_brand_follows.sql
-- ============================================================
-- Run this in Supabase → SQL Editor. Safe to run more than once.

create table if not exists brand_follows (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  brand text not null,
  created_at timestamptz not null default now(),
  unique (user_id, brand)
);
alter table brand_follows enable row level security;
drop policy if exists "Public read/insert/delete" on brand_follows;
create policy "Public read/insert/delete" on brand_follows for all using (true) with check (true);

-- ============================================================
-- === migration_2026_09_01_product_ratings.sql
-- ============================================================
-- Run this in Supabase → SQL Editor. Safe to run more than once.

create table if not exists product_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  barcode text not null,
  rating smallint not null check (rating between 1 and 5),
  updated_at timestamptz not null default now(),
  unique (user_id, barcode)
);
alter table product_ratings enable row level security;
drop policy if exists "Public read/insert/update" on product_ratings;
create policy "Public read/insert/update" on product_ratings for all using (true) with check (true);

-- ============================================================
-- === migration_2026_09_01_winback_recommend_columns.sql
-- ============================================================
-- Run this in Supabase → SQL Editor. Safe to run more than once.

alter table users add column if not exists last_winback_sent_at timestamptz;
alter table users add column if not exists last_recommend_sent_at timestamptz;

-- ============================================================
-- === migration_2026_09_01_ru_tr_language.sql
-- ============================================================
-- Run this in Supabase → SQL Editor. Safe to run more than once.
-- Widens the language check constraints to allow 'ru' and 'tr' now that
-- the app supports Russian and Turkish (lib/i18n.ts).

alter table users drop constraint if exists users_language_check;
alter table users add constraint users_language_check check (language in ('az', 'en', 'ru', 'tr'));

alter table scheduled_broadcasts drop constraint if exists scheduled_broadcasts_audience_language_check;
alter table scheduled_broadcasts add constraint scheduled_broadcasts_audience_language_check
  check (audience_language in ('all', 'az', 'en', 'ru', 'tr'));

-- ============================================================
-- === migration_2026_09_01_guide_articles.sql
-- ============================================================
-- Run this in Supabase → SQL Editor. Safe to run more than once.

create table if not exists guide_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table guide_articles enable row level security;
drop policy if exists "Public read/insert/update/delete" on guide_articles;
create policy "Public read/insert/update/delete" on guide_articles for all using (true) with check (true);

-- ============================================================
-- === migration_2026_09_01_haram_keywords.sql
-- ============================================================
-- Run this in Supabase → SQL Editor. Safe to run more than once.

create table if not exists haram_keywords (
  id uuid primary key default gen_random_uuid(),
  keyword text not null unique,
  status text not null check (status in ('haram', 'mushbooh')),
  note text,
  created_at timestamptz not null default now()
);
alter table haram_keywords enable row level security;
drop policy if exists "Public read/insert/delete" on haram_keywords;
create policy "Public read/insert/delete" on haram_keywords for all using (true) with check (true);

-- ============================================================
-- === migration_2026_09_01_admin_roles_stage1.sql
-- ============================================================
-- STAGE 1 of 2 — run this FIRST in Supabase → SQL Editor. Safe to run
-- more than once, and safe to run right now: it only ADDS a new table
-- and two helper functions, it does not change any existing table's
-- access rules. Nothing in the app or admin panel breaks from this
-- alone.
--
-- After running this, follow the "bootstrap your first admin account"
-- steps you were given separately, confirm the new admin-panel login
-- works, THEN (and only then) run
-- migration_2026_09_01_admin_roles_stage2_rls.sql.

create table if not exists admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('super_admin', 'moderator')),
  created_at timestamptz not null default now()
);
alter table admin_profiles enable row level security;
drop policy if exists "Admins can read all profiles" on admin_profiles;
create policy "Admins can read all profiles" on admin_profiles for select
  using (exists (select 1 from admin_profiles p where p.id = auth.uid()));
drop policy if exists "Super admins manage profiles" on admin_profiles;
create policy "Super admins manage profiles" on admin_profiles for all
  using (exists (select 1 from admin_profiles p where p.id = auth.uid() and p.role = 'super_admin'))
  with check (exists (select 1 from admin_profiles p where p.id = auth.uid() and p.role = 'super_admin'));

create or replace function is_admin() returns boolean
  language sql security definer stable
  set search_path = public
  as $$ select exists (select 1 from admin_profiles where id = auth.uid()); $$;

create or replace function is_super_admin() returns boolean
  language sql security definer stable
  set search_path = public
  as $$ select exists (select 1 from admin_profiles where id = auth.uid() and role = 'super_admin'); $$;

-- ============================================================
-- === migration_2026_09_01_admin_roles_stage2_rls.sql
-- ============================================================
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

-- ============================================================
-- === migration_2026_09_01_admin_roles_fix_recursion.sql
-- ============================================================
-- Run this in Supabase → SQL Editor. Fixes admin_profiles' own RLS
-- policies, which mistakenly queried admin_profiles directly inside
-- their own USING clause (a self-referencing policy) instead of going
-- through the is_admin()/is_super_admin() SECURITY DEFINER functions
-- (which bypass RLS internally and are exactly what those functions
-- are for) — every OTHER table's stage2 policy did this correctly,
-- only admin_profiles' own two policies had the bug. This is why
-- logging in kept saying "not an admin" even with a correct row in
-- admin_profiles.

drop policy if exists "Admins can read all profiles" on admin_profiles;
create policy "Admins can read all profiles" on admin_profiles for select
  using (is_admin());

drop policy if exists "Super admins manage profiles" on admin_profiles;
create policy "Super admins manage profiles" on admin_profiles for all
  using (is_super_admin())
  with check (is_super_admin());

-- ============================================================
-- === migration_2026_09_01_broadcast_translations.sql
-- ============================================================
-- Run this in Supabase → SQL Editor. Additive only — adds optional
-- EN/RU/TR title+body columns to notification_templates and
-- scheduled_broadcasts so the admin panel's push-broadcast form can
-- carry real per-language text instead of only Azerbaijani. A blank
-- translation falls back to the Azerbaijani title/body (see
-- admin-panel/lib/broadcast.js's contentFor()). Safe to run more than
-- once.

alter table notification_templates add column if not exists title_en text;
alter table notification_templates add column if not exists body_en text;
alter table notification_templates add column if not exists title_ru text;
alter table notification_templates add column if not exists body_ru text;
alter table notification_templates add column if not exists title_tr text;
alter table notification_templates add column if not exists body_tr text;

alter table scheduled_broadcasts add column if not exists title_en text;
alter table scheduled_broadcasts add column if not exists body_en text;
alter table scheduled_broadcasts add column if not exists title_ru text;
alter table scheduled_broadcasts add column if not exists body_ru text;
alter table scheduled_broadcasts add column if not exists title_tr text;
alter table scheduled_broadcasts add column if not exists body_tr text;

-- ============================================================
-- === migration_2026_09_01_broadcast_recurrence.sql
-- ============================================================
-- Run this in Supabase → SQL Editor. Additive only — adds a `recurrence`
-- column to scheduled_broadcasts so the admin panel's "Planla" button can
-- create a repeating push (daily/weekly/monthly) instead of only a
-- one-shot one. Safe to run more than once.

alter table scheduled_broadcasts
  add column if not exists recurrence text not null default 'none';

alter table scheduled_broadcasts drop constraint if exists scheduled_broadcasts_recurrence_check;
alter table scheduled_broadcasts
  add constraint scheduled_broadcasts_recurrence_check
  check (recurrence in ('none', 'daily', 'weekly', 'monthly'));

-- ============================================================
-- === migration_2026_09_01_certifier_logos.sql
-- ============================================================
-- Run this in Supabase → SQL Editor. Adds certifier logo upload support:
-- a `logo_url` column on certifiers, plus a public-read / admin-write
-- Storage bucket the admin panel uploads logo images to directly from
-- the browser (no new Vercel function — this project is already at
-- Vercel's Hobby-plan 12-function cap). Safe to run more than once.

alter table certifiers add column if not exists logo_url text;

insert into storage.buckets (id, name, public)
values ('certifier-logos', 'certifier-logos', true)
on conflict (id) do nothing;

drop policy if exists "Public read certifier logos" on storage.objects;
create policy "Public read certifier logos" on storage.objects for select
  using (bucket_id = 'certifier-logos');

drop policy if exists "Admin write certifier logos" on storage.objects;
create policy "Admin write certifier logos" on storage.objects for insert
  with check (bucket_id = 'certifier-logos' and is_admin());

drop policy if exists "Admin update certifier logos" on storage.objects;
create policy "Admin update certifier logos" on storage.objects for update
  using (bucket_id = 'certifier-logos' and is_admin())
  with check (bucket_id = 'certifier-logos' and is_admin());

drop policy if exists "Admin delete certifier logos" on storage.objects;
create policy "Admin delete certifier logos" on storage.objects for delete
  using (bucket_id = 'certifier-logos' and is_admin());

-- ============================================================
-- === migration_2026_09_01_merge_users.sql
-- ============================================================
-- Run this in Supabase → SQL Editor. Adds a merge_users(primary_id,
-- duplicate_id) function the admin panel's "Dublikat hesabları birləşdir"
-- tool calls via RPC. Everything happens in one transaction (a single
-- Postgres function call) rather than a sequence of REST requests from
-- the browser, since a merge touches ~10 tables — several with a
-- unique(user_id, X) constraint that needs conflict handling — and a
-- half-finished merge from a dropped connection would be much worse than
-- an all-or-nothing failure. Safe to run more than once.

create or replace function merge_users(primary_id text, duplicate_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not authorized';
  end if;
  if primary_id is null or duplicate_id is null or primary_id = duplicate_id then
    raise exception 'primary_id and duplicate_id must be different, non-null user ids';
  end if;
  if not exists (select 1 from users where id = primary_id) then
    raise exception 'primary user % not found', primary_id;
  end if;
  if not exists (select 1 from users where id = duplicate_id) then
    raise exception 'duplicate user % not found', duplicate_id;
  end if;

  -- Tables with unique(user_id, X): move the duplicate's rows only where
  -- the primary doesn't already have one for the same X — the primary's
  -- own row wins any tie — then drop whatever's left over.
  insert into favorites (user_id, barcode, data, created_at)
    select primary_id, barcode, data, created_at from favorites where user_id = duplicate_id
  on conflict (user_id, barcode) do nothing;
  delete from favorites where user_id = duplicate_id;

  insert into product_ratings (user_id, barcode, rating, updated_at)
    select primary_id, barcode, rating, updated_at from product_ratings where user_id = duplicate_id
  on conflict (user_id, barcode) do nothing;
  delete from product_ratings where user_id = duplicate_id;

  insert into brand_follows (user_id, brand, created_at)
    select primary_id, brand, created_at from brand_follows where user_id = duplicate_id
  on conflict (user_id, brand) do nothing;
  delete from brand_follows where user_id = duplicate_id;

  insert into product_recommendations (user_id, barcode, created_at)
    select primary_id, barcode, created_at from product_recommendations where user_id = duplicate_id
  on conflict (user_id, barcode) do nothing;
  delete from product_recommendations where user_id = duplicate_id;

  insert into place_recommendations (user_id, place_id, created_at)
    select primary_id, place_id, created_at from place_recommendations where user_id = duplicate_id
  on conflict (user_id, place_id) do nothing;
  delete from place_recommendations where user_id = duplicate_id;

  -- user_points has one row per user (user_id is its primary key), so
  -- sum the two totals instead of skip-on-conflict.
  if exists (select 1 from user_points where user_id = duplicate_id) then
    insert into user_points (user_id, user_name, points)
      select primary_id, coalesce((select user_name from user_points where user_id = primary_id), user_name), points
      from user_points where user_id = duplicate_id
    on conflict (user_id) do update set points = user_points.points + excluded.points;
    delete from user_points where user_id = duplicate_id;
  end if;

  -- referrals.referred_id is unique (a user is referred at most once) —
  -- only adopt the duplicate's "who referred me" record if the primary
  -- doesn't already have one of its own.
  if exists (select 1 from referrals where referred_id = duplicate_id)
     and not exists (select 1 from referrals where referred_id = primary_id) then
    update referrals set referred_id = primary_id where referred_id = duplicate_id;
  else
    delete from referrals where referred_id = duplicate_id;
  end if;
  -- referrer_id has no such constraint — every invite the duplicate sent
  -- out now counts toward the primary.
  update referrals set referrer_id = primary_id where referrer_id = duplicate_id;

  -- Plain reassignment — no per-user uniqueness constraint on these.
  update device_tokens set user_id = primary_id where user_id = duplicate_id;
  update product_submissions set submitted_by = primary_id where submitted_by = duplicate_id;
  update feedback_reports set user_id = primary_id where user_id = duplicate_id;
  update purchase_events set user_id = primary_id where user_id = duplicate_id;
  update points_log set user_id = primary_id where user_id = duplicate_id;

  -- Fold the duplicate's own users-row fields into the primary's, then
  -- drop the duplicate row itself.
  update users u set
    plan = case when d.plan = 'premium' then 'premium' else u.plan end,
    premium_expires_at = case
      when u.premium_expires_at is null and d.premium_expires_at is null then null
      else greatest(coalesce(u.premium_expires_at, '-infinity'::timestamptz), coalesce(d.premium_expires_at, '-infinity'::timestamptz))
    end,
    claimed_achievements = (
      select coalesce(array_agg(distinct x order by x), '{}')
      from unnest(u.claimed_achievements || d.claimed_achievements) x
    )
  from users d
  where u.id = primary_id and d.id = duplicate_id;

  delete from users where id = duplicate_id;
end;
$$;

revoke all on function merge_users(text, text) from public;
grant execute on function merge_users(text, text) to authenticated;

-- ============================================================
-- === migration_2026_09_02_haram_keywords_intl.sql
-- ============================================================
-- Run this in Supabase → SQL Editor. Adds haram/mushbooh keyword
-- entries in German, French, Spanish, Italian, Polish, Dutch,
-- Portuguese and Arabic — the languages Open Food Facts most often has
-- ingredient text in for products manufactured in those countries, so a
-- scanned German/French/Spanish/... product's ingredient list gets
-- flagged the same way an Azerbaijani/Russian/Turkish one already does.
--
-- Notes stay in Azerbaijani (for the admin reading them here); only the
-- `keyword` column itself is in the foreign language. `on conflict do
-- nothing` makes this safe to run more than once and safe even if a
-- couple of these already exist.
--
-- This is a first pass, not exhaustive — European languages that heavily
-- compound words (German especially: "Schweinefleisch", "Rotwein") only
-- match when that exact compound is the word actually printed on the
-- label; a compound this list doesn't anticipate won't be caught. Expand
-- with more compounds/languages (e.g. Ukrainian, more Arabic terms) as
-- real misses turn up.

insert into haram_keywords (keyword, status, note) values
  -- German (de)
  ('Schweinefleisch', 'haram', 'Donuz əti (alman dilində).'),
  ('Schweineschmalz', 'haram', 'Donuz mənşəli piy (alman dilində).'),
  ('Schweinespeck', 'haram', 'Donuz mənşəli bekon/piy (alman dilində).'),
  ('Speck', 'haram', 'Adətən donuz mənşəli bekon (alman dilində).'),
  ('Schinken', 'haram', 'Adətən donuz mənşəli hazır ət (alman dilində).'),
  ('Wein', 'haram', 'Şərab (alman dilində).'),
  ('Rotwein', 'haram', 'Qırmızı şərab (alman dilində).'),
  ('Weißwein', 'haram', 'Ağ şərab (alman dilində).'),
  ('Gelatine', 'mushbooh', 'Mənbəyi (mal/balıq = halal, donuz = haram) etiketdən görünmür (alman/holland yazılışı).'),
  ('Cochenille', 'haram', 'Həşərat mənşəli qırmızı rəngləyici, bax: E120 (alman/fransız yazılışı).'),

  -- French (fr)
  ('porc', 'haram', 'Donuz əti (fransız dilində).'),
  ('viande de porc', 'haram', 'Donuz əti (fransız dilində).'),
  ('graisse de porc', 'haram', 'Donuz mənşəli piy (fransız dilində).'),
  ('vin', 'haram', 'Şərab (fransız dilində).'),
  ('gélatine', 'mushbooh', 'Mənbəyi (mal/balıq = halal, donuz = haram) etiketdən görünmür (fransız dilində).'),
  ('présure', 'mushbooh', 'Heyvan mənşəli maya ola bilər — mənbəyi etiketdən görünmür (fransız dilində, pendir mayası).'),
  ('carmin', 'haram', 'Həşərat mənşəli qırmızı rəngləyici, bax: E120 (fransız yazılışı).'),

  -- Spanish (es)
  ('cerdo', 'haram', 'Donuz (ispan dilində).'),
  ('carne de cerdo', 'haram', 'Donuz əti (ispan dilində).'),
  ('manteca de cerdo', 'haram', 'Donuz mənşəli piy (ispan dilində).'),
  ('tocino', 'haram', 'Donuz mənşəli bekon (ispan dilində).'),
  ('jamón', 'haram', 'Adətən donuz mənşəli hazır ət (ispan dilində).'),
  ('vino', 'haram', 'Şərab (ispan/italyan dilində).'),
  ('gelatina', 'mushbooh', 'Mənbəyi (mal/balıq = halal, donuz = haram) etiketdən görünmür (ispan/italyan/portuqal yazılışı).'),
  ('cuajo', 'mushbooh', 'Heyvan mənşəli maya ola bilər — mənbəyi etiketdən görünmür (ispan dilində, pendir mayası).'),
  ('cochinilla', 'haram', 'Həşərat mənşəli qırmızı rəngləyici, bax: E120 (ispan dilində).'),

  -- Italian (it)
  ('maiale', 'haram', 'Donuz (italyan dilində).'),
  ('carne di maiale', 'haram', 'Donuz əti (italyan dilində).'),
  ('lardo', 'haram', 'Donuz mənşəli piy (italyan dilində).'),
  ('pancetta', 'haram', 'Donuz mənşəli bekon (italyan dilində).'),
  ('caglio', 'mushbooh', 'Heyvan mənşəli maya ola bilər — mənbəyi etiketdən görünmür (italyan dilində, pendir mayası).'),
  ('cocciniglia', 'haram', 'Həşərat mənşəli qırmızı rəngləyici, bax: E120 (italyan dilində).'),

  -- Polish (pl)
  ('wieprzowina', 'haram', 'Donuz əti (polyak dilində).'),
  ('smalec', 'haram', 'Donuz mənşəli piy (polyak dilində).'),
  ('boczek', 'haram', 'Donuz mənşəli bekon (polyak dilində).'),
  ('szynka', 'haram', 'Adətən donuz mənşəli hazır ət (polyak dilində).'),
  ('wino', 'haram', 'Şərab (polyak dilində).'),
  ('żelatyna', 'mushbooh', 'Mənbəyi (mal/balıq = halal, donuz = haram) etiketdən görünmür (polyak dilində).'),
  ('podpuszczka', 'mushbooh', 'Heyvan mənşəli maya ola bilər — mənbəyi etiketdən görünmür (polyak dilində, pendir mayası).'),
  ('koszenila', 'haram', 'Həşərat mənşəli qırmızı rəngləyici, bax: E120 (polyak dilində).'),

  -- Dutch (nl)
  ('varkensvlees', 'haram', 'Donuz əti (holland dilində).'),
  ('varkensvet', 'haram', 'Donuz mənşəli piy (holland dilində).'),
  ('spek', 'haram', 'Adətən donuz mənşəli bekon (holland dilində).'),
  ('ham', 'haram', 'Adətən donuz mənşəli hazır ət (holland/ingilis dilində).'),
  ('wijn', 'haram', 'Şərab (holland dilində).'),
  ('stremsel', 'mushbooh', 'Heyvan mənşəli maya ola bilər — mənbəyi etiketdən görünmür (holland dilində, pendir mayası).'),

  -- Portuguese (pt)
  ('porco', 'haram', 'Donuz (portuqal dilində).'),
  ('carne de porco', 'haram', 'Donuz əti (portuqal dilində).'),
  ('toucinho', 'haram', 'Donuz mənşəli piy/bekon (portuqal dilində).'),
  ('presunto', 'haram', 'Adətən donuz mənşəli hazır ət (portuqal dilində).'),
  ('vinho', 'haram', 'Şərab (portuqal dilində).'),
  ('coalho', 'mushbooh', 'Heyvan mənşəli maya ola bilər — mənbəyi etiketdən görünmür (portuqal dilində, pendir mayası).'),
  ('cochonilha', 'haram', 'Həşərat mənşəli qırmızı rəngləyici, bax: E120 (portuqal dilində).'),

  -- Arabic (ar) — deliberately kept to a small, unambiguous core set
  ('خنزير', 'haram', 'Donuz (ərəb dilində).'),
  ('لحم خنزير', 'haram', 'Donuz əti (ərəb dilində).'),
  ('دهن خنزير', 'haram', 'Donuz mənşəli piy (ərəb dilində).'),
  ('خمر', 'haram', 'Spirtli içki/şərab (ərəb dilində).'),
  ('جيلاتين', 'mushbooh', 'Mənbəyi (mal/balıq = halal, donuz = haram) etiketdən görünmür (ərəb dilində).')
on conflict (keyword) do nothing;

-- ============================================================
-- === migration_2026_09_02_custom_ecodes_update.sql
-- ============================================================
-- The admin panel's "E-kodlar" section can now edit a built-in E-code
-- (creating/updating a custom_ecodes row with the same code as an
-- "override" the app prefers over its hardcoded default) in addition to
-- adding brand-new codes and deleting old ones — custom_ecodes had no
-- update policy at all, so that upsert was silently rejected by RLS.
drop policy if exists "Public update" on custom_ecodes;
create policy "Public update" on custom_ecodes for update using (true) with check (true);

-- ============================================================
-- === migration_2026_09_02_product_images.sql
-- ============================================================
-- Run this in Supabase -> SQL Editor. Adds a public-read / admin-write
-- Storage bucket the admin panel uploads product images to directly from
-- the browser (no new Vercel function — this project is already at
-- Vercel's Hobby-plan 12-function cap), same pattern as the
-- "certifier-logos" bucket (migration_2026_09_01_certifier_logos.sql).
-- The admin panel already compresses/resizes the image client-side
-- before upload, so this doesn't need its own size handling beyond RLS.
-- Safe to run more than once.

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images" on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "Admin write product images" on storage.objects;
create policy "Admin write product images" on storage.objects for insert
  with check (bucket_id = 'product-images' and is_admin());

drop policy if exists "Admin update product images" on storage.objects;
create policy "Admin update product images" on storage.objects for update
  using (bucket_id = 'product-images' and is_admin())
  with check (bucket_id = 'product-images' and is_admin());

drop policy if exists "Admin delete product images" on storage.objects;
create policy "Admin delete product images" on storage.objects for delete
  using (bucket_id = 'product-images' and is_admin());

-- ============================================================
-- === migration_2026_09_02_fix_reviewed_off_imports.sql
-- ============================================================
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

-- ============================================================
-- === migration_2026_09_02_product_recommendations_update.sql
-- ============================================================
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

-- ============================================================
-- === migration_2026_09_02_winback_tiers.sql
-- ============================================================
-- Run this in Supabase → SQL Editor.
--
-- Multi-tier win-back push notifications — replaces the old single
-- "7+ days inactive, resend every 14 days" message with escalating
-- copy at each tier below. cron-jobs.js's runWinBackPush() sends the
-- highest tier a user has newly crossed, tracked via
-- users.last_winback_tier_sent so each tier fires exactly once per
-- user (never repeats, never skips ahead) instead of the same generic
-- nudge on a fixed schedule. Safe to run more than once.
alter table users add column if not exists last_winback_tier_sent int;

create table if not exists winback_templates (
  id uuid primary key default gen_random_uuid(),
  days_inactive int not null unique,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);
alter table winback_templates enable row level security;

drop policy if exists "Public read" on winback_templates;
create policy "Public read" on winback_templates for select using (true);

drop policy if exists "Public update" on winback_templates;
create policy "Public update" on winback_templates for update using (true) with check (true);

insert into winback_templates (days_inactive, title, body) values
  (7, 'Sizi darıxdıq!', 'Yeni halal məhsulları yoxlamaq üçün Halalzur-a qayıdın 🍏'),
  (30, 'Bir aydır görüşmürük', 'Bu müddətdə bazamıza yüzlərlə yeni məhsul əlavə olundu — gəl bir bax 👀'),
  (90, '3 aydır sizi gözləyirik', 'Halal seçimlərini asanlaşdırmaq üçün buradayıq — Halalzur-a qayıdıb yenidən skan etməyə başlayın 🔍'),
  (180, 'Uzun müddətdir görüşmürük 💚', 'Halalzur hələ də yanınızdadır — geri qayıdın, sizin üçün nə dəyişib görün.')
on conflict (days_inactive) do nothing;

-- ============================================================
-- === migration_2026_09_02_azexport_certifier.sql
-- ============================================================
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


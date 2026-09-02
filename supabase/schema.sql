-- Halalzur certified-entries schema.
-- Run this once in the Supabase project's SQL editor (Project → SQL Editor → New query).
--
-- Data model note: certification bodies like GIMDES mostly publish
-- COMPANY/BRAND-level certificates, not per-barcode entries. JAKIM's
-- MyeHalal portal does have product-level records. `entry_type` covers
-- both shapes in one table so the app can match on barcode when one
-- exists, and fall back to brand/product-name search otherwise.

create extension if not exists pg_trgm;

create type halal_status as enum ('halal', 'haram', 'mushbooh', 'unknown');

create table certifiers (
  id text primary key,              -- e.g. 'gimdes', 'jakim'
  name text not null,
  short_name text not null,
  country text not null,
  source_url text,
  last_synced_at timestamptz,
  logo_url text                     -- Supabase Storage public URL (certifier-logos bucket), admin-uploaded
);

create table certified_entries (
  id uuid primary key default gen_random_uuid(),
  entry_type text not null check (entry_type in ('product', 'company')),
  barcode text,                     -- null for company-level entries (most GIMDES rows)
  product_name text,
  brand text not null,
  category text,
  status halal_status not null default 'halal',
  certifier_id text not null references certifiers(id),
  certificate_number text,
  verified_at date,
  ingredients text[] not null default '{}',
  notes text,
  image_url text,                   -- product photo — from Open Food Facts on import, or pasted by an admin
  source_url text,                  -- link back to the certifier's own listing, for transparency
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unique (not just indexed) so a barcode can only ever have one row —
-- scripts/sync/run.ts's Open Food Facts import relies on this via
-- upsert(..., { onConflict: 'barcode' }); without it, a large batch could
-- silently write duplicate rows for the same barcode.
--
-- Deliberately NOT partial (no `where barcode is not null`): Postgres
-- will only use a partial unique index as an ON CONFLICT target if the
-- INSERT's own ON CONFLICT clause repeats that same WHERE predicate —
-- something Supabase's .upsert({ onConflict: 'barcode' }) has no way to
-- express, so a partial version of this index always fails upsert with
-- "there is no unique or exclusion constraint matching the ON CONFLICT
-- specification", even though the index exists. A plain unique index
-- still allows any number of NULL barcodes (company-level entries) since
-- Postgres never treats NULL as equal to NULL for uniqueness.
create unique index idx_certified_entries_barcode_unique on certified_entries (barcode);
create index idx_certified_entries_brand_trgm on certified_entries using gin (brand gin_trgm_ops);
create index idx_certified_entries_product_trgm on certified_entries using gin (coalesce(product_name, '') gin_trgm_ops);

-- Row Level Security: the app only ever holds the public "anon" key, so it
-- must only be able to read. Writes (the GIMDES/JAKIM sync job) run with
-- the service_role key, which bypasses RLS entirely and is never shipped
-- in the app.
alter table certifiers enable row level security;
alter table certified_entries enable row level security;

create policy "Public read access" on certifiers
  for select using (true);

create policy "Public read access" on certified_entries
  for select using (true);

-- Needed by both approveSubmission() (lib/submissions.ts, promotes an
-- approved community submission into this table) and the admin panel's
-- Məhsullar section (direct add/delete). Same no-real-backend-auth caveat
-- as product_submissions above — gated client-side only.
create policy "Public insert" on certified_entries
  for insert with check (true);

create policy "Public update" on certified_entries
  for update using (true) with check (true);

create policy "Public delete" on certified_entries
  for delete using (true);

insert into certifiers (id, name, short_name, country, source_url) values
  ('gimdes', 'GIMDES – Gıda ve İhtiyaç Maddeleri Denetleme ve Sertifikalandırma Araştırmaları Derneği', 'GIMDES', 'Türkiyə', 'https://www.gimdes.org/'),
  ('jakim', 'JAKIM – Department of Islamic Development Malaysia', 'JAKIM', 'Malaziya', 'https://myehalal.halal.gov.my/'),
  ('azstandart', 'AZSTANDART Halal Sertifikatlaşdırma Orqanı (Azərbaycan Standartlaşdırma İnstitutu)', 'AZSTANDART', 'Azərbaycan', 'https://azstandart.az/');

-- Push notification device tokens. Delivery itself goes through Firebase
-- Cloud Messaging (see lib/notifications.ts) — this table just lets a
-- future backend send a TARGETED push (e.g. "your favorited product's
-- status changed") instead of only the broadcast topic every device
-- auto-subscribes to. `user_id` is the app's local user id (lib/types.ts
-- User.id), not a Supabase Auth id — this app's login is still local-only,
-- not backed by Supabase Auth.
create table device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  fcm_token text not null unique,
  platform text not null default 'ios',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table device_tokens enable row level security;

-- Write-only from the app's anon key: a device can register/update its own
-- token, but nothing can list tokens back out through this key — only the
-- service_role (a future send-notification backend) can read them.
create policy "Public insert" on device_tokens
  for insert with check (true);

create policy "Public update" on device_tokens
  for update using (true) with check (true);

-- Community contributions: users submit products they've checked, the app
-- owner reviews and approves/rejects, approvals promote the row into
-- certified_entries (under the 'halalzur' certifier — community-verified,
-- distinct from official bodies like GIMDES) and award the submitter points.
--
-- SECURITY CAVEAT: this app has no real backend auth (login is local-only,
-- not Supabase Auth), so `submitted_by`/`user_id` are just self-reported
-- strings from the client — nothing stops a user from claiming a different
-- id, and RLS can't restrict "update" to only the admin because there's no
-- server-side identity to check against. The admin screen in the app gates
-- access by checking the signed-in email against a hardcoded constant
-- (lib/admin.ts) — a client-side check only, not real access control.
-- Before a real public launch, replace local auth with Supabase Auth so
-- these policies can check auth.uid() / a real admin role server-side.
insert into certifiers (id, name, short_name, country, source_url) values
  ('halalzur', 'Halalzur icma yoxlaması (istifadəçi təklifi, komanda tərəfindən təsdiqlənib)', 'Halalzur', 'İcma', null);

-- Not a certifier — a placeholder for scripts/sync/openFoodFacts.ts's bulk
-- import, so certified_entries.certifier_id (not null) has somewhere valid
-- to point. Every row synced under this id is status='unknown': it's raw
-- product/ingredient data for barcode coverage, not a halal claim.
insert into certifiers (id, name, short_name, country, source_url) values
  ('openfoodfacts', 'Open Food Facts (açıq baza, hələ yoxlanılmayıb)', 'Open Food Facts', 'Beynəlxalq', 'https://world.openfoodfacts.org/');

create table product_submissions (
  id uuid primary key default gen_random_uuid(),
  submitted_by text not null,       -- local user id (lib/types.ts User.id)
  submitted_by_name text,
  barcode text not null,
  product_name text not null,
  brand text not null,
  category text,
  suggested_status halal_status not null default 'halal',
  ingredients text[] not null default '{}',
  notes text,
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected')),
  admin_notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table product_submissions enable row level security;

create policy "Public insert" on product_submissions
  for insert with check (true);

create policy "Public read" on product_submissions
  for select using (true);

create policy "Public update" on product_submissions
  for update using (true) with check (true);

create table user_points (
  user_id text primary key,        -- local user id (lib/types.ts User.id)
  user_name text,
  points integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table user_points enable row level security;

create policy "Public read" on user_points
  for select using (true);

create policy "Public insert" on user_points
  for insert with check (true);

create policy "Public update" on user_points
  for update using (true) with check (true);

-- Halal-certified venues (restaurants/cafes/coffee shops) shown on the
-- Xəritə/Məkanlar tabs. Unlike products, there's no automated sync for
-- these yet — the admin adds each one by hand from the admin panel after
-- verifying it themselves, so (unlike certified_entries) there is no
-- pending-review queue here: a row in this table IS the published entry.
-- Same RLS caveat as product_submissions above: no real backend auth, so
-- writes go through the app's own anon key and are only gated by the
-- admin panel's client-side login screen.
-- If `places` already exists from an earlier run of this file, apply the
-- new columns/nullability with this migration instead of re-running the
-- CREATE TABLE below:
--   alter table places alter column latitude drop not null;
--   alter table places alter column longitude drop not null;
--   alter table places add column approved boolean not null default true;
--   alter table places add column submitted_by text;
--   alter table places add column submitted_by_name text;
create table places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('restoran', 'kafe', 'coffee_shop')),
  status halal_status not null default 'halal',
  address text not null,
  latitude double precision,
  longitude double precision,
  certifier_name text,
  note text,
  image_url text,
  -- Admin-panel-added rows default to approved; in-app user submissions
  -- (lib/places.ts submitPlace) insert with approved = false and only
  -- appear in getAllPlaces()/getPlacesByCategory() once an admin approves
  -- them from the admin panel's "Gözləyən məkanlar" section.
  approved boolean not null default true,
  submitted_by text,
  submitted_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table places enable row level security;

create policy "Public read" on places
  for select using (true);

create policy "Public insert" on places
  for insert with check (true);

create policy "Public update" on places
  for update using (true) with check (true);

create policy "Public delete" on places
  for delete using (true);

-- In-app announcements ("yeni versiya çıxdı", promo, maintenance notice,
-- etc.) — admin writes one from the admin panel, the app shows the latest
-- active one as a popup the first time each user opens it after it's
-- published (tracked locally per device via AsyncStorage, not here).
-- This is separate from real OS push notifications: those already work
-- today with zero backend code via the Firebase console (see the
-- BROADCAST_TOPIC note in lib/notifications.ts) — this table is only for
-- the in-app popup channel.
create table announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  cta_label text,
  cta_route text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table announcements enable row level security;

create policy "Public read" on announcements
  for select using (true);

create policy "Public insert" on announcements
  for insert with check (true);

create policy "Public update" on announcements
  for update using (true) with check (true);

create policy "Public delete" on announcements
  for delete using (true);

-- Mirrors lib/types.ts User for the admin panel's "İstifadəçilər" list.
-- SCOPE CAVEAT: only synced for Apple/Google Sign-In users (lib/userSync.ts)
-- — email/password sign-in is still the demo-only stub in auth-context.tsx
-- that hands every such user the same id ('local-user'), so syncing those
-- would just overwrite one row instead of listing real people. `plan` is
-- also self-reported by the client after StoreKit's on-device purchase
-- flow, not verified server-side against Apple — same no-real-backend
-- caveat as product_submissions above, not a source of billing truth.
--
-- premium_expires_at/claimed_achievements round-trip an achievement-
-- granted Premium (lib/achievements.ts) through here — without this they
-- only lived in local AsyncStorage, so signing out and back in reset
-- claimed_achievements to empty (letting the same tier be re-claimed) and
-- wiped the expiry (leaving an already-granted Premium with nothing to
-- ever clear it back to free).
-- If `users` already exists from an earlier run of this file, add the two
-- new columns instead of re-running the CREATE TABLE below:
--   alter table users add column premium_expires_at timestamptz;
--   alter table users add column claimed_achievements integer[] not null default '{}';
create table users (
  id text primary key,
  name text,
  email text,
  plan text not null default 'free' check (plan in ('free', 'premium')),
  premium_expires_at timestamptz,
  claimed_achievements integer[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table users enable row level security;

create policy "Public read" on users
  for select using (true);

create policy "Public insert" on users
  for insert with check (true);

create policy "Public update" on users
  for update using (true) with check (true);

-- One row per successful scan — powers the admin panel's Dashboard
-- (daily/weekly/monthly/yearly counts). Write-only from the app; no
-- user_id column on purpose, this is aggregate usage volume, not a
-- per-user history (lib/history-context.tsx already keeps that locally).
create table scan_events (
  id uuid primary key default gen_random_uuid(),
  barcode text not null,
  status halal_status,
  created_at timestamptz not null default now()
);

alter table scan_events enable row level security;

create policy "Public insert" on scan_events
  for insert with check (true);

create policy "Public read" on scan_events
  for select using (true);

create policy "Public delete" on scan_events
  for delete using (true);

-- Favorites for a signed-in (Apple/Google) account (lib/favorites.ts,
-- lib/favorites-context.tsx) — lets Favoritlər survive a reinstall or
-- device change instead of only living in local AsyncStorage. `data`
-- stores the full CertificationResult snapshot, not just a barcode,
-- since a favorited product may have come from an external lookup (Open
-- Food Facts/UPCitemdb) with no certified_entries row to join back to.
-- Same no-real-backend-auth caveat as product_submissions above.
create table favorites (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  barcode text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, barcode)
);

create index idx_favorites_user on favorites (user_id);

alter table favorites enable row level security;

create policy "Public select" on favorites
  for select using (true);

create policy "Public insert" on favorites
  for insert with check (true);

create policy "Public update" on favorites
  for update using (true) with check (true);

create policy "Public delete" on favorites
  for delete using (true);

-- Barcodes the admin has explicitly dismissed from the "Ən çox axtarılan
-- naməlum məhsullar" widget (e.g. a junk/misread scan, or a product they
-- deliberately don't want in the database) — without this there was no
-- way to make an entry stop reappearing short of fully adding it.
create table ignored_scan_barcodes (
  barcode text primary key,
  created_at timestamptz not null default now()
);

alter table ignored_scan_barcodes enable row level security;

create policy "Public select" on ignored_scan_barcodes
  for select using (true);

create policy "Public insert" on ignored_scan_barcodes
  for insert with check (true);

create policy "Public delete" on ignored_scan_barcodes
  for delete using (true);

-- Powers the admin panel's "Ən çox axtarılan naməlum məhsullar" widget —
-- scan_events already records every scan regardless of whether the user
-- submits it, so this surfaces demand for barcodes nobody has gotten
-- around to adding, without depending on anyone filling in the
-- product-submission form. Both source tables are already public-read,
-- so this view exposes nothing that wasn't already readable.
-- security_invoker: run this view under the querying role's own RLS,
-- not the view creator's — otherwise it silently bypasses RLS on its
-- source tables, which Supabase's security linter (correctly) flags even
-- though both source tables here are already public-read.
-- If `unclassified_scan_counts` already exists from an earlier run of
-- this file, apply just the new exclusion with:
--   create or replace view unclassified_scan_counts
--   with (security_invoker = true) as
--   select barcode, count(*) as scan_count, max(created_at) as last_scanned_at
--   from scan_events
--   where barcode is not null
--     and barcode not in (select barcode from certified_entries where barcode is not null)
--     and barcode not in (select barcode from ignored_scan_barcodes)
--   group by barcode
--   order by count(*) desc;
create view unclassified_scan_counts
with (security_invoker = true) as
select
  barcode,
  count(*) as scan_count,
  max(created_at) as last_scanned_at
from scan_events
where barcode is not null
  and barcode not in (select barcode from certified_entries where barcode is not null)
  and barcode not in (select barcode from ignored_scan_barcodes)
group by barcode
order by count(*) desc;

grant select on unclassified_scan_counts to anon;

-- Manual bug reports/feedback (Profil → "Xəta bildir / Rəy", and shaking
-- the device from anywhere in the app — lib/shake.ts). Not a replacement
-- for real crash reporting (nothing here captures an actual crash/stack
-- trace) — just a lightweight channel for a user to describe a problem.
create table feedback_reports (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  user_name text,
  message text not null,
  screenshot_url text,
  -- Mirrors this report as a GitHub Issue (admin-panel/api/github-issue.js)
  -- so bugs/suggestions are trackable outside the admin panel too; set
  -- best-effort right after insert, null if that call failed.
  github_issue_number integer,
  github_issue_url text,
  created_at timestamptz not null default now()
);

alter table feedback_reports enable row level security;

create policy "Public insert" on feedback_reports
  for insert with check (true);

create policy "Public select" on feedback_reports
  for select using (true);

create policy "Public delete" on feedback_reports
  for delete using (true);

-- Missing until now — lib/feedback.ts's createGithubIssue() writes
-- github_issue_number/github_issue_url back onto the row after insert, and
-- the admin panel writes admin_reply, but without an update policy both
-- were silently no-ops (RLS matches zero rows, no error) rather than an
-- actual failure either code path would have surfaced.
create policy "Public update" on feedback_reports
  for update using (true) with check (true);

-- Storage bucket for the shake-to-report screenshot (lib/screenshot.ts,
-- lib/feedback.ts uploadScreenshot). Public, matching this schema's
-- existing client-side-only-gating pattern — nothing here is more
-- sensitive than the feedback message itself, which is already public-read.
insert into storage.buckets (id, name, public)
values ('feedback-screenshots', 'feedback-screenshots', true)
on conflict (id) do nothing;

create policy "Public upload feedback screenshots" on storage.objects
  for insert to public
  with check (bucket_id = 'feedback-screenshots');

create policy "Public read feedback screenshots" on storage.objects
  for select to public
  using (bucket_id = 'feedback-screenshots');

-- Referral system (lib/referrals.ts, app/referrals.tsx). Each account
-- gets a short code lazily on first visit to the "Dostunu dəvət et"
-- screen; a new user enters a friend's code once, and both sides get a
-- points bonus via the same user_points table product-submission
-- approvals already award into.
alter table users add column referral_code text unique;

create table referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id text not null,
  referred_id text not null unique,
  created_at timestamptz not null default now()
);

alter table referrals enable row level security;

create policy "Public select" on referrals
  for select using (true);

create policy "Public insert" on referrals
  for insert with check (true);

-- "Tövsiyə olunan" flag — lets the admin panel pin specific products to
-- the front of a future featured/highlighted list without needing a
-- separate table.
alter table certified_entries add column featured boolean not null default false;

-- Per-category emoji shown on the admin panel's places map and (once wired
-- into the app) place markers. Only 3 rows ever exist — one per `places`
-- category check-constraint value — so this is a tiny lookup, not a
-- category management system; adding a genuinely new category still needs
-- a schema change to that check constraint.
create table place_category_icons (
  category text primary key,
  icon text not null default '📍'
);

insert into place_category_icons (category, icon) values
  ('restoran', '🍽️'), ('kafe', '☕'), ('coffee_shop', '🥐')
on conflict (category) do nothing;

alter table place_category_icons enable row level security;

create policy "Public read" on place_category_icons
  for select using (true);

create policy "Public update" on place_category_icons
  for update using (true) with check (true);

-- Ban/suspend — set from the admin panel's "İstifadəçilər" list;
-- lib/auth-context.tsx checks this on sign-in/session-restore and signs
-- the account back out immediately if set.
alter table users add column banned boolean not null default false;
alter table users add column ban_reason text;

-- Lets the admin reply to a feedback report from the panel; round-tripped
-- back to the reporting user once an in-app "my reports" screen reads it
-- (not built yet — the column exists now so replies aren't lost waiting).
alter table feedback_reports add column admin_reply text;
alter table feedback_reports add column admin_reply_at timestamptz;

-- One row per scripts/sync/run.ts run — only ever written by that script
-- (service_role, bypasses RLS), so there's no insert policy for the
-- anon key here, only read (for the admin panel's sync-history view).
create table sync_log (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  status text not null check (status in ('success', 'error')),
  written_count integer,
  message text,
  ran_at timestamptz not null default now()
);

alter table sync_log enable row level security;

create policy "Public read" on sync_log
  for select using (true);

-- Release-notes history the admin panel writes ("What's new"); once an
-- in-app screen reads it (not built yet) it becomes the app's own
-- changelog rather than only living in App Store Connect's release notes.
create table app_versions (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  release_notes text not null,
  released_at date not null default current_date,
  created_at timestamptz not null default now()
);

alter table app_versions enable row level security;

create policy "Public read" on app_versions
  for select using (true);

create policy "Public insert" on app_versions
  for insert with check (true);

create policy "Public delete" on app_versions
  for delete using (true);

-- Synced from the in-app language switcher (app/(tabs)/profile.tsx) so
-- the admin panel's broadcast push can target by language — nothing
-- server-side knew a user's language before this, it only ever lived in
-- local AsyncStorage.
alter table users add column language text not null default 'az' check (language in ('az', 'en', 'ru', 'tr'));

-- A broadcast push queued for a future send time. The admin panel inserts
-- these directly (same anon-key + RLS-gated pattern as everything else
-- here); a separate scheduled job (admin-panel/api/process-scheduled-
-- broadcasts.js, fired by .github/workflows/send-scheduled-broadcasts.yml)
-- is the only thing that ever flips one from 'pending' to 'sent'/'failed'.
create table scheduled_broadcasts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  -- Optional per-language overrides — blank means "fall back to the
  -- Azerbaijani title/body above" (see admin-panel/lib/broadcast.js).
  title_en text,
  body_en text,
  title_ru text,
  body_ru text,
  title_tr text,
  body_tr text,
  audience_plan text not null default 'all' check (audience_plan in ('all', 'free', 'premium')),
  audience_language text not null default 'all' check (audience_language in ('all', 'az', 'en', 'ru', 'tr')),
  send_at timestamptz not null,
  -- 'none' = one-shot (existing behavior: terminal 'sent'/'failed' after
  -- firing). Any other value keeps the row 'pending' and pushes send_at
  -- to the next occurrence after each send — see admin-panel/api/
  -- process-scheduled-broadcasts.js's nextSendAt().
  recurrence text not null default 'none' check (recurrence in ('none', 'daily', 'weekly', 'monthly')),
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'canceled')),
  sent_count integer,
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

alter table scheduled_broadcasts enable row level security;

create policy "Public read" on scheduled_broadcasts
  for select using (true);

create policy "Admin insert" on scheduled_broadcasts
  for insert with check (is_admin());

create policy "Admin update" on scheduled_broadcasts
  for update using (is_admin()) with check (is_admin());

-- Private admin note on a product — distinct from `notes`, which is
-- shown to end users (e.g. "E330 — bitki mənşəlidir..."); admin_note is
-- an admin-only reminder like "GIMDES-lə yoxlanmalıdır", never surfaced
-- in the app.
alter table certified_entries add column admin_note text;

-- Soft-delete: the admin panel's delete buttons now set this instead of
-- issuing a hard DELETE, so a bulk-delete mistake is recoverable from the
-- "Zibil qutusu" (trash) view. Every app-facing query in
-- lib/certification.ts and lib/places.ts filters deleted_at is null —
-- a soft-deleted row must never appear to a regular user.
alter table certified_entries add column deleted_at timestamptz;
alter table places add column deleted_at timestamptz;

-- Lightweight audit trail — logs the admin panel's more consequential
-- actions (status changes, deletes, bans, bulk operations). Not
-- exhaustive (this app has no real per-admin identity yet — see
-- lib/admin.ts's client-side-only gating caveat — so `actor` is
-- best-effort, generally just "admin"), but enough to answer "what
-- changed and roughly when" once a second admin exists.
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor text not null default 'admin',
  action text not null,
  entity_table text not null,
  entity_id text,
  details text,
  created_at timestamptz not null default now()
);

alter table audit_log enable row level security;

create policy "Public read" on audit_log
  for select using (true);

create policy "Public insert" on audit_log
  for insert with check (true);

-- Scheduled in-app announcements: if set, the announcement starts
-- inactive and a cron job (process-scheduled-broadcasts.js, the same
-- one that already sends scheduled push notifications) flips it active
-- once publish_at is due, deactivating whichever one was active before —
-- same one-active-at-a-time rule the admin panel's manual publish already
-- enforces.
alter table announcements add column publish_at timestamptz;

-- The admin panel can now manage certifiers directly (add GIMDES-style
-- entries for new certification bodies) instead of needing raw SQL.
create policy "Public insert" on certifiers
  for insert with check (true);

create policy "Public update" on certifiers
  for update using (true) with check (true);

create policy "Public delete" on certifiers
  for delete using (true);

-- Mirrors unclassified_scan_counts but for barcodes that DO have a
-- certified_entries match — powers the Dashboard's "Ən çox skan edilən
-- təsdiqli məhsullar" report.
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

-- Lets the admin highlight specific verified places (mirrors
-- certified_entries.featured for products) — shown first in the app's
-- Məkanlar list with a small badge.
alter table places add column if not exists featured boolean not null default false;

-- Community "tövsiyə et" (recommend) — a user taps this on a product's
-- detail screen (reached by either scanning or searching); one row per
-- user+barcode so a user can only recommend a given product once and can
-- un-recommend by removing their own row. Distinct from the admin-only
-- certified_entries.featured editorial flag — this is a popularity signal
-- the community drives, not something an admin curates by hand.
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

-- The admin panel's "merge duplicate products" reassigns a dropped
-- product's recommendation rows to the surviving barcode via PATCH
-- (admin-panel/index.html mergeProducts()) — needs update, not just
-- select/insert/delete.
drop policy if exists "Public update" on product_recommendations;
create policy "Public update" on product_recommendations
  for update using (true) with check (true);

-- Powers the admin panel's "Ən çox tövsiyə olunan məhsullar" report —
-- same shape as confirmed_scan_counts, but counting user recommends
-- instead of scans.
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

-- Same "tövsiyə et" pattern as product_recommendations, for places —
-- lets regular users recommend a place from the app (distinct from the
-- admin-only places.featured editorial flag).
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

-- Powers the admin panel's "Ən çox tövsiyə olunan məkanlar" report.
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

-- Guards against exactly the bug that let add_azstandart_companies.sql
-- create duplicate barcode-less rows when run more than once: a
-- 'product' entry (unlike a 'company' one — see this table's own
-- comment above about GIMDES's mostly brand-level certificates) must
-- always have a barcode. The barcode unique index only protects
-- non-null barcodes (Postgres never treats NULL as equal to NULL for
-- uniqueness), so nothing previously stopped a barcode-less INSERT from
-- being run again and again.
alter table certified_entries
  add constraint chk_product_requires_barcode check (entry_type <> 'product' or barcode is not null);

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
  -- Optional per-language overrides, same fallback rule as
  -- scheduled_broadcasts above.
  title_en text,
  body_en text,
  title_ru text,
  body_ru text,
  title_tr text,
  body_tr text,
  created_at timestamptz not null default now()
);
alter table notification_templates enable row level security;
drop policy if exists "Public read" on notification_templates;
create policy "Public read" on notification_templates for select using (true);
drop policy if exists "Public insert" on notification_templates;
create policy "Admin insert" on notification_templates for insert with check (is_admin());
drop policy if exists "Public delete" on notification_templates;
create policy "Admin delete" on notification_templates for delete using (is_admin());

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

-- Best-effort Premium purchase log, written client-side from
-- app/subscription.tsx's onPurchaseSuccess (the same moment the app
-- unlocks Premium locally). This is NOT verified server-side receipt
-- data and NOT what Apple actually paid out (App Store takes a 15-30%
-- cut, and this never sees renewals/refunds/cancellations — StoreKit
-- only calls onPurchaseSuccess for the initial purchase and manual
-- restores). It exists to give a rough "how many people bought which
-- plan, roughly how much gross" signal in the admin panel without
-- building real App Store Server API / Server Notifications V2
-- integration, which would be needed for verified, renewal-aware revenue.
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

-- Registration country, set once via a Vercel function (see
-- admin-panel/api/register-country.js) that reads Vercel's own
-- x-vercel-ip-country edge header — no third-party IP geolocation
-- lookup needed, since Vercel already resolves it at the network edge.
-- Best-effort: never blocks sign-up, stays null if the app has no
-- EXPO_PUBLIC_ADMIN_API_URL configured or the request fails.
alter table users add column if not exists country text;

-- Admin-added E-codes not in the app's hardcoded 307-entry reference
-- table (lib/eCodes.ts's E_CODES — a full migration of that list was
-- judged too large/risky to do in one pass). This is additive: the app
-- merges these with the hardcoded list at lookup time (lib/eCodes.ts's
-- loadCustomECodes()) rather than replacing anything, so an admin can
-- add a code the reference sheet is missing without anyone touching code.
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

-- Per-event point history — user_points only ever stored a running
-- total, with no way to ask "who was most active THIS month" (the
-- admin panel's leaderboard "Bu ay" toggle). Every awardPoints() call
-- (lib/points.ts) now also inserts one row here.
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

-- "My brands": a user follows a brand (app/product/[id].tsx's bell icon)
-- and gets a push when the admin panel changes the halal status of any
-- product from that brand (admin-panel/index.html's updateProduct()
-- looks this table up by brand, no separate notification setup needed).
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

-- Per-user 1-5 star quality/taste rating (separate from the 👍
-- "Tövsiyə et" recommendation, which is a plain up-vote with no scale).
-- lib/ratings.ts aggregates these client-side into an average + count.
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

-- De-dup markers for the two cron-fired per-user pushes (admin-panel/api/
-- win-back-push.js, recommend-push.js) — each only re-notifies a given
-- user after its own cooldown has passed.
alter table users add column if not exists last_winback_sent_at timestamptz;
alter table users add column if not exists last_recommend_sent_at timestamptz;

-- In-app "Halal guide" articles (app/guide.tsx), admin-authored via the
-- admin panel. Azerbaijani-only content, like product names/categories
-- elsewhere in this schema — translating admin-written articles into
-- 3 more languages per edit isn't realistic for a solo admin, so this
-- follows the same precedent rather than adding per-language columns.
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

-- Admin-added named-ingredient (not E-code) haram/mushbooh keywords —
-- additive to the hardcoded starter list in lib/haramKeywords.ts, same
-- pattern as custom_ecodes: the app merges these in at scan time
-- (loadCustomHaramKeywords()) rather than replacing anything.
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

-- Real (database-enforced) admin roles for the web admin panel — one
-- row per admin, keyed to a real Supabase Auth account (auth.users),
-- not the old single ADMIN_EMAIL/ADMIN_PASSPHRASE env-var pair. See
-- migration_2026_09_01_admin_roles_stage1.sql for the deploy story:
-- this table and the two helper functions below are safe to create on
-- their own (nothing depends on them yet); a SEPARATE, later migration
-- (migration_2026_09_01_admin_roles_stage2_rls.sql) is what actually
-- starts requiring is_admin() on the admin-only tables — run that only
-- after confirming the new login flow works.
--
-- Scope note: certified_entries (insert), product_submissions (update),
-- and users (update) deliberately stay open (using(true)) — the app's
-- own in-app admin approval screen (app/admin.tsx) writes to those
-- using the app's ordinary anon-key client, not Supabase Auth, and
-- users also carries the app's own self-updates (last_seen_at,
-- language, scansToday, etc.) alongside admin-only fields (banned,
-- plan). Tightening those would break the phone-based approval flow
-- and/or normal app usage; only the tables exclusively managed from
-- the web admin panel are covered by is_admin() below.
create table if not exists admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('super_admin', 'moderator')),
  created_at timestamptz not null default now()
);
alter table admin_profiles enable row level security;

-- SECURITY DEFINER so the internal admin_profiles lookup bypasses RLS —
-- these must be defined BEFORE admin_profiles' own policies below, and
-- those policies must call these functions rather than querying
-- admin_profiles directly: a policy on a table that queries that same
-- table in its own USING clause is a self-referencing policy, which
-- Postgres cannot resolve (it needs the very policy it's evaluating to
-- read the row), and silently behaves as "no rows" instead of erroring
-- — this was a real bug during development that made every login look
-- like "not an admin" even with a correct admin_profiles row.
create or replace function is_admin() returns boolean
  language sql security definer stable
  set search_path = public
  as $$ select exists (select 1 from admin_profiles where id = auth.uid()); $$;

create or replace function is_super_admin() returns boolean
  language sql security definer stable
  set search_path = public
  as $$ select exists (select 1 from admin_profiles where id = auth.uid() and role = 'super_admin'); $$;

drop policy if exists "Admins can read all profiles" on admin_profiles;
create policy "Admins can read all profiles" on admin_profiles for select
  using (is_admin());
drop policy if exists "Super admins manage profiles" on admin_profiles;
create policy "Super admins manage profiles" on admin_profiles for all
  using (is_super_admin())
  with check (is_super_admin());

-- Admin panel's "Dublikat hesabları birləşdir" (merge duplicate user
-- accounts) tool calls this via RPC — see supabase/migration_2026_09_01_
-- merge_users.sql for the full commentary on why the merge is one
-- transactional function rather than several REST calls from the browser.
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

  if exists (select 1 from user_points where user_id = duplicate_id) then
    insert into user_points (user_id, user_name, points)
      select primary_id, coalesce((select user_name from user_points where user_id = primary_id), user_name), points
      from user_points where user_id = duplicate_id
    on conflict (user_id) do update set points = user_points.points + excluded.points;
    delete from user_points where user_id = duplicate_id;
  end if;

  if exists (select 1 from referrals where referred_id = duplicate_id)
     and not exists (select 1 from referrals where referred_id = primary_id) then
    update referrals set referred_id = primary_id where referred_id = duplicate_id;
  else
    delete from referrals where referred_id = duplicate_id;
  end if;
  update referrals set referrer_id = primary_id where referrer_id = duplicate_id;

  update device_tokens set user_id = primary_id where user_id = duplicate_id;
  update product_submissions set submitted_by = primary_id where submitted_by = duplicate_id;
  update feedback_reports set user_id = primary_id where user_id = duplicate_id;
  update purchase_events set user_id = primary_id where user_id = duplicate_id;
  update points_log set user_id = primary_id where user_id = duplicate_id;

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

-- The admin panel's "E-kodlar" section can now edit a built-in E-code
-- (creating/updating a custom_ecodes row with the same code as an
-- "override" the app prefers over its hardcoded default) in addition to
-- adding brand-new codes and deleting old ones — custom_ecodes had no
-- update policy at all, so that upsert was silently rejected by RLS.
drop policy if exists "Public update" on custom_ecodes;
create policy "Public update" on custom_ecodes for update using (true) with check (true);

-- Admin panel product-image upload — same public-read/admin-write Storage
-- bucket pattern as "certifier-logos" above. The admin panel compresses/
-- resizes the image client-side before upload.
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

-- Multi-tier win-back push notifications — replaces the old single
-- "7+ days inactive, resend every 14 days" message with escalating
-- copy at each tier below. cron-jobs.js's runWinBackPush() sends the
-- highest tier a user has newly crossed, tracked via
-- users.last_winback_tier_sent so each tier fires exactly once per
-- user (never repeats, never skips ahead) instead of the same generic
-- nudge on a fixed schedule.
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

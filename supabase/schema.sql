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

-- is_admin()-gated as of migration_2026_09_04_admin_rls_lockdown.sql.
-- This used to be open ("Public insert/update/delete") for both the
-- admin panel's Məhsullar section AND an in-app admin.tsx approval
-- screen that wrote here with no real admin session (Apple/Google
-- sign-in never gets a Supabase Auth token) — meaning anyone holding the
-- public anon key could certify anything as Halal or delete real
-- entries. admin.tsx is removed; review now only happens through the
-- admin panel, which does authenticate with a real admin session.
create policy "Admin insert" on certified_entries
  for insert with check (is_admin());

create policy "Admin update" on certified_entries
  for update using (is_admin()) with check (is_admin());

create policy "Admin delete" on certified_entries
  for delete using (is_admin());

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

-- No anon/authenticated insert/update policies — see
-- migration_2026_09_05_device_tokens_lockdown.sql for why this table
-- being openly writable was critical, not just a privacy nicety:
-- delete-account.js's and sync-token.js's push-code "proof of device
-- ownership" flows both trust a device_tokens row at face value, so an
-- open write here let anyone redirect a victim's confirmation code to
-- their own device just by knowing the victim's user_id, bypassing both
-- flows entirely. register_device_token() (further down, once
-- users.sync_token exists) is the only way a row can be created now.
-- Nothing can list tokens back out through the anon key either way —
-- only the service_role (send-notification.js et al.) reads them.

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

-- is_admin()-gated as of migration_2026_09_04_admin_rls_lockdown.sql —
-- insert/select stay open (users submit and read their own submissions),
-- but the open update let a user PATCH their own row's review_status
-- straight to 'approved' without any admin ever looking at it, which
-- fraudulently inflates the approved-submission count
-- grant_achievement_premium counts to grant free Premium.
create policy "Admin update" on product_submissions
  for update using (is_admin()) with check (is_admin());

create table user_points (
  user_id text primary key,        -- local user id (lib/types.ts User.id)
  user_name text,
  points integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table user_points enable row level security;

create policy "Public read" on user_points
  for select using (true);

-- Insert/update are is_admin()-gated, not public — see
-- migration_2026_09_05_points_lockdown.sql: an open write policy here let
-- anyone forge their own points balance and redeem it for free Premium
-- via redeem_points_for_premium(). The one legitimate non-admin write
-- path (the referral bonus) goes through award_referral_points() below
-- instead, which is SECURITY DEFINER and bypasses this policy.
create policy "Admin insert" on user_points
  for insert with check (is_admin());

create policy "Admin update" on user_points
  for update using (is_admin()) with check (is_admin());

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
  category text not null check (category in ('restoran', 'kafe', 'coffee_shop', 'sirniyyat', 'qessabxana', 'market')),
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

-- update/delete are is_admin()-gated as of
-- migration_2026_09_04_admin_rls_lockdown.sql — insert stays open since
-- lib/places.ts's submitPlace() lets any user propose a place, always
-- with approved=false; the open "Public update" used to let anyone flip
-- their own (or anyone else's) place straight to approved=true, skipping
-- review entirely, and "Public delete" let anyone remove any place.
drop policy if exists "Public update" on places;
create policy "Admin update" on places
  for update using (is_admin()) with check (is_admin());

drop policy if exists "Public delete" on places;
create policy "Admin delete" on places
  for delete using (is_admin());

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

drop policy if exists "Public insert" on announcements;
create policy "Admin insert" on announcements
  for insert with check (is_admin());

drop policy if exists "Public update" on announcements;
create policy "Admin update" on announcements
  for update using (is_admin()) with check (is_admin());

drop policy if exists "Public delete" on announcements;
create policy "Admin delete" on announcements
  for delete using (is_admin());

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

-- Column-level lock-down on top of the row policy above: the row policy
-- has to stay `true` (single-row lookups by id/referral_code, and
-- id/name lookups for a known list of referred users, are legitimate
-- public reads this app relies on), but nothing client-side ever needs
-- another user's email through this table — exposing it in bulk to
-- anyone holding the public anon key was a standing PII leak. See
-- migration_2026_09_04_security_hardening.sql.
revoke select (email) on users from anon, authenticated;

create policy "Public insert" on users
  for insert with check (true);

create policy "Public update" on users
  for update using (true) with check (true);

-- Row-level "Public update"/"Public insert" above have to stay open for
-- real self-service edits (name, language, referral_code, last_seen_at,
-- muted_notification_types) — but that leaves plan/premium_expires_at/
-- claimed_achievements/banned/ban_reason writable by anyone holding the
-- public anon key too, which is a direct "PATCH yourself into permanent
-- free Premium (or un-ban yourself)" hole. See
-- migration_2026_09_05_users_premium_lockdown.sql for why this needs a
-- trigger rather than the column-REVOKE technique used for email/
-- sync_token elsewhere in this file (admin-panel's own admin session and
-- an ordinary signed-in user's session are both Postgres role
-- `authenticated` — only is_admin() tells them apart, and only a trigger
-- can call that and still fall through cleanly for the legitimate
-- SECURITY DEFINER Premium-grant functions and service_role writes).
create or replace function protect_premium_fields() returns trigger
language plpgsql
as $$
begin
  if current_user in ('anon', 'authenticated') and not is_admin() then
    if TG_OP = 'INSERT' then
      new.plan := 'free';
      new.premium_expires_at := null;
      new.claimed_achievements := '{}';
      new.banned := false;
      new.ban_reason := null;
    else
      new.plan := old.plan;
      new.premium_expires_at := old.premium_expires_at;
      new.claimed_achievements := old.claimed_achievements;
      new.banned := old.banned;
      new.ban_reason := old.ban_reason;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_premium_fields on users;
create trigger trg_protect_premium_fields
before insert or update on users
for each row execute function protect_premium_fields();

-- Per-account token claimed once by whichever device signs in to an
-- account id first, required by favorites_*/history_* below to gate
-- favorites/scan_history_backup access now that those tables have no
-- anon/authenticated policies of their own. See
-- migration_2026_09_05_sync_token.sql for the full rationale — only
-- claim_sync_token() (and service_role) may ever write this column, never
-- the open "Public update" policy above.
alter table users add column if not exists sync_token uuid;
revoke update (sync_token) on users from anon, authenticated;

create or replace function claim_sync_token(p_user_id text, p_token uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  with claimed as (
    update users set sync_token = p_token
      where id = p_user_id and sync_token is null
    returning 1
  )
  select exists (select 1 from claimed);
$$;

grant execute on function claim_sync_token(text, uuid) to anon, authenticated;

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

-- No anon/authenticated policies — user_id alone isn't a real credential
-- for 'apple-'/'google-' accounts (no Supabase Auth session to check via
-- auth.uid()), so this table is default-deny and only reachable through
-- the sync_token-gated favorites_* functions below. See
-- migration_2026_09_05_sync_token.sql.

create or replace function favorites_list(p_user_id text, p_token uuid)
returns setof favorites
language sql
security definer
set search_path = public
as $$
  select f.* from favorites f
  where f.user_id = p_user_id
    and exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token)
  order by f.created_at desc;
$$;

create or replace function favorites_upsert(p_user_id text, p_token uuid, p_barcode text, p_data jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  insert into favorites (user_id, barcode, data)
  select p_user_id, p_barcode, p_data
  where exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token)
  on conflict (user_id, barcode) do update set data = excluded.data;
$$;

create or replace function favorites_delete(p_user_id text, p_token uuid, p_barcode text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from favorites f
  where f.user_id = p_user_id and f.barcode = p_barcode
    and exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token);
$$;

grant execute on function favorites_list(text, uuid) to anon, authenticated;
grant execute on function favorites_upsert(text, uuid, text, jsonb) to anon, authenticated;
grant execute on function favorites_delete(text, uuid, text) to anon, authenticated;

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

-- is_admin()-gated — see migration_2026_09_05_admin_only_tables_
-- lockdown.sql. Never written by the app (only admin-panel's "dismiss"
-- button), so the old "Public insert/delete" was pure over-
-- permissioning: anyone could insert a barcode here to make a real
-- popular unclassified product silently disappear from the admin's
-- review widget. Select stays public — unclassified_scan_counts
-- (security_invoker = true) needs it for the anon role.
create policy "Admin insert" on ignored_scan_barcodes
  for insert with check (is_admin());

create policy "Admin delete" on ignored_scan_barcodes
  for delete using (is_admin());

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

-- is_admin()-gated, not public — see
-- migration_2026_09_05_feedback_reports_lockdown.sql: with select also
-- public and no user_id check at all, "Public update" let anyone
-- overwrite ANY report, including forging a fake admin_reply that then
-- displays on the real reporter's own screen as if support wrote it.
-- lib/feedback.ts's own narrow write (github_issue_number/url onto the
-- row it just inserted) goes through set_feedback_github_issue() further
-- down instead.
create policy "Admin update" on feedback_reports
  for update using (is_admin()) with check (is_admin());

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

-- Bucket-level cap — the app itself always uploads image/jpeg (lib/
-- feedback.ts's uploadScreenshot), but nothing previously stopped a
-- caller going around the app and using this public-insert bucket to
-- host arbitrary large files or non-image content directly via the
-- Storage API with the same anon key. See
-- migration_2026_09_05_feedback_bucket_limits.sql.
update storage.buckets
set file_size_limit = 5242880, -- 5 MB — generous for a device screenshot
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'feedback-screenshots';

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

-- No insert policy — see redeem_referral_code() further down, which is
-- the only way a referrals row can be created now (security definer,
-- bypasses RLS); the removed "Public insert" let anyone insert an
-- arbitrary {referrer_id, referred_id} pair directly. See
-- migration_2026_09_05_points_lockdown.sql.

-- "Tövsiyə olunan" flag — lets the admin panel pin specific products to
-- the front of a future featured/highlighted list without needing a
-- separate table.
alter table certified_entries add column featured boolean not null default false;

-- Per-category emoji shown on the admin panel's places map and (once wired
-- into the app) place markers. One row per `places` category
-- check-constraint value — so this is a tiny lookup, not a category
-- management system; adding a genuinely new category still needs a
-- schema change to that check constraint (see places.category above).
create table place_category_icons (
  category text primary key,
  icon text not null default '📍'
);

insert into place_category_icons (category, icon) values
  ('restoran', '🍽️'), ('kafe', '☕'), ('coffee_shop', '🥐'),
  ('sirniyyat', '🍬'), ('qessabxana', '🥩'), ('market', '🛒')
on conflict (category) do nothing;

alter table place_category_icons enable row level security;

create policy "Public read" on place_category_icons
  for select using (true);

-- is_admin()-gated — see migration_2026_09_05_admin_only_tables_
-- lockdown.sql. Never written by the app, only admin-panel.
create policy "Admin update" on place_category_icons
  for update using (is_admin()) with check (is_admin());

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

drop policy if exists "Public insert" on app_versions;
create policy "Admin insert" on app_versions
  for insert with check (is_admin());

drop policy if exists "Public delete" on app_versions;
create policy "Admin delete" on app_versions
  for delete using (is_admin());

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
-- is_admin()-gated as of migration_2026_09_04_admin_rls_lockdown.sql —
-- see that file for why "Public" here was a real vulnerability, not just
-- a naming leftover.
drop policy if exists "Public insert" on certifiers;
create policy "Admin insert" on certifiers
  for insert with check (is_admin());

drop policy if exists "Public update" on certifiers;
create policy "Admin update" on certifiers
  for update using (is_admin()) with check (is_admin());

drop policy if exists "Public delete" on certifiers;
create policy "Admin delete" on certifiers
  for delete using (is_admin());

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

-- Insert/delete removed as of migration_2026_09_05_recommendations_
-- lockdown.sql — "Public insert/delete" let anyone recommend/un-
-- recommend a product as any user_id. A regular user's own toggle now
-- goes through recommend_product_add()/recommend_product_remove()
-- (sync_token-gated, further down).
drop policy if exists "Public insert" on product_recommendations;
drop policy if exists "Public delete" on product_recommendations;

-- The admin panel's "merge duplicate products" reassigns a dropped
-- product's recommendation rows to the surviving barcode via PATCH
-- (admin-panel/index.html mergeProducts()) — is_admin()-gated rather
-- than a token-gated RPC since it operates across many different
-- users' rows by barcode, not one caller's own row.
drop policy if exists "Public update" on product_recommendations;
create policy "Admin update" on product_recommendations
  for update using (is_admin()) with check (is_admin());
create policy "Admin delete" on product_recommendations
  for delete using (is_admin());

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

-- Insert/delete removed as of migration_2026_09_05_recommendations_
-- lockdown.sql — same reasoning as product_recommendations above. No
-- admin-panel feature writes this table directly (only reads it), so
-- unlike product_recommendations there's no is_admin() carve-out needed.
drop policy if exists "Public insert" on place_recommendations;
drop policy if exists "Public delete" on place_recommendations;

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
create policy "Admin insert" on product_categories for insert with check (is_admin());
drop policy if exists "Public update" on product_categories;
create policy "Admin update" on product_categories for update using (is_admin()) with check (is_admin());
drop policy if exists "Public delete" on product_categories;
create policy "Admin delete" on product_categories for delete using (is_admin());

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
create policy "Admin insert" on custom_ecodes for insert with check (is_admin());
drop policy if exists "Public delete" on custom_ecodes;
create policy "Admin delete" on custom_ecodes for delete using (is_admin());

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
-- is_admin()-gated, not public — see migration_2026_09_05_points_lockdown.sql;
-- award_referral_points() below is SECURITY DEFINER and bypasses this.
create policy "Admin insert" on points_log for insert with check (is_admin());

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
-- Select stays public (admin-panel's status-change push looks this up
-- across all users by brand from its own already-privileged session);
-- insert/delete moves to brand_follow_add()/brand_follow_remove()
-- further down — see migration_2026_09_05_community_content_lockdown.sql.
-- The removed policy let anyone follow/unfollow a brand on anyone's
-- behalf.
create policy "Public select" on brand_follows for select using (true);

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
-- Select stays public (aggregate + per-product ratings are shown to
-- everyone); insert/update moves to rating_upsert() further down — see
-- migration_2026_09_05_community_content_lockdown.sql. The removed
-- policy let anyone overwrite any user's rating for any product.
create policy "Public select" on product_ratings for select using (true);

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
-- Split as of migration_2026_09_04_admin_rls_lockdown.sql — select stays
-- public (app/guide.tsx reads it), writes are is_admin()-gated; the
-- single "for all using(true)" policy let anyone deface/delete articles.
drop policy if exists "Public read/insert/update/delete" on guide_articles;
create policy "Public read" on guide_articles for select using (true);
create policy "Admin insert" on guide_articles for insert with check (is_admin());
create policy "Admin update" on guide_articles for update using (is_admin()) with check (is_admin());
create policy "Admin delete" on guide_articles for delete using (is_admin());

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
-- Split as of migration_2026_09_04_admin_rls_lockdown.sql — select stays
-- public (lib/haramKeywords.ts reads it at scan time), writes are
-- is_admin()-gated. This one mattered most of the tables in that
-- migration: anyone with the anon key could otherwise delete a real
-- haram keyword (e.g. remove "pork" from the list), silently making the
-- detector pass a haram product as safe.
drop policy if exists "Public read/insert/delete" on haram_keywords;
create policy "Public read" on haram_keywords for select using (true);
create policy "Admin insert" on haram_keywords for insert with check (is_admin());
create policy "Admin update" on haram_keywords for update using (is_admin()) with check (is_admin());
create policy "Admin delete" on haram_keywords for delete using (is_admin());

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
create policy "Admin update" on custom_ecodes for update using (is_admin()) with check (is_admin());

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
create policy "Admin update" on winback_templates for update using (is_admin()) with check (is_admin());

insert into winback_templates (days_inactive, title, body) values
  (7, 'Sizi darıxdıq!', 'Yeni halal məhsulları yoxlamaq üçün Halalzur-a qayıdın 🍏'),
  (30, 'Bir aydır görüşmürük', 'Bu müddətdə bazamıza yüzlərlə yeni məhsul əlavə olundu — gəl bir bax 👀'),
  (90, '3 aydır sizi gözləyirik', 'Halal seçimlərini asanlaşdırmaq üçün buradayıq — Halalzur-a qayıdıb yenidən skan etməyə başlayın 🔍'),
  (180, 'Uzun müddətdir görüşmürük 💚', 'Halalzur hələ də yanınızdadır — geri qayıdın, sizin üçün nə dəyişib görün.')
on conflict (days_inactive) do nothing;

-- Not a certifier — same placeholder role as 'openfoodfacts' above, for
-- scripts/sync/azexport.ts's bulk import from azexport.az (AZPROMO's
-- export directory). Every row synced under this id is status='unknown':
-- it's real Azerbaijani-market barcode/product data, not a halal claim.
insert into certifiers (id, name, short_name, country, source_url) values
  ('azexport', 'AzExport.az (açıq baza, hələ yoxlanılmayıb)', 'AzExport', 'Azərbaycan', 'https://azexport.az/')
on conflict (id) do nothing;
-- Run this in Supabase → SQL Editor. Safe to run more than once.
--
-- Closes the smaller, lower-urgency gap flagged in
-- admin-panel/api/verify-purchase.js's header comment: referral-milestone
-- and achievement Premium grants used to be computed entirely client-side
-- (lib/referrals.ts's grantMilestoneBonusIfEarned, lib/auth-context.tsx's
-- grantAchievementPremium) and then written straight to users.plan via
-- the same open ("Public update") RLS policy real profile edits need —
-- so anyone holding the public anon key could PATCH themselves into
-- Premium by claiming a referral count or approved-submission count they
-- never actually had, the same class of bypass the purchase-verification
-- fix closed for real purchases.
--
-- Fix: two security-definer functions recompute eligibility from the
-- actual `referrals` / `product_submissions` rows (not a client-supplied
-- number) and track which milestones/tiers have already been granted, so
-- calling either function — with any user id, since this app has no
-- server-verified per-request identity to check against — can only ever
-- grant a reward that id has genuinely already earned; it can no longer
-- be used to self-grant free Premium out of thin air.

alter table users add column if not exists granted_referral_milestones int[] not null default '{}';

create or replace function grant_referral_milestone_bonus(p_user_id text)
returns table (granted_days int, new_expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_milestone record;
  v_current_plan text;
  v_current_expires timestamptz;
  v_base timestamptz;
  v_new_expires timestamptz;
begin
  select count(*) into v_count from referrals where referrer_id = p_user_id;

  -- Must match lib/referrals.ts's REFERRAL_MILESTONES.
  select m.threshold, m.days into v_milestone from (
    values (5, 30), (10, 60), (25, 180)
  ) as m(threshold, days)
  where m.threshold <= v_count
    and not (m.threshold = any (
      select coalesce(u.granted_referral_milestones, '{}') from users u where u.id = p_user_id
    ))
  order by m.threshold desc
  limit 1;

  if v_milestone is null then
    return;
  end if;

  select plan, premium_expires_at into v_current_plan, v_current_expires from users where id = p_user_id;
  if not found then
    return;
  end if;

  v_base := case
    when v_current_plan = 'premium' and v_current_expires is not null and v_current_expires > now()
    then v_current_expires
    else now()
  end;
  v_new_expires := v_base + (v_milestone.days || ' days')::interval;

  update users
  set plan = 'premium',
      premium_expires_at = v_new_expires,
      granted_referral_milestones = array_append(coalesce(granted_referral_milestones, '{}'), v_milestone.threshold),
      updated_at = now()
  where id = p_user_id;

  granted_days := v_milestone.days;
  new_expires_at := v_new_expires;
  return next;
end;
$$;

create or replace function grant_achievement_premium(p_user_id text)
returns table (granted_days int, tier_threshold int, new_expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_tier record;
  v_current_plan text;
  v_current_expires timestamptz;
  v_base timestamptz;
  v_new_expires timestamptz;
begin
  select count(*) into v_count
  from product_submissions
  where submitted_by = p_user_id and review_status = 'approved';

  -- Must match lib/achievements.ts's ACHIEVEMENT_TIERS.
  select t.threshold, t.days into v_tier from (
    values (1,1), (5,3), (10,7), (20,14), (30,30), (50,90), (75,180), (100,365)
  ) as t(threshold, days)
  where t.threshold <= v_count
    and not (t.threshold = any (
      select coalesce(u.claimed_achievements, '{}') from users u where u.id = p_user_id
    ))
  order by t.threshold desc
  limit 1;

  if v_tier is null then
    return;
  end if;

  select plan, premium_expires_at into v_current_plan, v_current_expires from users where id = p_user_id;
  if not found then
    return;
  end if;

  v_base := case
    when v_current_plan = 'premium' and v_current_expires is not null and v_current_expires > now()
    then v_current_expires
    else now()
  end;
  v_new_expires := v_base + (v_tier.days || ' days')::interval;

  update users
  set plan = 'premium',
      premium_expires_at = v_new_expires,
      claimed_achievements = array_append(coalesce(claimed_achievements, '{}'), v_tier.threshold),
      updated_at = now()
  where id = p_user_id;

  granted_days := v_tier.days;
  tier_threshold := v_tier.threshold;
  new_expires_at := v_new_expires;
  return next;
end;
$$;

-- Same fix applied to lib/points.ts's redeemPointsForPremium: it already
-- read a real points balance and deducted it correctly, but the actual
-- Premium grant then happened as a second, separate client write through
-- the same open users.plan policy, trusting the day count the client
-- passed back rather than recomputing it — and being two non-atomic
-- steps, a crash between them could deduct points without ever granting
-- the time. This does both in one transaction.
create or replace function redeem_points_for_premium(p_user_id text)
returns table (granted_days int, new_expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points int;
  v_days int;
  v_spent int;
  v_current_plan text;
  v_current_expires timestamptz;
  v_base timestamptz;
  v_new_expires timestamptz;
begin
  select points into v_points from user_points where user_id = p_user_id;
  v_points := coalesce(v_points, 0);

  -- Must match lib/points.ts's POINTS_PER_PREMIUM_DAY (10) / MIN_REDEEMABLE_DAYS (3).
  v_days := floor(v_points / 10);
  if v_days < 3 then
    return;
  end if;
  v_spent := v_days * 10;

  update user_points
  set points = points - v_spent, updated_at = now()
  where user_id = p_user_id;

  select plan, premium_expires_at into v_current_plan, v_current_expires from users where id = p_user_id;
  if not found then
    return;
  end if;

  v_base := case
    when v_current_plan = 'premium' and v_current_expires is not null and v_current_expires > now()
    then v_current_expires
    else now()
  end;
  v_new_expires := v_base + (v_days || ' days')::interval;

  update users
  set plan = 'premium', premium_expires_at = v_new_expires, updated_at = now()
  where id = p_user_id;

  granted_days := v_days;
  new_expires_at := v_new_expires;
  return next;
end;
$$;

-- Replaces lib/referrals.ts's old two-step client flow (insert a
-- referrals row through its own "Public insert" policy, then award
-- points through user_points/points_log's now-locked-down policies) with
-- one atomic function: it looks up the code, rejects a self-referral,
-- inserts the referrals row itself, and pays out — same pattern as
-- redeem_promo_code below. The old open "Public insert" on referrals let
-- anyone insert an arbitrary {referrer_id, referred_id} pair directly,
-- skipping the "does this code actually exist" check entirely (capped
-- only by referred_id's unique constraint at one forged referral per
-- account an attacker controls) — see
-- migration_2026_09_05_points_lockdown.sql.
create or replace function redeem_referral_code(p_user_id text, p_code text)
returns table (referrer_id text, referrer_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(trim(p_code));
  v_owner_id text;
  v_owner_name text;
  v_referred_name text;
  v_amount constant int := 20; -- must match lib/referrals.ts's REFERRAL_BONUS_POINTS
begin
  if v_code = '' then
    return;
  end if;

  select id, name into v_owner_id, v_owner_name from users where referral_code = v_code;
  if v_owner_id is null or v_owner_id = p_user_id then
    return; -- code not found, or a self-referral attempt
  end if;

  begin
    insert into referrals (referrer_id, referred_id) values (v_owner_id, p_user_id);
  exception when unique_violation then
    return; -- this account already redeemed a code (referred_id is unique)
  end;

  select name into v_referred_name from users where id = p_user_id;

  insert into user_points (user_id, user_name, points, updated_at)
  values (v_owner_id, v_owner_name, v_amount, now())
  on conflict (user_id) do update
    set points = user_points.points + v_amount, user_name = excluded.user_name, updated_at = now();

  insert into user_points (user_id, user_name, points, updated_at)
  values (p_user_id, v_referred_name, v_amount, now())
  on conflict (user_id) do update
    set points = user_points.points + v_amount, user_name = excluded.user_name, updated_at = now();

  insert into points_log (user_id, user_name, amount) values (v_owner_id, v_owner_name, v_amount);
  insert into points_log (user_id, user_name, amount) values (p_user_id, v_referred_name, v_amount);

  referrer_id := v_owner_id;
  referrer_name := v_owner_name;
  return next;
end;
$$;

grant execute on function redeem_referral_code(text, text) to anon, authenticated;

-- Callable by anon/authenticated (Supabase's default for new functions) —
-- deliberately not admin-gated, every user needs to trigger their own
-- reward check. Safe to be public: each function only ever pays out
-- against rows already committed to referrals/product_submissions/
-- user_points by legitimate flows, never a client-supplied number.
grant execute on function grant_referral_milestone_bonus(text) to anon, authenticated;
grant execute on function grant_achievement_premium(text) to anon, authenticated;
grant execute on function redeem_points_for_premium(text) to anon, authenticated;

-- Text review comments (alongside the existing 1-5 star product_ratings),
-- and a lightweight per-product community Q&A. Both follow the same
-- "public insert/read, no per-row auth" pattern as product_ratings and
-- product_submissions — this app has no real Supabase Auth session for
-- end users, so RLS can't scope by row owner; user_id is carried as a
-- plain column instead, same as everywhere else in this schema.

create table if not exists product_review_comments (
  id uuid primary key default gen_random_uuid(),
  barcode text not null,
  user_id text not null,
  user_name text,
  comment text not null,
  created_at timestamptz not null default now()
);
alter table product_review_comments enable row level security;
drop policy if exists "Public read/insert" on product_review_comments;
-- Select stays public (comments are public-facing by design); insert is
-- sync_token-gated via review_comment_add() further down — see
-- migration_2026_09_05_community_content_lockdown.sql. The removed
-- "Public insert" let anyone post a comment as any user_id.
create policy "Public select" on product_review_comments for select using (true);
create index if not exists product_review_comments_barcode_idx on product_review_comments (barcode);

create table if not exists product_qa_questions (
  id uuid primary key default gen_random_uuid(),
  barcode text not null,
  user_id text not null,
  user_name text,
  question text not null,
  created_at timestamptz not null default now()
);
alter table product_qa_questions enable row level security;
drop policy if exists "Public read/insert" on product_qa_questions;
-- Same treatment as product_review_comments above — insert moves to
-- qa_question_add() further down.
create policy "Public select" on product_qa_questions for select using (true);
create index if not exists product_qa_questions_barcode_idx on product_qa_questions (barcode);

create table if not exists product_qa_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references product_qa_questions (id) on delete cascade,
  user_id text not null,
  user_name text,
  answer text not null,
  created_at timestamptz not null default now()
);
alter table product_qa_answers enable row level security;
drop policy if exists "Public read/insert" on product_qa_answers;
-- Same treatment — insert moves to qa_answer_add() further down.
create policy "Public select" on product_qa_answers for select using (true);
create index if not exists product_qa_answers_question_id_idx on product_qa_answers (question_id);

-- Supports two new cron-fired pushes (admin-panel/api/cron-jobs.js) and
-- the new per-notification-type opt-out toggles (app Profile screen).

-- De-dup marker for the weekly "new products in your favorite category"
-- push — same cadence/resend pattern as users.last_recommend_sent_at.
alter table users add column if not exists last_category_digest_sent_at timestamptz;

-- 'YYYY-MM' of the last month a "Halal Detektiv" (most unknown-product
-- submissions that month) award was given — checked against the current
-- month so a re-run of the monthly cron job never double-awards.
alter table users add column if not exists last_detective_award_month text;

-- Per-notification-type opt-out — a text[] of type keys the user has
-- turned OFF (e.g. 'winback', 'recommend', 'category_digest', 'weekly_digest').
-- Empty/absent means "everything on" (today's default, unchanged for
-- existing users). Checked by each cron job before sending.
alter table users add column if not exists muted_notification_types text[] not null default '{}';

-- "Hədiyyə abunəlik" — a user spends their own earned points (the same
-- currency redeem_points_for_premium already lets them redeem for
-- themselves) to gift Premium days to a friend, found by referral code.
-- Real store-level subscription gifting isn't offered by react-native-iap/
-- StoreKit here, so this reuses the existing points economy instead of
-- requiring a new IAP product (which would need App Store Connect/Play
-- Console setup and a fresh build).
--
-- security definer so the point deduction + Premium grant happen in one
-- atomic transaction, following the same pattern as
-- migration_2026_09_04_server_side_reward_premium.sql's three functions —
-- the grant decision depends only on real committed rows (the sender's
-- actual point balance, the recipient's actual referral code), never a
-- client-supplied number.
-- Per-caller-id sliding-window throttle shared by gift_premium_from_points
-- and redeem_promo_code (defined further down, alongside promo_codes) —
-- created here first since gift_premium_from_points' declare block needs
-- the row type to already exist. See
-- migration_2026_09_04_security_hardening.sql.
create table if not exists promo_code_attempts (
  user_id text primary key,
  window_start timestamptz not null default now(),
  attempt_count int not null default 0
);
alter table promo_code_attempts enable row level security;
-- Deliberately no anon/authenticated policies — only ever touched from
-- inside the security-definer functions above/below, which run as their
-- owner regardless of RLS.

create or replace function gift_premium_from_points(p_from_user_id text, p_to_referral_code text, p_days int)
returns table (to_user_id text, to_name text, new_expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cost int;
  v_points int;
  v_to_id text;
  v_to_name text;
  v_base timestamptz;
  v_new_expires timestamptz;
  v_attempts promo_code_attempts%rowtype;
begin
  if p_days is null or p_days < 1 or p_from_user_id is null then
    return;
  end if;

  select * into v_attempts from promo_code_attempts where user_id = p_from_user_id for update;
  if v_attempts is null then
    insert into promo_code_attempts (user_id, window_start, attempt_count) values (p_from_user_id, now(), 1);
  elsif v_attempts.window_start < now() - interval '10 minutes' then
    update promo_code_attempts set window_start = now(), attempt_count = 1 where user_id = p_from_user_id;
  else
    if v_attempts.attempt_count >= 8 then
      return;
    end if;
    update promo_code_attempts set attempt_count = attempt_count + 1 where user_id = p_from_user_id;
  end if;

  v_cost := p_days * 10; -- must match lib/points.ts's POINTS_PER_PREMIUM_DAY

  select points into v_points from user_points where user_id = p_from_user_id;
  if v_points is null or v_points < v_cost then
    return;
  end if;

  select id, name into v_to_id, v_to_name from users where referral_code = upper(trim(p_to_referral_code));
  if v_to_id is null or v_to_id = p_from_user_id then
    return;
  end if;

  update user_points set points = points - v_cost, updated_at = now() where user_id = p_from_user_id;

  select case
    when plan = 'premium' and premium_expires_at is not null and premium_expires_at > now()
    then premium_expires_at
    else now()
  end into v_base
  from users where id = v_to_id;

  v_new_expires := v_base + (p_days || ' days')::interval;

  update users set plan = 'premium', premium_expires_at = v_new_expires, updated_at = now() where id = v_to_id;

  return query select v_to_id, v_to_name, v_new_expires;
end;
$$;

grant execute on function gift_premium_from_points(text, text, int) to anon, authenticated;

-- Cloud backup of scan history for signed-in (Apple/Google) accounts —
-- same shape/scope as the existing `favorites` table (lib/favorites.ts),
-- so history survives a reinstall/device change instead of only living
-- in AsyncStorage (lib/history-context.tsx's HISTORY_LIMIT-capped local
-- cache).
create table if not exists scan_history_backup (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  barcode text not null,
  data jsonb not null,
  scanned_at timestamptz not null default now(),
  unique (user_id, barcode)
);

create index if not exists idx_scan_history_backup_user on scan_history_backup (user_id);

alter table scan_history_backup enable row level security;
drop policy if exists "Public read/insert/update/delete" on scan_history_backup;

-- Default-deny, same reasoning as favorites above — only reachable
-- through the sync_token-gated history_* functions.

create or replace function history_list(p_user_id text, p_token uuid)
returns setof scan_history_backup
language sql
security definer
set search_path = public
as $$
  select h.* from scan_history_backup h
  where h.user_id = p_user_id
    and exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token)
  order by h.scanned_at desc
  limit 200;
$$;

create or replace function history_add(p_user_id text, p_token uuid, p_barcode text, p_data jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  insert into scan_history_backup (user_id, barcode, data, scanned_at)
  select p_user_id, p_barcode, p_data, now()
  where exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token)
  on conflict (user_id, barcode) do update set data = excluded.data, scanned_at = excluded.scanned_at;
$$;

create or replace function history_remove(p_user_id text, p_token uuid, p_barcode text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from scan_history_backup h
  where h.user_id = p_user_id and h.barcode = p_barcode
    and exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token);
$$;

create or replace function history_clear(p_user_id text, p_token uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from scan_history_backup h
  where h.user_id = p_user_id
    and exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token);
$$;

grant execute on function history_list(text, uuid) to anon, authenticated;
grant execute on function history_add(text, uuid, text, jsonb) to anon, authenticated;
grant execute on function history_remove(text, uuid, text) to anon, authenticated;
grant execute on function history_clear(text, uuid) to anon, authenticated;

-- Broadcast delivery history — admin-panel/lib/broadcast.js already
-- computes a sent/total count per send; this just persists it instead of
-- discarding it, so "Bildiriş çatdırılma statistikası" has real history
-- to show. "Açıldı" (opened) isn't tracked — that needs the app to report
-- notification-tap events back, which nothing currently does — so this is
-- delivery (sent/total), not an open-rate.
create table if not exists broadcast_log (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  audience_plan text,
  audience_language text,
  mode text not null, -- 'topic' (everyone) or 'targeted' (plan/language filtered)
  sent_count int,
  total_count int,
  created_at timestamptz not null default now()
);
alter table broadcast_log enable row level security;
drop policy if exists "Public read/insert" on broadcast_log;
-- is_admin()-gated select, no insert policy at all — see
-- migration_2026_09_05_points_lockdown.sql. This is only ever inserted
-- by admin-panel/lib/broadcast.js via the service_role key (bypasses RLS
-- regardless), never from the app, so "Public insert" served no purpose
-- and "Public read" needlessly exposed every broadcast's content and
-- delivery counts to anyone holding the anon key.
create policy "Admin select" on broadcast_log for select using (is_admin());

-- Admin-generated promo codes redeemable for Premium days — mirrors
-- gift_premium_from_points (migration_2026_09_04_gift_premium.sql) but
-- keyed by an admin-issued code instead of a friend's referral code. Real
-- store-level "offer codes" already exist natively in App Store Connect/
-- Play Console for actual subscription discounts; this is a separate,
-- simpler mechanism for hand-issued full-Premium-day grants (giveaways,
-- partnerships, support goodwill) that doesn't touch either store.
create table if not exists promo_codes (
  code text primary key,
  premium_days int not null check (premium_days > 0),
  max_redemptions int not null default 1 check (max_redemptions > 0),
  redeemed_count int not null default 0,
  expires_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);
alter table promo_codes enable row level security;
-- Locked down entirely as of migration_2026_09_04_admin_rls_lockdown.sql
-- — no client code reads or writes this table directly (redemption goes
-- through the redeem_promo_code security-definer RPC, which bypasses
-- RLS regardless), so the old "Public read/insert/update/delete" let
-- anyone mint their own promo_codes row and grant themselves unlimited
-- free Premium — the throttle added to redeem_promo_code earlier in this
-- file doesn't help if an attacker can just create the code they want.
drop policy if exists "Public read/insert/update/delete" on promo_codes;
create policy "Admin all" on promo_codes for all using (is_admin()) with check (is_admin());

create table if not exists promo_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  code text not null references promo_codes (code) on delete cascade,
  user_id text not null,
  redeemed_at timestamptz not null default now(),
  unique (code, user_id)
);
alter table promo_code_redemptions enable row level security;
-- Locked down entirely as of migration_2026_09_04_admin_rls_lockdown.sql
-- — same reasoning as promo_codes above; the RPC's own insert bypasses
-- RLS via security definer, and the open policy let anyone insert a fake
-- redemption row for a victim's user_id + a real code, silently blocking
-- that person's own future legitimate redemption of it.
drop policy if exists "Public read/insert" on promo_code_redemptions;
create policy "Admin all" on promo_code_redemptions for all using (is_admin()) with check (is_admin());

-- security definer so the redemption-count bump + Premium grant happen
-- atomically, same reasoning as gift_premium_from_points.
create or replace function redeem_promo_code(p_user_id text, p_code text)
returns table (granted_days int, new_expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(trim(p_code));
  v_row promo_codes%rowtype;
  v_base timestamptz;
  v_new_expires timestamptz;
  v_attempts promo_code_attempts%rowtype;
begin
  if p_user_id is null or length(trim(p_user_id)) = 0 or v_code is null or length(v_code) = 0 then
    return;
  end if;

  -- Per-caller-id sliding window: at most 8 attempts per rolling 10
  -- minutes — kills naive single-identity code guessing/hammering.
  select * into v_attempts from promo_code_attempts where user_id = p_user_id for update;
  if v_attempts is null then
    insert into promo_code_attempts (user_id, window_start, attempt_count) values (p_user_id, now(), 1);
  elsif v_attempts.window_start < now() - interval '10 minutes' then
    update promo_code_attempts set window_start = now(), attempt_count = 1 where user_id = p_user_id;
  else
    if v_attempts.attempt_count >= 8 then
      return;
    end if;
    update promo_code_attempts set attempt_count = attempt_count + 1 where user_id = p_user_id;
  end if;

  -- Requiring a real users row also stops an attacker exhausting a
  -- giveaway code's max_redemptions pool with entirely made-up ids.
  if not exists (select 1 from users where id = p_user_id) then
    return;
  end if;

  select * into v_row from promo_codes where code = v_code for update;
  if v_row.code is null then
    return;
  end if;
  if v_row.expires_at is not null and v_row.expires_at < now() then
    return;
  end if;
  if v_row.redeemed_count >= v_row.max_redemptions then
    return;
  end if;
  if exists (select 1 from promo_code_redemptions where code = v_code and user_id = p_user_id) then
    return;
  end if;

  insert into promo_code_redemptions (code, user_id) values (v_code, p_user_id);
  update promo_codes set redeemed_count = redeemed_count + 1 where code = v_code;

  select case
    when plan = 'premium' and premium_expires_at is not null and premium_expires_at > now()
    then premium_expires_at
    else now()
  end into v_base
  from users where id = p_user_id;

  v_new_expires := v_base + (v_row.premium_days || ' days')::interval;
  update users set plan = 'premium', premium_expires_at = v_new_expires, updated_at = now() where id = p_user_id;

  return query select v_row.premium_days, v_new_expires;
end;
$$;

grant execute on function redeem_promo_code(text, text) to anon, authenticated;

-- Manual refund/chargeback log — a record-keeping panel, not a live
-- payment-processor integration (Apple/Google don't push refund events
-- to this app anywhere yet); an admin enters what they see in App Store
-- Connect/Play Console's own refund reports.
create table if not exists refund_log (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  user_label text,
  amount_usd numeric,
  platform text check (platform in ('iOS', 'Android', 'other')),
  reason text,
  admin_note text,
  created_at timestamptz not null default now()
);
alter table refund_log enable row level security;
drop policy if exists "Public read/insert/delete" on refund_log;
-- is_admin()-gated — see migration_2026_09_05_points_lockdown.sql. This
-- table is entirely admin-panel-driven (admin-panel/index.html's refund
-- tab does the read, insert, and delete all through the admin's own
-- session) with no legitimate app-side write, so "Public
-- read/insert/delete" was pure over-permissioning: anyone with the anon
-- key could forge or delete refund records.
create policy "Admin select" on refund_log for select using (is_admin());
create policy "Admin insert" on refund_log for insert with check (is_admin());
create policy "Admin delete" on refund_log for delete using (is_admin());

-- One row per (platform, transaction id) ever successfully verified by
-- admin-panel/api/verify-purchase.js / verify-purchase-android.js — those
-- endpoints re-confirm a transactionId/purchaseToken against Apple/Google
-- on every call but, before this, never recorded that one had already
-- been consumed. Apple/Google keep confirming the same real, unexpired
-- transaction forever, so without this a purchase's id (visible in
-- device logs, a proxied request, or shared by its owner) could be
-- replayed against different userIds to grant unlimited free Premium.
-- android's "transaction_id" is the subscription-level purchaseToken,
-- which stays stable across legitimate renewal re-checks of the same
-- subscription — that's why both endpoints insert-if-new and only reject
-- when the existing row belongs to a *different* user, rather than
-- rejecting outright on a second sighting.
create table if not exists verified_purchases (
  platform text not null check (platform in ('ios', 'android')),
  transaction_id text not null,
  user_id text not null,
  product_id text not null,
  verified_at timestamptz not null default now(),
  primary key (platform, transaction_id)
);
alter table verified_purchases enable row level security;
-- No anon/authenticated policies — only ever touched by the service_role
-- key from those two endpoints.

-- One-time push-confirmation codes for admin-panel/api/delete-account.js's
-- self-service path. NOTIFY_SECRET (shared by that path) is a single
-- static value shipped in every app install, not a per-user credential,
-- so it never actually proved the caller *was* the account named in the
-- request body — combined with the public `users` read policy, anyone
-- holding that secret could otherwise permanently delete any account.
-- email-/password accounts have a real Supabase Auth session to verify
-- instead (see delete-account.js); apple-/google- accounts never get one,
-- so those go through this table: a random code pushed to the account's
-- own already-registered device (device_tokens has no anon SELECT
-- policy, so an outside caller who only knows the target userId cannot
-- read or guess it) must be echoed back before the delete proceeds.
create table if not exists account_deletion_codes (
  user_id text primary key,
  code text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table account_deletion_codes enable row level security;
-- No anon/authenticated policies — only ever touched by the service_role
-- key from delete-account.js.

-- Generic IP-keyed rate limiter (admin-panel/lib/rateLimit.js), used by
-- github-issue.js's NOTIFY_SECRET-gated "create" action — that secret is,
-- like NOTIFY_SECRET above, shipped in every app install rather than
-- being per-user, so this bounds how many public GitHub issues one
-- source can spam through it.
create table if not exists api_rate_limits (
  bucket text not null,
  identifier text not null,
  window_start timestamptz not null default now(),
  request_count int not null default 0,
  primary key (bucket, identifier)
);
alter table api_rate_limits enable row level security;
-- No anon/authenticated policies — only ever touched by the service_role
-- key from admin-panel/lib/rateLimit.js.

-- Lets lib/feedback.ts's "notify the admin of new feedback" push find the
-- admin's own users.id without querying users.email directly — that
-- column was revoked from anon/authenticated above, so a raw
-- `.eq('email', ...)` comes back empty for those roles. security definer
-- bypasses that column restriction the same way every other
-- privileged-lookup function in this file does.
create or replace function get_admin_user_id() returns text
language sql
security definer
set search_path = public
as $$
  select id from users where email = 'alamdarmanafov@gmail.com' limit 1;
$$;

grant execute on function get_admin_user_id() to anon, authenticated;

-- Backs admin-panel/api/sync-token.js's request/confirm push-code flow —
-- lets a device that lost its local sync_token (reinstall, new device;
-- see migration_2026_09_05_sync_token.sql) prove it's the legitimate
-- account owner and get a fresh token issued, the same way
-- account_deletion_codes above lets apple-/google- accounts confirm
-- deletion without a Supabase Auth session to check.
create table if not exists sync_token_recovery_codes (
  user_id text primary key,
  code text not null,
  expires_at timestamptz not null
);
alter table sync_token_recovery_codes enable row level security;
-- No anon/authenticated policies — only ever touched by the service_role
-- key from sync-token.js.

-- sync_token-gated writes for the remaining community-content tables —
-- see migration_2026_09_05_community_content_lockdown.sql. Same pattern
-- as favorites_*/history_* above; SELECT on these tables stays public
-- (comments/ratings/Q&A/brand-follows are public-facing by design), only
-- the writes needed a real per-account check.

create or replace function review_comment_add(
  p_user_id text, p_token uuid, p_user_name text, p_barcode text, p_comment text
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into product_review_comments (user_id, user_name, barcode, comment)
  select p_user_id, p_user_name, p_barcode, p_comment
  where exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token);
$$;

grant execute on function review_comment_add(text, uuid, text, text, text) to anon, authenticated;

create or replace function qa_question_add(
  p_user_id text, p_token uuid, p_user_name text, p_barcode text, p_question text
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into product_qa_questions (user_id, user_name, barcode, question)
  select p_user_id, p_user_name, p_barcode, p_question
  where exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token);
$$;

grant execute on function qa_question_add(text, uuid, text, text, text) to anon, authenticated;

create or replace function qa_answer_add(
  p_user_id text, p_token uuid, p_user_name text, p_question_id uuid, p_answer text
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into product_qa_answers (user_id, user_name, question_id, answer)
  select p_user_id, p_user_name, p_question_id, p_answer
  where exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token);
$$;

grant execute on function qa_answer_add(text, uuid, text, uuid, text) to anon, authenticated;

create or replace function rating_upsert(p_user_id text, p_token uuid, p_barcode text, p_rating smallint)
returns void
language sql
security definer
set search_path = public
as $$
  insert into product_ratings (user_id, barcode, rating, updated_at)
  select p_user_id, p_barcode, p_rating, now()
  where exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token)
  on conflict (user_id, barcode) do update set rating = excluded.rating, updated_at = now();
$$;

grant execute on function rating_upsert(text, uuid, text, smallint) to anon, authenticated;

create or replace function brand_follow_add(p_user_id text, p_token uuid, p_brand text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into brand_follows (user_id, brand)
  select p_user_id, p_brand
  where exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token)
  on conflict (user_id, brand) do nothing;
$$;

create or replace function brand_follow_remove(p_user_id text, p_token uuid, p_brand text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from brand_follows f
  where f.user_id = p_user_id and f.brand = p_brand
    and exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token);
$$;

grant execute on function brand_follow_add(text, uuid, text) to anon, authenticated;
grant execute on function brand_follow_remove(text, uuid, text) to anon, authenticated;

-- sync_token-gated writes for product_recommendations/place_recommendations
-- — see migration_2026_09_05_recommendations_lockdown.sql.

create or replace function recommend_product_add(p_user_id text, p_token uuid, p_barcode text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into product_recommendations (user_id, barcode)
  select p_user_id, p_barcode
  where exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token)
  on conflict (user_id, barcode) do nothing;
$$;

create or replace function recommend_product_remove(p_user_id text, p_token uuid, p_barcode text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from product_recommendations r
  where r.user_id = p_user_id and r.barcode = p_barcode
    and exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token);
$$;

grant execute on function recommend_product_add(text, uuid, text) to anon, authenticated;
grant execute on function recommend_product_remove(text, uuid, text) to anon, authenticated;

create or replace function recommend_place_add(p_user_id text, p_token uuid, p_place_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into place_recommendations (user_id, place_id)
  select p_user_id, p_place_id
  where exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token)
  on conflict (user_id, place_id) do nothing;
$$;

create or replace function recommend_place_remove(p_user_id text, p_token uuid, p_place_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from place_recommendations r
  where r.user_id = p_user_id and r.place_id = p_place_id
    and exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token);
$$;

grant execute on function recommend_place_add(text, uuid, uuid) to anon, authenticated;
grant execute on function recommend_place_remove(text, uuid, uuid) to anon, authenticated;

-- sync_token-gated device registration — see
-- migration_2026_09_05_device_tokens_lockdown.sql. Requiring the same
-- token favorites_*/history_* etc. use means only a device that has
-- genuinely signed in to this account can register itself as one of its
-- push targets, which is what delete-account.js's and sync-token.js's
-- push-code flows were already assuming was true.
create or replace function register_device_token(p_user_id text, p_token uuid, p_fcm_token text, p_platform text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into device_tokens (user_id, fcm_token, platform, updated_at)
  select p_user_id, p_fcm_token, p_platform, now()
  where exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token)
  on conflict (fcm_token) do update
    set user_id = excluded.user_id, platform = excluded.platform, updated_at = now();
$$;

grant execute on function register_device_token(text, uuid, text, text) to anon, authenticated;

-- Narrow, first-set-wins write for lib/feedback.ts's createGithubIssue() —
-- see migration_2026_09_05_feedback_reports_lockdown.sql for why
-- feedback_reports' old "Public update" was a real problem (anyone could
-- forge admin_reply on any report), not just a formality this replaces.
create or replace function set_feedback_github_issue(p_feedback_id uuid, p_issue_number int, p_issue_url text)
returns void
language sql
security definer
set search_path = public
as $$
  update feedback_reports
  set github_issue_number = p_issue_number, github_issue_url = p_issue_url
  where id = p_feedback_id and github_issue_number is null;
$$;

grant execute on function set_feedback_github_issue(uuid, int, text) to anon, authenticated;

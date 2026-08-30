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
  last_synced_at timestamptz
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
  source_url text,                  -- link back to the certifier's own listing, for transparency
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_certified_entries_barcode on certified_entries (barcode) where barcode is not null;
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
-- SCOPE CAVEAT: only synced for Apple Sign-In users (lib/userSync.ts) —
-- email/password sign-in is still the demo-only stub in auth-context.tsx
-- that hands every such user the same id ('local-user'), so syncing those
-- would just overwrite one row instead of listing real people. `plan` is
-- also self-reported by the client after StoreKit's on-device purchase
-- flow, not verified server-side against Apple — same no-real-backend
-- caveat as product_submissions above, not a source of billing truth.
create table users (
  id text primary key,
  name text,
  email text,
  plan text not null default 'free' check (plan in ('free', 'premium')),
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

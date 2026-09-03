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

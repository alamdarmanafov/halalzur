-- One-time migration for the admin panel's second batch of enhancements.
-- Run this once in Supabase → SQL Editor → New query, then it's safe to
-- delete this file (it's also mirrored into schema.sql for fresh installs).

alter table certified_entries add column featured boolean not null default false;

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

alter table users add column banned boolean not null default false;
alter table users add column ban_reason text;

alter table feedback_reports add column admin_reply text;
alter table feedback_reports add column admin_reply_at timestamptz;

-- Missing until now — both createGithubIssue()'s write-back of
-- github_issue_number/url and the admin panel's new admin_reply need this
-- to actually take effect (RLS otherwise silently matches zero rows).
create policy "Public update" on feedback_reports
  for update using (true) with check (true);

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

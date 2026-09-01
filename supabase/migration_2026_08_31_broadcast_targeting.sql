-- One-time migration: broadcast push audience targeting + scheduling.
-- Run this once in Supabase → SQL Editor → New query.

alter table users add column language text not null default 'az' check (language in ('az', 'en'));

create table scheduled_broadcasts (
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

create policy "Public read" on scheduled_broadcasts
  for select using (true);

create policy "Public insert" on scheduled_broadcasts
  for insert with check (true);

create policy "Public update" on scheduled_broadcasts
  for update using (true) with check (true);

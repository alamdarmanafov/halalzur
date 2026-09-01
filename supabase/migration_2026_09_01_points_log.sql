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

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

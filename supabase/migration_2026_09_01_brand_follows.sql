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

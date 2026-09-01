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

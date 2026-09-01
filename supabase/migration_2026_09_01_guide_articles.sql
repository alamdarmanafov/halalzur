-- Run this in Supabase → SQL Editor. Safe to run more than once.

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

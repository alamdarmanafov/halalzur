-- Run this in Supabase → SQL Editor. Safe to run more than once.

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
create policy "Public read/insert/update" on product_ratings for all using (true) with check (true);

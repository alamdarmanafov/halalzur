-- One-time migration: featured places + community product recommendations
-- (the "Tövsiyə et" button on the product detail screen). Run once in
-- Supabase → SQL Editor.

alter table places add column if not exists featured boolean not null default false;

create table if not exists product_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  barcode text not null,
  created_at timestamptz not null default now(),
  unique (user_id, barcode)
);

create index if not exists idx_product_recommendations_barcode on product_recommendations (barcode);

alter table product_recommendations enable row level security;

drop policy if exists "Public select" on product_recommendations;
create policy "Public select" on product_recommendations
  for select using (true);

drop policy if exists "Public insert" on product_recommendations;
create policy "Public insert" on product_recommendations
  for insert with check (true);

drop policy if exists "Public delete" on product_recommendations;
create policy "Public delete" on product_recommendations
  for delete using (true);

drop view if exists product_recommend_counts;
create view product_recommend_counts
with (security_invoker = true) as
select
  pr.barcode,
  count(*) as recommend_count,
  ce.product_name,
  ce.brand,
  ce.status
from product_recommendations pr
join certified_entries ce on ce.barcode = pr.barcode and ce.deleted_at is null
group by pr.barcode, ce.product_name, ce.brand, ce.status
order by count(*) desc;

grant select on product_recommend_counts to anon;

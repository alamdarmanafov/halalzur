-- One-time migration: the ORIGINAL first batch of 20 admin panel
-- enhancements (bulk status/category, CSV import/export, data-health
-- reports, private notes, soft-delete/trash, audit log, certifier
-- management, trend chart, leaderboard, user drill-down, global search,
-- scheduled announcements). Run once in Supabase → SQL Editor.

alter table certified_entries add column admin_note text;

alter table certified_entries add column deleted_at timestamptz;
alter table places add column deleted_at timestamptz;

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor text not null default 'admin',
  action text not null,
  entity_table text not null,
  entity_id text,
  details text,
  created_at timestamptz not null default now()
);

alter table audit_log enable row level security;

create policy "Public read" on audit_log
  for select using (true);

create policy "Public insert" on audit_log
  for insert with check (true);

alter table announcements add column publish_at timestamptz;

create policy "Public insert" on certifiers
  for insert with check (true);

create policy "Public update" on certifiers
  for update using (true) with check (true);

create policy "Public delete" on certifiers
  for delete using (true);

create view confirmed_scan_counts
with (security_invoker = true) as
select
  se.barcode,
  count(*) as scan_count,
  max(se.created_at) as last_scanned_at,
  ce.product_name,
  ce.brand,
  ce.status
from scan_events se
join certified_entries ce on ce.barcode = se.barcode and ce.deleted_at is null
where se.barcode is not null
group by se.barcode, ce.product_name, ce.brand, ce.status
order by count(*) desc;

grant select on confirmed_scan_counts to anon;

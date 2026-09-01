-- One-time migration: the ORIGINAL first batch of 20 admin panel
-- enhancements (bulk status/category, CSV import/export, data-health
-- reports, private notes, soft-delete/trash, audit log, certifier
-- management, trend chart, leaderboard, user drill-down, global search,
-- scheduled announcements). Run in Supabase → SQL Editor.
--
-- Safe to re-run: every statement below is written to skip or replace
-- whatever already exists, so a run that got interrupted partway through
-- (or was already run once) can just be run again from the top instead
-- of needing to figure out exactly where it stopped.

alter table certified_entries add column if not exists admin_note text;
alter table certified_entries add column if not exists deleted_at timestamptz;
alter table places add column if not exists deleted_at timestamptz;
alter table announcements add column if not exists publish_at timestamptz;

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor text not null default 'admin',
  action text not null,
  entity_table text not null,
  entity_id text,
  details text,
  created_at timestamptz not null default now()
);

alter table audit_log enable row level security;

drop policy if exists "Public read" on audit_log;
create policy "Public read" on audit_log
  for select using (true);

drop policy if exists "Public insert" on audit_log;
create policy "Public insert" on audit_log
  for insert with check (true);

drop policy if exists "Public insert" on certifiers;
create policy "Public insert" on certifiers
  for insert with check (true);

drop policy if exists "Public update" on certifiers;
create policy "Public update" on certifiers
  for update using (true) with check (true);

drop policy if exists "Public delete" on certifiers;
create policy "Public delete" on certifiers
  for delete using (true);

drop view if exists confirmed_scan_counts;
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

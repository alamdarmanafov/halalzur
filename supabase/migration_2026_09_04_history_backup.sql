-- Cloud backup of scan history for signed-in (Apple/Google) accounts —
-- same shape/scope as the existing `favorites` table (lib/favorites.ts),
-- so history survives a reinstall/device change instead of only living
-- in AsyncStorage (lib/history-context.tsx's HISTORY_LIMIT-capped local
-- cache).
create table if not exists scan_history_backup (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  barcode text not null,
  data jsonb not null,
  scanned_at timestamptz not null default now(),
  unique (user_id, barcode)
);

create index if not exists idx_scan_history_backup_user on scan_history_backup (user_id);

alter table scan_history_backup enable row level security;
drop policy if exists "Public read/insert/update/delete" on scan_history_backup;
create policy "Public read/insert/update/delete" on scan_history_backup for all using (true) with check (true);

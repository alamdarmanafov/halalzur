-- Run once in Supabase → SQL Editor. Idempotent (safe to re-run).
-- Adds a best-effort Premium purchase log for the admin panel's
-- "Premium gəlir (təxmini)" dashboard widget. See the matching comment
-- in supabase/schema.sql for what this is and, importantly, what it
-- is NOT (not verified receipts, not real Apple payout, no renewal/
-- refund tracking).

create table if not exists purchase_events (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  product_id text not null,
  estimated_usd_amount numeric not null,
  purchased_at timestamptz not null default now()
);
create index if not exists idx_purchase_events_purchased_at on purchase_events (purchased_at);
alter table purchase_events enable row level security;
drop policy if exists "Public insert" on purchase_events;
create policy "Public insert" on purchase_events for insert with check (true);
drop policy if exists "Public read" on purchase_events;
create policy "Public read" on purchase_events for select using (true);

-- Halalzur — pending migrations catch-up script.
--
-- Everything below was added to supabase/schema.sql during recent work but
-- has NOT yet been confirmed as run on the live Supabase database. Every
-- statement here is written to be safe to run even if some of it already
-- went through — it will just skip whatever already exists.
--
-- HOW TO RUN: Supabase dashboard → SQL Editor → New query → paste this
-- whole file → Run. Safe to run more than once.

-- 1) Shake-to-report screenshots (feedback_reports.screenshot_url + storage)
alter table feedback_reports add column if not exists screenshot_url text;

insert into storage.buckets (id, name, public)
values ('feedback-screenshots', 'feedback-screenshots', true)
on conflict (id) do nothing;

drop policy if exists "Public upload feedback screenshots" on storage.objects;
create policy "Public upload feedback screenshots" on storage.objects
  for insert to public
  with check (bucket_id = 'feedback-screenshots');

drop policy if exists "Public read feedback screenshots" on storage.objects;
create policy "Public read feedback screenshots" on storage.objects
  for select to public
  using (bucket_id = 'feedback-screenshots');

-- 2) Admin panel "Sil" (delete) button for unclassified scan barcodes
drop policy if exists "Public delete" on scan_events;
create policy "Public delete" on scan_events
  for delete using (true);

-- 3) Places: photo + directions
alter table places add column if not exists image_url text;

-- 4) Open Food Facts bulk import (barcode coverage without in-store scanning)
insert into certifiers (id, name, short_name, country, source_url) values
  ('openfoodfacts', 'Open Food Facts (açıq baza, hələ yoxlanılmayıb)', 'Open Food Facts', 'Beynəlxalq', 'https://world.openfoodfacts.org/')
on conflict (id) do nothing;

-- 5) Admin panel: product photo + ingredient/E-code review
alter table certified_entries add column if not exists image_url text;

-- 6) Referrals ("Dostunu dəvət et")
alter table users add column if not exists referral_code text unique;

create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id text not null,
  referred_id text not null unique,
  created_at timestamptz not null default now()
);

alter table referrals enable row level security;

drop policy if exists "Public select" on referrals;
create policy "Public select" on referrals
  for select using (true);

drop policy if exists "Public insert" on referrals;
create policy "Public insert" on referrals
  for insert with check (true);

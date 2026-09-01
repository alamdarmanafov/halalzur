-- One-time migration: featured/recommended places. Run once in
-- Supabase → SQL Editor.
alter table places add column if not exists featured boolean not null default false;

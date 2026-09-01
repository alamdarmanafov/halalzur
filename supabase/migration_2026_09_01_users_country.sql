-- Run once in Supabase → SQL Editor. Idempotent (safe to re-run).
-- See the matching comment in supabase/schema.sql.
alter table users add column if not exists country text;

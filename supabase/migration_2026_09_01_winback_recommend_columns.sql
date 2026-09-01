-- Run this in Supabase → SQL Editor. Safe to run more than once.

alter table users add column if not exists last_winback_sent_at timestamptz;
alter table users add column if not exists last_recommend_sent_at timestamptz;

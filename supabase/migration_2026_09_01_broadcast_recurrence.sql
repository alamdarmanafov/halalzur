-- Run this in Supabase → SQL Editor. Additive only — adds a `recurrence`
-- column to scheduled_broadcasts so the admin panel's "Planla" button can
-- create a repeating push (daily/weekly/monthly) instead of only a
-- one-shot one. Safe to run more than once.

alter table scheduled_broadcasts
  add column if not exists recurrence text not null default 'none';

alter table scheduled_broadcasts drop constraint if exists scheduled_broadcasts_recurrence_check;
alter table scheduled_broadcasts
  add constraint scheduled_broadcasts_recurrence_check
  check (recurrence in ('none', 'daily', 'weekly', 'monthly'));

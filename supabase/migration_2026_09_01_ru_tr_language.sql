-- Run this in Supabase → SQL Editor. Safe to run more than once.
-- Widens the language check constraints to allow 'ru' and 'tr' now that
-- the app supports Russian and Turkish (lib/i18n.ts).

alter table users drop constraint if exists users_language_check;
alter table users add constraint users_language_check check (language in ('az', 'en', 'ru', 'tr'));

alter table scheduled_broadcasts drop constraint if exists scheduled_broadcasts_audience_language_check;
alter table scheduled_broadcasts add constraint scheduled_broadcasts_audience_language_check
  check (audience_language in ('all', 'az', 'en', 'ru', 'tr'));

-- Run this in Supabase → SQL Editor.
--
-- Multi-tier win-back push notifications — replaces the old single
-- "7+ days inactive, resend every 14 days" message with escalating
-- copy at each tier below. cron-jobs.js's runWinBackPush() sends the
-- highest tier a user has newly crossed, tracked via
-- users.last_winback_tier_sent so each tier fires exactly once per
-- user (never repeats, never skips ahead) instead of the same generic
-- nudge on a fixed schedule. Safe to run more than once.
alter table users add column if not exists last_winback_tier_sent int;

create table if not exists winback_templates (
  id uuid primary key default gen_random_uuid(),
  days_inactive int not null unique,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);
alter table winback_templates enable row level security;

drop policy if exists "Public read" on winback_templates;
create policy "Public read" on winback_templates for select using (true);

drop policy if exists "Public update" on winback_templates;
create policy "Public update" on winback_templates for update using (true) with check (true);

insert into winback_templates (days_inactive, title, body) values
  (7, 'Sizi darıxdıq!', 'Yeni halal məhsulları yoxlamaq üçün Halalzur-a qayıdın 🍏'),
  (30, 'Bir aydır görüşmürük', 'Bu müddətdə bazamıza yüzlərlə yeni məhsul əlavə olundu — gəl bir bax 👀'),
  (90, '3 aydır sizi gözləyirik', 'Halal seçimlərini asanlaşdırmaq üçün buradayıq — Halalzur-a qayıdıb yenidən skan etməyə başlayın 🔍'),
  (180, 'Uzun müddətdir görüşmürük 💚', 'Halalzur hələ də yanınızdadır — geri qayıdın, sizin üçün nə dəyişib görün.')
on conflict (days_inactive) do nothing;

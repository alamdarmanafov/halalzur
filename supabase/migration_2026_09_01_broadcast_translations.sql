-- Run this in Supabase → SQL Editor. Additive only — adds optional
-- EN/RU/TR title+body columns to notification_templates and
-- scheduled_broadcasts so the admin panel's push-broadcast form can
-- carry real per-language text instead of only Azerbaijani. A blank
-- translation falls back to the Azerbaijani title/body (see
-- admin-panel/lib/broadcast.js's contentFor()). Safe to run more than
-- once.

alter table notification_templates add column if not exists title_en text;
alter table notification_templates add column if not exists body_en text;
alter table notification_templates add column if not exists title_ru text;
alter table notification_templates add column if not exists body_ru text;
alter table notification_templates add column if not exists title_tr text;
alter table notification_templates add column if not exists body_tr text;

alter table scheduled_broadcasts add column if not exists title_en text;
alter table scheduled_broadcasts add column if not exists body_en text;
alter table scheduled_broadcasts add column if not exists title_ru text;
alter table scheduled_broadcasts add column if not exists body_ru text;
alter table scheduled_broadcasts add column if not exists title_tr text;
alter table scheduled_broadcasts add column if not exists body_tr text;

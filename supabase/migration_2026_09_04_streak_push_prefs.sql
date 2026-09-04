-- Supports two new cron-fired pushes (admin-panel/api/cron-jobs.js) and
-- the new per-notification-type opt-out toggles (app Profile screen).

-- De-dup marker for the weekly "new products in your favorite category"
-- push — same cadence/resend pattern as users.last_recommend_sent_at.
alter table users add column if not exists last_category_digest_sent_at timestamptz;

-- 'YYYY-MM' of the last month a "Halal Detektiv" (most unknown-product
-- submissions that month) award was given — checked against the current
-- month so a re-run of the monthly cron job never double-awards.
alter table users add column if not exists last_detective_award_month text;

-- Per-notification-type opt-out — a text[] of type keys the user has
-- turned OFF (e.g. 'winback', 'recommend', 'category_digest', 'weekly_digest').
-- Empty/absent means "everything on" (today's default, unchanged for
-- existing users). Checked by each cron job before sending.
alter table users add column if not exists muted_notification_types text[] not null default '{}';

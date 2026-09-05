-- Missed in migration_2026_09_05_feedback_reports_lockdown.sql: DELETE
-- had the same "Public" (using (true)) exposure as UPDATE did, with the
-- same lack of any ownership check (select is already public too).
-- Anyone with the anon key could delete ANY feedback report, including
-- someone else's right after they submit something the attacker doesn't
-- want an admin to see. Only admin-panel's deleteFeedback() legitimately
-- needs this.
drop policy if exists "Public delete" on feedback_reports;
create policy "Admin delete" on feedback_reports for delete using (is_admin());

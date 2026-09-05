-- feedback_reports had "Public update" (using (true)) with no ownership
-- check at all — not even a user_id match, since select is already
-- fully public too. Anyone with the anon key could update ANY report,
-- including someone else's: overwrite admin_reply with fake "official"
-- text that then displays on the real reporter's own "Mesajlarım"
-- screen as if support had actually written it (a real phishing vector
-- against a channel users are primed to trust), flip status to hide a
-- real bug report from the admin queue, or edit another user's message
-- after the fact.
--
-- The only two legitimate non-admin writes are both narrow: lib/
-- feedback.ts's createGithubIssue() sets github_issue_number/
-- github_issue_url on the row it just inserted (fire-and-forget, right
-- after getting a real response back from GitHub's API), and
-- lib/feedback.ts's uploadScreenshot() already happens before the
-- insert, not as a later update. set_feedback_github_issue() below
-- covers the first case, gated by a feedback_reports.id the caller
-- already has to know (a random UUID) and first-set-wins (won't
-- overwrite an already-linked issue) rather than a full open update.
drop policy if exists "Public update" on feedback_reports;
create policy "Admin update" on feedback_reports
  for update using (is_admin()) with check (is_admin());

create or replace function set_feedback_github_issue(p_feedback_id uuid, p_issue_number int, p_issue_url text)
returns void
language sql
security definer
set search_path = public
as $$
  update feedback_reports
  set github_issue_number = p_issue_number, github_issue_url = p_issue_url
  where id = p_feedback_id and github_issue_number is null;
$$;

grant execute on function set_feedback_github_issue(uuid, int, text) to anon, authenticated;

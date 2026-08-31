// Vercel serverless function — mirrors a Halalzur feedback report as a
// GitHub Issue, so bug reports/suggestions submitted from the app show up
// as trackable issues instead of only living in the admin panel's
// Xəta/Rəy list. Two actions:
//   action: 'create' — called from the app (lib/feedback.ts) right after
//     a feedback_reports row is inserted. Gated by NOTIFY_SECRET, same as
//     send-notification.js/delete-account.js (the app ships that secret
//     in its own env, EXPO_PUBLIC_NOTIFY_SECRET).
//   action: 'close'  — called from the admin panel when a report is
//     deleted (i.e. marked resolved). The admin panel is a static page
//     with no server-verified session (same accepted-risk model as every
//     other admin action here — see delete-account.js's own header
//     comment) so this is only gated by the Supabase anon key, which is
//     already public in admin-panel/index.html; that's not real auth, just
//     a basic "this came from our own app" check.
//
// Required Vercel environment variables:
//   NOTIFY_SECRET        (shared with send-notification.js / delete-account.js)
//   SUPABASE_ANON_KEY    (same public value embedded in admin-panel/index.html)
//   GITHUB_TOKEN         a GitHub personal access token with Issues write access
//   GITHUB_REPO          "owner/repo", e.g. "alamdarmanafov/halalzur"

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo) {
    console.error('github-issue: github_not_configured', { hasToken: !!token, hasRepo: !!repo });
    res.status(500).json({ error: 'github_not_configured' });
    return;
  }

  const { action } = req.body || {};
  const ghHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  };

  try {
    if (action === 'create') {
      if (!process.env.NOTIFY_SECRET || req.headers['x-notify-secret'] !== process.env.NOTIFY_SECRET) {
        res.status(401).json({ error: 'unauthorized' });
        return;
      }

      const { message, userName, screenshotUrl } = req.body || {};
      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'missing_message' });
        return;
      }

      const title = message.length > 80 ? message.slice(0, 77) + '...' : message;
      const bodyLines = [
        message,
        '',
        `**Göndərən:** ${userName || 'Naməlum istifadəçi'}`,
        screenshotUrl ? `\n![screenshot](${screenshotUrl})` : null,
        '',
        '_Halalzur app-dan avtomatik yaradılıb (Xəta bildir / Rəy)._',
      ].filter((line) => line !== null);

      const ghRes = await fetch(`https://api.github.com/repos/${repo}/issues`, {
        method: 'POST',
        headers: ghHeaders,
        body: JSON.stringify({ title, body: bodyLines.join('\n'), labels: ['user-feedback'] }),
      });
      if (!ghRes.ok) {
        console.error('github-issue: create failed', ghRes.status, await ghRes.text());
        res.status(502).json({ error: 'github_create_failed' });
        return;
      }
      const issue = await ghRes.json();
      res.status(200).json({ number: issue.number, url: issue.html_url });
      return;
    }

    if (action === 'close') {
      if (!process.env.SUPABASE_ANON_KEY || req.headers['x-app-key'] !== process.env.SUPABASE_ANON_KEY) {
        res.status(401).json({ error: 'unauthorized' });
        return;
      }

      const { issueNumber } = req.body || {};
      if (!issueNumber) {
        res.status(400).json({ error: 'missing_issue_number' });
        return;
      }
      const ghRes = await fetch(`https://api.github.com/repos/${repo}/issues/${issueNumber}`, {
        method: 'PATCH',
        headers: ghHeaders,
        body: JSON.stringify({ state: 'closed', state_reason: 'completed' }),
      });
      if (!ghRes.ok) {
        console.error('github-issue: close failed', ghRes.status, await ghRes.text());
        res.status(502).json({ error: 'github_close_failed' });
        return;
      }
      res.status(200).json({ closed: true });
      return;
    }

    res.status(400).json({ error: 'unknown_action' });
  } catch (err) {
    console.error('github-issue: unexpected error', err);
    res.status(500).json({ error: err.message });
  }
}

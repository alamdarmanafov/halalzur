// Vercel serverless function — handles two kinds of scheduled item:
//   1. scheduled_broadcasts rows that are due (status='pending',
//      send_at <= now()) — sends the push.
//   2. announcements rows whose publish_at is due (active=false,
//      publish_at set and <= now()) — activates the in-app popup, the
//      same one-active-at-a-time rule the admin panel's manual publish
//      already enforces.
// Nothing inside this repo calls this on its own;
// .github/workflows/send-scheduled-broadcasts.yml fires it every ~10
// minutes via a scheduled GitHub Actions run. Both kinds of scheduled
// item are created directly from the admin panel (a plain insert via the
// anon key — no Vercel function needed for that half), so this is the
// only piece that ever actually acts on either one.
//
// Auth: gated by NOTIFY_SECRET (same secret send-notification.js and
// github-issue.js's create action already use) — the GitHub Actions
// workflow needs this value as a repo secret (Settings → Secrets and
// variables → Actions → New repository secret), same value as this
// Vercel project's NOTIFY_SECRET env var.
//
// Required Vercel environment variables (all already needed elsewhere —
// no new setup if send-notification.js/send-broadcast.js are configured):
//   NOTIFY_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
import { createClient } from '@supabase/supabase-js';
import { sendBroadcast } from '../lib/broadcast.js';
import { getFirebaseApp } from '../lib/firebaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  if (!process.env.NOTIFY_SECRET || req.headers['x-notify-secret'] !== process.env.NOTIFY_SECRET) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  if (
    !process.env.SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !process.env.FIREBASE_PRIVATE_KEY
  ) {
    console.error('process-scheduled-broadcasts: not_configured');
    res.status(500).json({ error: 'not_configured' });
    return;
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const nowIso = new Date().toISOString();

  let announcementsActivated = 0;
  try {
    const { data: dueAnnouncements, error: annError } = await supabase
      .from('announcements')
      .select('id')
      .eq('active', false)
      .not('publish_at', 'is', null)
      .lte('publish_at', nowIso);
    if (annError) throw annError;

    for (const ann of dueAnnouncements || []) {
      // Same one-active-at-a-time rule the admin panel's manual publish
      // already enforces.
      await supabase.from('announcements').update({ active: false }).eq('active', true);
      await supabase.from('announcements').update({ active: true, publish_at: null }).eq('id', ann.id);
      announcementsActivated++;
    }
  } catch (err) {
    console.error('process-scheduled-broadcasts: announcement activation failed', err);
  }

  try {
    const { data: due, error } = await supabase
      .from('scheduled_broadcasts')
      .select('*')
      .eq('status', 'pending')
      .lte('send_at', nowIso);
    if (error) throw error;

    if (!due || !due.length) {
      res.status(200).json({ processed: 0, announcementsActivated });
      return;
    }

    const app = getFirebaseApp();
    const results = [];
    for (const row of due) {
      try {
        const result = await sendBroadcast({
          firebaseApp: app,
          supabaseUrl: process.env.SUPABASE_URL,
          serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          title: row.title,
          body: row.body,
          audiencePlan: row.audience_plan,
          audienceLanguage: row.audience_language,
        });
        await supabase
          .from('scheduled_broadcasts')
          .update({ status: 'sent', sent_count: result.sent, sent_at: new Date().toISOString() })
          .eq('id', row.id);
        results.push({ id: row.id, status: 'sent' });
      } catch (err) {
        console.error('process-scheduled-broadcasts: send failed for', row.id, err);
        await supabase
          .from('scheduled_broadcasts')
          .update({ status: 'failed', error: err.message, sent_at: new Date().toISOString() })
          .eq('id', row.id);
        results.push({ id: row.id, status: 'failed', error: err.message });
      }
    }

    res.status(200).json({ processed: results.length, results, announcementsActivated });
  } catch (err) {
    console.error('process-scheduled-broadcasts: unexpected error', err);
    res.status(500).json({ error: err.message });
  }
}

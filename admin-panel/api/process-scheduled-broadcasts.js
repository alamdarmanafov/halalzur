// Vercel serverless function — sends every scheduled_broadcasts row that
// is due (status='pending', send_at <= now()). Nothing inside this repo
// calls this on its own; .github/workflows/send-scheduled-broadcasts.yml
// fires it every ~10 minutes via a scheduled GitHub Actions run. Scheduled
// pushes are created directly from the admin panel (a plain insert into
// scheduled_broadcasts via the anon key — no Vercel function needed for
// that half), so this is the only piece that ever actually sends one.
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
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { createClient } from '@supabase/supabase-js';
import { sendBroadcast } from '../lib/broadcast.js';

function firebaseApp() {
  if (getApps().length) return getApps()[0];
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}

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

  try {
    const { data: due, error } = await supabase
      .from('scheduled_broadcasts')
      .select('*')
      .eq('status', 'pending')
      .lte('send_at', new Date().toISOString());
    if (error) throw error;

    if (!due || !due.length) {
      res.status(200).json({ processed: 0 });
      return;
    }

    const app = firebaseApp();
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

    res.status(200).json({ processed: results.length, results });
  } catch (err) {
    console.error('process-scheduled-broadcasts: unexpected error', err);
    res.status(500).json({ error: err.message });
  }
}

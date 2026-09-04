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
// Auth: gated by CRON_SECRET — deliberately NOT the same NOTIFY_SECRET
// send-notification.js/github-issue.js use. This route is only ever
// called by the scheduled GitHub Actions workflow, never by the app, and
// every call sends a real push to real users — sharing a secret with
// EXPO_PUBLIC_NOTIFY_SECRET (shipped inside every app install) would let
// anyone who extracted it fire broadcasts on demand. The GitHub Actions
// workflow needs CRON_SECRET as its own repo secret (Settings → Secrets
// and variables → Actions → New repository secret), matching this
// Vercel project's CRON_SECRET env var — a fresh random value, not
// reused from NOTIFY_SECRET.
//
// Required Vercel environment variables:
//   CRON_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
import { createClient } from '@supabase/supabase-js';
import { sendBroadcast } from '../lib/broadcast.js';
import { getFirebaseApp } from '../lib/firebaseAdmin.js';

function translationsFromRow(row) {
  const translations = {};
  for (const lang of ['en', 'ru', 'tr']) {
    const title = row['title_' + lang];
    const body = row['body_' + lang];
    if (title && body) translations[lang] = { title, body };
  }
  return translations;
}

// Advances a recurring broadcast's own send_at rather than the current
// wall-clock time, so a run that's a few minutes late (this cron fires
// every ~10 minutes) doesn't drift the schedule forward. If the cron was
// down for a while and several occurrences were missed, keeps advancing
// past all of them so it lands on the next one still in the future
// instead of re-sending every missed occurrence in a burst.
function nextSendAt(current, recurrence) {
  let next = new Date(current);
  do {
    if (recurrence === 'daily') next.setUTCDate(next.getUTCDate() + 1);
    else if (recurrence === 'weekly') next.setUTCDate(next.getUTCDate() + 7);
    else if (recurrence === 'monthly') next.setUTCMonth(next.getUTCMonth() + 1);
    else break;
  } while (next.getTime() <= Date.now());
  return next;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  if (!process.env.CRON_SECRET || req.headers['x-cron-secret'] !== process.env.CRON_SECRET) {
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
      const isRecurring = row.recurrence && row.recurrence !== 'none';
      try {
        const result = await sendBroadcast({
          firebaseApp: app,
          supabaseUrl: process.env.SUPABASE_URL,
          serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          title: row.title,
          body: row.body,
          audiencePlan: row.audience_plan,
          audienceLanguage: row.audience_language,
          translations: translationsFromRow(row),
        });
        if (isRecurring) {
          // Stays 'pending' with its send_at pushed to the next
          // occurrence, rather than becoming terminal — the admin panel
          // only offers a cancel button while status is 'pending'.
          await supabase
            .from('scheduled_broadcasts')
            .update({
              send_at: nextSendAt(row.send_at, row.recurrence).toISOString(),
              sent_count: result.sent,
              sent_at: new Date().toISOString(),
              error: null,
            })
            .eq('id', row.id);
          results.push({ id: row.id, status: 'sent_recurring' });
        } else {
          await supabase
            .from('scheduled_broadcasts')
            .update({ status: 'sent', sent_count: result.sent, sent_at: new Date().toISOString() })
            .eq('id', row.id);
          results.push({ id: row.id, status: 'sent' });
        }
      } catch (err) {
        console.error('process-scheduled-broadcasts: send failed for', row.id, err);
        if (isRecurring) {
          // Don't get stuck retrying the same failure every ~10 minutes
          // forever — log the error but still advance to the next
          // occurrence.
          await supabase
            .from('scheduled_broadcasts')
            .update({
              send_at: nextSendAt(row.send_at, row.recurrence).toISOString(),
              error: err.message,
              sent_at: new Date().toISOString(),
            })
            .eq('id', row.id);
        } else {
          await supabase
            .from('scheduled_broadcasts')
            .update({ status: 'failed', error: err.message, sent_at: new Date().toISOString() })
            .eq('id', row.id);
        }
        results.push({ id: row.id, status: 'failed', error: err.message });
      }
    }

    res.status(200).json({ processed: results.length, results, announcementsActivated });
  } catch (err) {
    console.error('process-scheduled-broadcasts: unexpected error', err);
    res.status(500).json({ error: err.message });
  }
}

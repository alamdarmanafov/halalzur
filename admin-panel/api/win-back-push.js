// Vercel serverless function — nudges users who haven't opened the app
// in 7+ days, at most once every 14 days per user (users.last_winback_sent_at
// tracks that). Fired daily by .github/workflows/win-back-push.yml —
// nothing in the app calls this.
//
// Auth + required env vars: same NOTIFY_SECRET/Supabase/Firebase set
// process-scheduled-broadcasts.js already needs — no new setup.
import { getMessaging } from 'firebase-admin/messaging';
import { createClient } from '@supabase/supabase-js';
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
    res.status(500).json({ error: 'not_configured' });
    return;
  }

  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const inactiveSince = new Date(Date.now() - 7 * 86400000).toISOString();
    const resendAfter = new Date(Date.now() - 14 * 86400000).toISOString();

    const { data: candidates, error } = await supabase
      .from('users')
      .select('id, last_winback_sent_at')
      .not('last_seen_at', 'is', null)
      .lt('last_seen_at', inactiveSince)
      .or(`last_winback_sent_at.is.null,last_winback_sent_at.lt.${resendAfter}`)
      .limit(200);
    if (error) throw error;
    if (!candidates || !candidates.length) {
      res.status(200).json({ notified: 0 });
      return;
    }

    const messaging = getMessaging(getFirebaseApp());
    const title = 'Sizi darıxdıq!';
    const body = 'Yeni halal məhsulları yoxlamaq üçün Halalzur-a qayıdın 🍏';
    let notified = 0;

    for (const user of candidates) {
      const { data: tokens } = await supabase.from('device_tokens').select('fcm_token').eq('user_id', user.id);
      if (!tokens || !tokens.length) continue;
      let sentAny = false;
      for (const { fcm_token } of tokens) {
        try {
          await messaging.send({ token: fcm_token, notification: { title, body } });
          sentAny = true;
        } catch (err) {
          console.error('win-back-push: FCM send failed', err.code, err.message);
        }
      }
      if (sentAny) {
        await supabase.from('users').update({ last_winback_sent_at: new Date().toISOString() }).eq('id', user.id);
        notified++;
      }
    }

    res.status(200).json({ notified });
  } catch (err) {
    console.error('win-back-push: unexpected error', err);
    res.status(500).json({ error: err.message });
  }
}

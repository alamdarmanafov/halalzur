// Vercel serverless function — sends a real push notification (via
// Firebase Cloud Messaging) to one user's registered device(s), for
// event-triggered notifications (registration, achievements, product/
// place submissions, premium purchase) the app fires from lib/pushNotify.ts.
//
// This is the "future send-notification backend" supabase/schema.sql's
// device_tokens table comment anticipated: that table has no SELECT
// policy for the anon key (deliberately — a client can register its own
// token but never list anyone else's), so reading tokens back requires
// the service_role key, which only ever runs here, server-side.
//
// Required Vercel environment variables (Settings → Environment Variables):
//   NOTIFY_SECRET               — shared secret; must match the app's
//                                  EXPO_PUBLIC_NOTIFY_SECRET
//   SUPABASE_URL                 — same value as EXPO_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY    — Supabase → Project Settings → API →
//                                  service_role (secret) key — NOT the
//                                  anon key already used elsewhere
//   FIREBASE_PROJECT_ID           |  From Firebase Console → Project
//   FIREBASE_CLIENT_EMAIL         |  Settings → Service Accounts →
//   FIREBASE_PRIVATE_KEY          |  "Generate new private key" (downloads
//                                     a JSON file with these 3 fields)
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { createClient } from '@supabase/supabase-js';

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
    console.error('send-notification: unauthorized — NOTIFY_SECRET missing or mismatched');
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const { userId, title, body } = req.body || {};
  if (!userId || !title || !body) {
    console.error('send-notification: missing_fields', { userId: !!userId, title: !!title, body: !!body });
    res.status(400).json({ error: 'missing_fields' });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('send-notification: supabase_not_configured', {
      hasUrl: !!supabaseUrl,
      hasServiceRoleKey: !!serviceRoleKey,
    });
    res.status(500).json({ error: 'supabase_not_configured' });
    return;
  }
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    console.error('send-notification: firebase_not_configured', {
      hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    });
    res.status(500).json({ error: 'firebase_not_configured' });
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: tokens, error } = await supabase
      .from('device_tokens')
      .select('fcm_token')
      .eq('user_id', userId);

    if (error) throw error;
    if (!tokens || tokens.length === 0) {
      console.error('send-notification: no_registered_device', { userId });
      res.status(200).json({ sent: 0, reason: 'no_registered_device' });
      return;
    }

    const messaging = getMessaging(firebaseApp());
    let sent = 0;
    for (const { fcm_token } of tokens) {
      try {
        await messaging.send({ token: fcm_token, notification: { title, body } });
        sent++;
      } catch (err) {
        console.error('send-notification: FCM send failed', err.code, err.message);
      }
    }

    console.log('send-notification: done', { userId, tokens: tokens.length, sent });
    res.status(200).json({ sent });
  } catch (err) {
    console.error('send-notification: unexpected error', err);
    res.status(500).json({ error: err.message });
  }
}

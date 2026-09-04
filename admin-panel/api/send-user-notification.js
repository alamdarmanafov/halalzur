// Vercel serverless function — sends a push notification to one specific
// user's registered device(s), triggered manually from the admin panel's
// Users tab (e.g. following up on a support conversation, or nudging one
// person specifically rather than broadcasting to everyone).
//
// Auth: verifies the caller's Supabase Auth token belongs to a real admin
// (admin-panel/lib/verifyAdmin.js). This intentionally does NOT reuse
// send-notification.js's NOTIFY_SECRET gate: that secret is meant to stay
// app-only (lib/pushNotify.ts), not embedded in the admin panel's client
// JS.
//
// Required Vercel environment variables (same ones send-broadcast.js
// already needs — no new setup if that's already configured):
//   SUPABASE_URL                  — same value as EXPO_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY     — Supabase → Project Settings → API → service_role key
//   FIREBASE_PROJECT_ID           |  From Firebase Console → Project
//   FIREBASE_CLIENT_EMAIL         |  Settings → Service Accounts →
//   FIREBASE_PRIVATE_KEY          |  "Generate new private key"
import { getMessaging } from 'firebase-admin/messaging';
import { createClient } from '@supabase/supabase-js';
import { getFirebaseApp, NOTIFICATION_SOUND } from '../lib/firebaseAdmin.js';
import { verifyAdmin } from '../lib/verifyAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const admin = await verifyAdmin(req);
  if (!admin) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const { userId, title, body } = req.body || {};
  if (!userId || !title || !body) {
    res.status(400).json({ error: 'missing_fields' });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    res.status(500).json({ error: 'supabase_not_configured' });
    return;
  }
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    res.status(500).json({ error: 'firebase_not_configured' });
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: tokens, error } = await supabase.from('device_tokens').select('fcm_token').eq('user_id', userId);
    if (error) throw error;
    if (!tokens || tokens.length === 0) {
      res.status(200).json({ sent: 0, reason: 'no_registered_device' });
      return;
    }

    const messaging = getMessaging(getFirebaseApp());
    let sent = 0;
    for (const { fcm_token } of tokens) {
      try {
        await messaging.send({ token: fcm_token, notification: { title, body }, ...NOTIFICATION_SOUND });
        sent++;
      } catch (err) {
        console.error('send-user-notification: FCM send failed', err.code, err.message);
      }
    }

    res.status(200).json({ sent });
  } catch (err) {
    console.error('send-user-notification: unexpected error', err);
    res.status(500).json({ error: err.message });
  }
}

// Vercel serverless function — sends a push notification to EVERY device
// at once via Firebase Cloud Messaging's topic messaging, instead of the
// per-user targeting send-notification.js does. Every device already
// auto-subscribes to the "halalzur_all" topic on first launch (see
// lib/notifications.ts BROADCAST_TOPIC) — until now the only way to use
// that was the Firebase console itself; this lets the admin panel do it
// directly.
//
// Auth: same low-security "x-app-key must match the public Supabase anon
// key" pattern already used by github-issue.js's close action — the admin
// panel has no server-verified session (see that file's header comment
// for the accepted-risk rationale), this just keeps it from being a
// wide-open unauthenticated endpoint.
//
// Required Vercel environment variables (same ones send-notification.js
// already needs — no new setup if that's already configured):
//   SUPABASE_ANON_KEY             — same public value embedded in admin-panel/index.html
//   FIREBASE_PROJECT_ID           |  From Firebase Console → Project
//   FIREBASE_CLIENT_EMAIL         |  Settings → Service Accounts →
//   FIREBASE_PRIVATE_KEY          |  "Generate new private key"
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

const BROADCAST_TOPIC = 'halalzur_all';

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

  if (!process.env.SUPABASE_ANON_KEY || req.headers['x-app-key'] !== process.env.SUPABASE_ANON_KEY) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const { title, body } = req.body || {};
  if (!title || !body) {
    res.status(400).json({ error: 'missing_fields' });
    return;
  }

  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    console.error('send-broadcast: firebase_not_configured');
    res.status(500).json({ error: 'firebase_not_configured' });
    return;
  }

  try {
    const messaging = getMessaging(firebaseApp());
    await messaging.send({ topic: BROADCAST_TOPIC, notification: { title, body } });
    res.status(200).json({ sent: true });
  } catch (err) {
    console.error('send-broadcast: unexpected error', err);
    res.status(500).json({ error: err.message });
  }
}

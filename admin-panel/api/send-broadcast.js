// Vercel serverless function — sends an immediate push notification,
// optionally scoped to a plan/language audience (admin-panel/lib/
// broadcast.js). For a future send, the admin panel inserts directly into
// scheduled_broadcasts instead of calling this endpoint — see
// process-scheduled-broadcasts.js.
//
// Auth: verifies the caller's Supabase Auth token belongs to a real admin
// (admin-panel/lib/verifyAdmin.js) — see that file for why this replaced
// the old "x-app-key must match the public Supabase anon key" pattern.
//
// Required Vercel environment variables (same ones send-notification.js
// already needs — no new setup if that's already configured):
//   SUPABASE_URL                  — same value as EXPO_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY     — Supabase → Project Settings → API → service_role key
//   FIREBASE_PROJECT_ID           |  From Firebase Console → Project
//   FIREBASE_CLIENT_EMAIL         |  Settings → Service Accounts →
//   FIREBASE_PRIVATE_KEY          |  "Generate new private key"
import { sendBroadcast } from '../lib/broadcast.js';
import { getFirebaseApp } from '../lib/firebaseAdmin.js';
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

  const { title, body, audiencePlan, audienceLanguage, translations } = req.body || {};
  if (!title || !body) {
    res.status(400).json({ error: 'missing_fields' });
    return;
  }

  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    console.error('send-broadcast: firebase_not_configured');
    res.status(500).json({ error: 'firebase_not_configured' });
    return;
  }
  var needsSupabaseAdmin = (audiencePlan && audiencePlan !== 'all') || (audienceLanguage && audienceLanguage !== 'all');
  if (needsSupabaseAdmin && (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    console.error('send-broadcast: supabase_not_configured (needed for audience targeting)');
    res.status(500).json({ error: 'supabase_not_configured' });
    return;
  }

  try {
    const result = await sendBroadcast({
      firebaseApp: getFirebaseApp(),
      supabaseUrl: process.env.SUPABASE_URL,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      title,
      body,
      audiencePlan,
      audienceLanguage,
      translations,
    });
    res.status(200).json(result);
  } catch (err) {
    console.error('send-broadcast: unexpected error', err);
    res.status(500).json({ error: err.message });
  }
}

// Vercel serverless function — sends an immediate push notification,
// optionally scoped to a plan/language audience (admin-panel/lib/
// broadcast.js). For a future send, the admin panel inserts directly into
// scheduled_broadcasts instead of calling this endpoint — see
// process-scheduled-broadcasts.js.
//
// Auth: same low-security "x-app-key must match the public Supabase anon
// key" pattern already used by github-issue.js's close action — the admin
// panel has no server-verified session (see that file's header comment
// for the accepted-risk rationale). "unauthorized" almost always means
// SUPABASE_ANON_KEY isn't set on this Vercel project (or doesn't match
// admin-panel/index.html's SUPABASE_ANON_KEY constant exactly) — check
// Vercel → Settings → Environment Variables.
//
// Required Vercel environment variables (same ones send-notification.js
// already needs — no new setup if that's already configured):
//   SUPABASE_ANON_KEY             — same public value embedded in admin-panel/index.html
//   SUPABASE_URL                  — same value as EXPO_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY     — Supabase → Project Settings → API → service_role key
//   FIREBASE_PROJECT_ID           |  From Firebase Console → Project
//   FIREBASE_CLIENT_EMAIL         |  Settings → Service Accounts →
//   FIREBASE_PRIVATE_KEY          |  "Generate new private key"
import { initializeApp, cert, getApps } from 'firebase-admin/app';
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

  if (!process.env.SUPABASE_ANON_KEY) {
    console.error('send-broadcast: SUPABASE_ANON_KEY is not set on this Vercel project');
    res.status(401).json({ error: 'unauthorized', reason: 'SUPABASE_ANON_KEY not configured on server' });
    return;
  }
  if (req.headers['x-app-key'] !== process.env.SUPABASE_ANON_KEY) {
    console.error('send-broadcast: x-app-key did not match SUPABASE_ANON_KEY');
    res.status(401).json({ error: 'unauthorized', reason: 'x-app-key mismatch' });
    return;
  }

  const { title, body, audiencePlan, audienceLanguage } = req.body || {};
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
      firebaseApp: firebaseApp(),
      supabaseUrl: process.env.SUPABASE_URL,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      title,
      body,
      audiencePlan,
      audienceLanguage,
    });
    res.status(200).json(result);
  } catch (err) {
    console.error('send-broadcast: unexpected error', err);
    res.status(500).json({ error: err.message });
  }
}

// Vercel serverless function — records a user's approximate registration
// country using Vercel's own edge geolocation header, no third-party IP
// lookup service needed. Called once (fire-and-forget, best-effort) from
// lib/userSync.ts alongside ensureReferralCode()/touchLastSeen().
//
// Vercel's edge network sets `x-vercel-ip-country` to a two-letter ISO
// country code on every request it routes — this only works for traffic
// that actually passes through Vercel's edge (i.e. never in local `vercel
// dev`, and never if this project is deployed somewhere other than
// Vercel). If the header is missing, this just leaves users.country null
// rather than guessing.
//
// Required Vercel environment variables (same ones send-notification.js
// already needs — no new setup if that's already configured):
//   NOTIFY_SECRET               — shared secret; must match the app's
//                                  EXPO_PUBLIC_NOTIFY_SECRET
//   SUPABASE_URL                 — same value as EXPO_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY    — Supabase → Project Settings → API →
//                                  service_role (secret) key
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  if (!process.env.NOTIFY_SECRET || req.headers['x-notify-secret'] !== process.env.NOTIFY_SECRET) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const { userId } = req.body || {};
  if (!userId) {
    res.status(400).json({ error: 'missing_fields' });
    return;
  }

  const country = req.headers['x-vercel-ip-country'];
  if (!country) {
    // Not an error — just no geolocation available for this request
    // (local dev, a non-Vercel proxy in front, etc).
    res.status(200).json({ set: false, reason: 'no_geo_header' });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    res.status(500).json({ error: 'supabase_not_configured' });
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { error } = await supabase.from('users').update({ country }).eq('id', userId);
    if (error) throw error;
    res.status(200).json({ set: true, country });
  } catch (err) {
    console.error('register-country: unexpected error', err);
    res.status(500).json({ error: err.message });
  }
}

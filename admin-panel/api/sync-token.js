// Vercel serverless function — lets a device that lost its local
// favorites/history sync_token (reinstall, new device; see
// supabase/migration_2026_09_05_sync_token.sql) prove it's the
// legitimate account owner and get a fresh token issued, instead of
// permanently losing cloud-backed favorites/history on that device.
//
// Same request/confirm push-code shape as delete-account.js's
// apple-/google- path: `action: 'request'` pushes a one-time code to the
// account's own already-registered device(s) (device_tokens has no anon
// SELECT policy, so an outside caller who only knows the target userId
// can't read or guess it), and `action: 'confirm'` must echo that code
// back — along with a token this device generated locally — before the
// server sets users.sync_token to it. Unlike deletion this isn't
// destructive, but NOTIFY_SECRET alone still only proves "this came from
// our app", not "this caller owns this account" — without the code
// check, anyone knowing a userId could overwrite that account's
// sync_token and hijack its favorites/history sync. The rate limits
// below just bound how often either step can be spammed.
//
// Required Vercel environment variables (already configured for
// delete-account.js):
//   NOTIFY_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//   FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY
import { createClient } from '@supabase/supabase-js';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirebaseApp, NOTIFICATION_SOUND } from '../lib/firebaseAdmin.js';
import { checkRateLimit, clientIp } from '../lib/rateLimit.js';

const CODE_TTL_MINUTES = 10;

function randomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('sync-token: supabase_not_configured');
    res.status(500).json({ error: 'supabase_not_configured' });
    return;
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const hasNotifySecret = !!process.env.NOTIFY_SECRET && req.headers['x-notify-secret'] === process.env.NOTIFY_SECRET;
  if (!hasNotifySecret) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const { userId, action, code, newToken } = req.body || {};
  if (!userId || typeof userId !== 'string') {
    res.status(400).json({ error: 'missing_user_id' });
    return;
  }

  try {
    if (action === 'confirm') {
      if (!code || !newToken) {
        res.status(400).json({ error: 'missing_fields' });
        return;
      }
      const allowed = await checkRateLimit(supabase, {
        bucket: 'sync-token-confirm',
        identifier: clientIp(req),
        limit: 20,
        windowSeconds: 3600,
      });
      if (!allowed) {
        res.status(429).json({ error: 'rate_limited' });
        return;
      }

      const { data: row } = await supabase
        .from('sync_token_recovery_codes')
        .select('code, expires_at')
        .eq('user_id', userId)
        .maybeSingle();
      if (!row || String(row.code) !== String(code).trim() || new Date(row.expires_at) < new Date()) {
        res.status(401).json({ error: 'invalid_or_expired_code' });
        return;
      }

      const { error: updateError } = await supabase.from('users').update({ sync_token: newToken }).eq('id', userId);
      if (updateError) throw updateError;
      await supabase.from('sync_token_recovery_codes').delete().eq('user_id', userId);

      console.log('sync-token: recovered', { userId });
      res.status(200).json({ token: newToken });
      return;
    }

    // Default action is 'request': push a one-time code to this
    // account's own registered device(s) and stop — the client must
    // call again with action: 'confirm', that code, and a freshly
    // generated token.
    const allowed = await checkRateLimit(supabase, {
      bucket: 'sync-token-request',
      identifier: userId,
      limit: 5,
      windowSeconds: 3600,
    });
    if (!allowed) {
      res.status(429).json({ error: 'rate_limited' });
      return;
    }

    const { data: tokens, error: tokensError } = await supabase
      .from('device_tokens')
      .select('fcm_token')
      .eq('user_id', userId);
    if (tokensError) throw tokensError;
    if (!tokens || !tokens.length) {
      res.status(409).json({ error: 'no_registered_device' });
      return;
    }

    const genCode = randomCode();
    const { error: upsertError } = await supabase.from('sync_token_recovery_codes').upsert({
      user_id: userId,
      code: genCode,
      expires_at: new Date(Date.now() + CODE_TTL_MINUTES * 60000).toISOString(),
    });
    if (upsertError) throw upsertError;

    const messaging = getMessaging(getFirebaseApp());
    let pushed = 0;
    for (const { fcm_token } of tokens) {
      try {
        await messaging.send({
          token: fcm_token,
          notification: {
            title: 'Məlumatların bərpası',
            body: `Təsdiq kodunuz: ${genCode} (${CODE_TTL_MINUTES} dəqiqə etibarlıdır)`,
          },
          ...NOTIFICATION_SOUND,
        });
        pushed++;
      } catch (err) {
        console.error('sync-token: FCM send failed', err.code, err.message);
      }
    }
    if (!pushed) {
      await supabase.from('sync_token_recovery_codes').delete().eq('user_id', userId);
      res.status(409).json({ error: 'no_registered_device' });
      return;
    }

    console.log('sync-token: code requested', { userId, pushed });
    res.status(200).json({ requested: true, expiresInMinutes: CODE_TTL_MINUTES });
  } catch (err) {
    console.error('sync-token: unexpected error', err);
    res.status(500).json({ error: err.message });
  }
}

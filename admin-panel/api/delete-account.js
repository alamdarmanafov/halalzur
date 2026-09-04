// Vercel serverless function — permanently deletes a user's account and
// the personal data tied to it (device tokens, favorites, points,
// feedback, referrals, the users directory row) via the service_role
// key, which bypasses RLS so this works regardless of which tables have
// a "Public delete" policy. For real email/password accounts (id
// prefixed 'email-') it also deletes the underlying Supabase Auth
// user — something only the service_role key can do; the anon key the
// app ships with never can.
//
// Community-contributed content the user already got approved (a
// certified product, an approved place) is left in place, same as most
// apps: the account and its private data go, shared content already
// merged into the public database stays. Only still-pending submissions
// (never became public) are cleaned up as personal data.
//
// Required Vercel environment variables (already configured for
// send-notification.js):
//   NOTIFY_SECRET
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY
//     (only needed for the apple-/google- push-code path below)
//
// Auth: three independent callers —
//   1. The admin panel, deleting an account on someone's behalf (e.g. a
//      support/GDPR request) — verified via verifyAdmin.js, same as
//      every other admin-panel-only endpoint. Deletes immediately.
//   2. The app itself, self-service, for an 'email-' account — gated by
//      NOTIFY_SECRET *and* a Supabase Auth bearer token whose subject
//      matches the account being deleted. Deletes immediately once that
//      token checks out.
//   3. The app itself, self-service, for an 'apple-'/'google-' account —
//      gated by NOTIFY_SECRET, but those accounts never get a Supabase
//      Auth session to verify (Apple/Google sign-in here is native-SDK
//      only, see lib/auth-context.tsx), so there's nothing else to check
//      a bearer token against. NOTIFY_SECRET alone only proves "this
//      request came from our app", not "this caller owns this specific
//      account" — it's a single static value shipped in every install,
//      not a per-user credential, and the `users` table's public read
//      policy means any userId in it is trivially enumerable. Left
//      unchecked, that combination let anyone holding the secret delete
//      any account by id. Instead this path requires proving control of
//      the account's own already-registered device: `action: 'request'`
//      pushes a one-time code to it (device_tokens has no anon SELECT
//      policy, so an outside caller can't read or guess it), and
//      `action: 'confirm'` must echo that code back before anything is
//      deleted. See supabase/migration_2026_09_04_security_hardening.sql
//      for the account_deletion_codes table this uses.
import { createClient } from '@supabase/supabase-js';
import { getMessaging } from 'firebase-admin/messaging';
import { verifyAdmin } from '../lib/verifyAdmin.js';
import { getFirebaseApp, NOTIFICATION_SOUND } from '../lib/firebaseAdmin.js';

const CODE_TTL_MINUTES = 10;

function randomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Deletes all personal data + the account itself. Assumes the caller is already authorized. */
async function deleteUserData(supabase, userId) {
  await Promise.all([
    supabase.from('device_tokens').delete().eq('user_id', userId),
    supabase.from('favorites').delete().eq('user_id', userId),
    supabase.from('user_points').delete().eq('user_id', userId),
    supabase.from('feedback_reports').delete().eq('user_id', userId),
    supabase.from('referrals').delete().eq('referrer_id', userId),
    supabase.from('referrals').delete().eq('referred_id', userId),
    supabase.from('product_submissions').delete().eq('submitted_by', userId).eq('review_status', 'pending'),
    supabase.from('account_deletion_codes').delete().eq('user_id', userId),
  ]);

  await supabase.from('users').delete().eq('id', userId);

  if (userId.startsWith('email-')) {
    const authUserId = userId.slice('email-'.length);
    const { error } = await supabase.auth.admin.deleteUser(authUserId);
    if (error) console.error('delete-account: auth.admin.deleteUser failed', error.message);
  }
}

/**
 * For 'email-' accounts only: verifies the request's Authorization
 * bearer token is a real Supabase Auth session belonging to this exact
 * account. Returns true/false; never throws.
 */
async function verifiedByOwnSession(supabase, req, userId) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (!token) return false;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return false;
  return `email-${data.user.id}` === userId;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('delete-account: supabase_not_configured', {
      hasUrl: !!supabaseUrl,
      hasServiceRoleKey: !!serviceRoleKey,
    });
    res.status(500).json({ error: 'supabase_not_configured' });
    return;
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const hasNotifySecret = !!process.env.NOTIFY_SECRET && req.headers['x-notify-secret'] === process.env.NOTIFY_SECRET;
  const admin = hasNotifySecret ? null : await verifyAdmin(req);
  if (!hasNotifySecret && !admin) {
    console.error('delete-account: unauthorized — neither NOTIFY_SECRET nor a verified admin token matched');
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const { userId, action, code } = req.body || {};
  if (!userId || typeof userId !== 'string') {
    res.status(400).json({ error: 'missing_user_id' });
    return;
  }

  try {
    if (admin) {
      // Admin already proved their own identity via verifyAdmin — free to
      // act on any account, same as every other admin-panel endpoint.
      await deleteUserData(supabase, userId);
      console.log('delete-account: done (admin)', { userId, admin: admin.email });
      res.status(200).json({ deleted: true });
      return;
    }

    if (userId.startsWith('email-')) {
      const ok = await verifiedByOwnSession(supabase, req, userId);
      if (!ok) {
        console.error('delete-account: unauthorized — bearer token missing or does not match userId', { userId });
        res.status(401).json({ error: 'unauthorized' });
        return;
      }
      await deleteUserData(supabase, userId);
      console.log('delete-account: done (self, email session)', { userId });
      res.status(200).json({ deleted: true });
      return;
    }

    // apple-/google- accounts: no session to check, so require the
    // request/confirm push-code round trip instead.
    if (action === 'confirm') {
      if (!code) {
        res.status(400).json({ error: 'missing_code' });
        return;
      }
      const { data: row } = await supabase
        .from('account_deletion_codes')
        .select('code, expires_at')
        .eq('user_id', userId)
        .maybeSingle();
      if (!row || String(row.code) !== String(code).trim() || new Date(row.expires_at) < new Date()) {
        res.status(401).json({ error: 'invalid_or_expired_code' });
        return;
      }
      await deleteUserData(supabase, userId);
      console.log('delete-account: done (self, push code)', { userId });
      res.status(200).json({ deleted: true });
      return;
    }

    // Default action is 'request': push a one-time code to this
    // account's own registered device(s) and stop — the client must
    // call again with action: 'confirm' and that code.
    const { data: tokens, error: tokensError } = await supabase
      .from('device_tokens')
      .select('fcm_token')
      .eq('user_id', userId);
    if (tokensError) throw tokensError;
    if (!tokens || !tokens.length) {
      console.error('delete-account: no_registered_device', { userId });
      res.status(409).json({ error: 'no_registered_device' });
      return;
    }

    const genCode = randomCode();
    const { error: upsertError } = await supabase.from('account_deletion_codes').upsert({
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
            title: 'Hesabın silinməsi',
            body: `Təsdiq kodunuz: ${genCode} (${CODE_TTL_MINUTES} dəqiqə etibarlıdır)`,
          },
          ...NOTIFICATION_SOUND,
        });
        pushed++;
      } catch (err) {
        console.error('delete-account: FCM send failed', err.code, err.message);
      }
    }
    if (!pushed) {
      // Every registered token is dead/invalid — nothing was actually
      // delivered, so don't leave the caller thinking a code is coming.
      await supabase.from('account_deletion_codes').delete().eq('user_id', userId);
      res.status(409).json({ error: 'no_registered_device' });
      return;
    }

    console.log('delete-account: code requested', { userId, pushed });
    res.status(200).json({ requested: true, expiresInMinutes: CODE_TTL_MINUTES });
  } catch (err) {
    console.error('delete-account: unexpected error', err);
    res.status(500).json({ error: err.message });
  }
}

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
//
// Auth: two independent callers, either is accepted —
//   1. The app itself, self-service (lib/... "delete my account"),
//      gated by NOTIFY_SECRET the same as send-notification.js.
//   2. The admin panel, deleting an account on someone's behalf (e.g. a
//      support/GDPR request) — verified via verifyAdmin.js, same as
//      every other admin-panel-only endpoint.
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '../lib/verifyAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const hasNotifySecret = !!process.env.NOTIFY_SECRET && req.headers['x-notify-secret'] === process.env.NOTIFY_SECRET;
  const admin = hasNotifySecret ? null : await verifyAdmin(req);
  if (!hasNotifySecret && !admin) {
    console.error('delete-account: unauthorized — neither NOTIFY_SECRET nor a verified admin token matched');
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const { userId } = req.body || {};
  if (!userId || typeof userId !== 'string') {
    res.status(400).json({ error: 'missing_user_id' });
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

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    await Promise.all([
      supabase.from('device_tokens').delete().eq('user_id', userId),
      supabase.from('favorites').delete().eq('user_id', userId),
      supabase.from('user_points').delete().eq('user_id', userId),
      supabase.from('feedback_reports').delete().eq('user_id', userId),
      supabase.from('referrals').delete().eq('referrer_id', userId),
      supabase.from('referrals').delete().eq('referred_id', userId),
      supabase.from('product_submissions').delete().eq('submitted_by', userId).eq('review_status', 'pending'),
    ]);

    await supabase.from('users').delete().eq('id', userId);

    if (userId.startsWith('email-')) {
      const authUserId = userId.slice('email-'.length);
      const { error } = await supabase.auth.admin.deleteUser(authUserId);
      if (error) console.error('delete-account: auth.admin.deleteUser failed', error.message);
    }

    console.log('delete-account: done', { userId });
    res.status(200).json({ deleted: true });
  } catch (err) {
    console.error('delete-account: unexpected error', err);
    res.status(500).json({ error: err.message });
  }
}

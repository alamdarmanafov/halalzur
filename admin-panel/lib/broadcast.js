// Shared by send-broadcast.js (immediate sends) and
// process-scheduled-broadcasts.js (cron-fired scheduled sends). Lives
// outside admin-panel/api/ on purpose — every file directly under api/
// becomes its own Vercel route, and this one has no request/response of
// its own.
import { getMessaging } from 'firebase-admin/messaging';
import { createClient } from '@supabase/supabase-js';

const BROADCAST_TOPIC = 'halalzur_all';

/**
 * Sends a push to everyone matching the given plan/language filters.
 *
 * "all" + "all" (no real filter) uses FCM's topic messaging — every
 * device auto-subscribes to BROADCAST_TOPIC on registration (see
 * lib/notifications.ts), including ones with no matching `users` row
 * (e.g. the email/password demo stub's shared 'local-user' id never
 * synced there — see supabase/schema.sql's users table comment), so this
 * is the only path that reaches literally everyone.
 *
 * Any real plan/language filter switches to a per-token loop scoped to
 * `users` rows matching the filter — this can only ever reach devices
 * whose owner has a synced `users` row (Apple/Google/real email sign-in).
 */
export async function sendBroadcast({ firebaseApp, supabaseUrl, serviceRoleKey, title, body, audiencePlan, audienceLanguage }) {
  const plan = audiencePlan || 'all';
  const language = audienceLanguage || 'all';
  const messaging = getMessaging(firebaseApp);

  if (plan === 'all' && language === 'all') {
    await messaging.send({ topic: BROADCAST_TOPIC, notification: { title, body } });
    return { sent: null, total: null, mode: 'topic' };
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  let userQuery = supabase.from('users').select('id');
  if (plan !== 'all') userQuery = userQuery.eq('plan', plan);
  if (language !== 'all') userQuery = userQuery.eq('language', language);
  const { data: users, error: usersError } = await userQuery;
  if (usersError) throw usersError;
  if (!users || !users.length) return { sent: 0, total: 0, mode: 'targeted' };

  const userIds = users.map((u) => u.id);
  const CHUNK = 200; // stay well under PostgREST's .in() query-length limits
  let tokens = [];
  for (let i = 0; i < userIds.length; i += CHUNK) {
    const chunk = userIds.slice(i, i + CHUNK);
    const { data, error } = await supabase.from('device_tokens').select('fcm_token').in('user_id', chunk);
    if (error) throw error;
    tokens = tokens.concat((data || []).map((r) => r.fcm_token));
  }
  tokens = [...new Set(tokens)];
  if (!tokens.length) return { sent: 0, total: 0, mode: 'targeted' };

  let sent = 0;
  for (const token of tokens) {
    try {
      await messaging.send({ token, notification: { title, body } });
      sent++;
    } catch (err) {
      console.error('sendBroadcast: FCM send failed', err.code, err.message);
    }
  }
  return { sent, total: tokens.length, mode: 'targeted' };
}

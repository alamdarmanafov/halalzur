// Shared by send-broadcast.js (immediate sends) and
// process-scheduled-broadcasts.js (cron-fired scheduled sends). Lives
// outside admin-panel/api/ on purpose — every file directly under api/
// becomes its own Vercel route, and this one has no request/response of
// its own.
import { getMessaging } from 'firebase-admin/messaging';
import { createClient } from '@supabase/supabase-js';

const BROADCAST_TOPIC = 'halalzur_all';
const LANGS = ['az', 'en', 'ru', 'tr'];

// Azerbaijani is always the base text; a translation only overrides it
// when both its title and body are actually filled in (a half-filled
// translation falls back to Azerbaijani rather than sending a blank
// notification body).
function contentFor(lang, azTitle, azBody, translations) {
  if (lang !== 'az') {
    const t = translations && translations[lang];
    if (t && t.title && t.body) return { title: t.title, body: t.body };
  }
  return { title: azTitle, body: azBody };
}

async function tokensForUserIds(supabase, userIds) {
  const CHUNK = 200; // stay well under PostgREST's .in() query-length limits
  let tokens = [];
  for (let i = 0; i < userIds.length; i += CHUNK) {
    const chunk = userIds.slice(i, i + CHUNK);
    const { data, error } = await supabase.from('device_tokens').select('fcm_token').in('user_id', chunk);
    if (error) throw error;
    tokens = tokens.concat((data || []).map((r) => r.fcm_token));
  }
  return [...new Set(tokens)];
}

async function sendToTokens(messaging, tokens, notification) {
  let sent = 0;
  for (const token of tokens) {
    try {
      await messaging.send({ token, notification });
      sent++;
    } catch (err) {
      console.error('sendBroadcast: FCM send failed', err.code, err.message);
    }
  }
  return sent;
}

/**
 * Sends a push to everyone matching the given plan/language filters.
 *
 * "all" + "all" with no translations uses FCM's topic messaging — every
 * device auto-subscribes to BROADCAST_TOPIC on registration (see
 * lib/notifications.ts), including ones with no matching `users` row
 * (e.g. the email/password demo stub's shared 'local-user' id never
 * synced there — see supabase/schema.sql's users table comment), so this
 * is the only path that reaches literally everyone.
 *
 * Any real plan/language filter, or supplying `translations`, switches to
 * a per-token targeted send scoped to `users` rows matching the filter —
 * this can only ever reach devices whose owner has a synced `users` row
 * (Apple/Google/real email sign-in). When `translations` is provided and
 * the language filter is "all", each user is bucketed by their own
 * `users.language` and gets that language's text (falling back to the
 * Azerbaijani title/body for anyone whose language has no translation, or
 * whose language isn't az/en/ru/tr at all).
 *
 * `translations` shape: { en?: {title, body}, ru?: {title, body}, tr?: {title, body} }.
 */
async function logBroadcast(supabase, { title, body, audiencePlan, audienceLanguage, mode, sent, total }) {
  if (!supabase) return;
  try {
    await supabase.from('broadcast_log').insert({
      title,
      body,
      audience_plan: audiencePlan || 'all',
      audience_language: audienceLanguage || 'all',
      mode,
      sent_count: sent,
      total_count: total,
    });
  } catch {
    // best-effort — never fail the actual send over a logging error
  }
}

export async function sendBroadcast({ firebaseApp, supabaseUrl, serviceRoleKey, title, body, audiencePlan, audienceLanguage, translations }) {
  const plan = audiencePlan || 'all';
  const language = audienceLanguage || 'all';
  const messaging = getMessaging(firebaseApp);
  const hasTranslations = LANGS.slice(1).some((l) => translations && translations[l] && translations[l].title && translations[l].body);
  const logClient = supabaseUrl && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

  if (plan === 'all' && language === 'all' && !hasTranslations) {
    await messaging.send({ topic: BROADCAST_TOPIC, notification: { title, body } });
    await logBroadcast(logClient, { title, body, audiencePlan, audienceLanguage, mode: 'topic', sent: null, total: null });
    return { sent: null, total: null, mode: 'topic' };
  }

  const supabase = logClient || createClient(supabaseUrl, serviceRoleKey);
  let userQuery = supabase.from('users').select('id, language');
  if (plan !== 'all') userQuery = userQuery.eq('plan', plan);
  if (language !== 'all') userQuery = userQuery.eq('language', language);
  const { data: users, error: usersError } = await userQuery;
  if (usersError) throw usersError;
  if (!users || !users.length) {
    await logBroadcast(supabase, { title, body, audiencePlan, audienceLanguage, mode: 'targeted', sent: 0, total: 0 });
    return { sent: 0, total: 0, mode: 'targeted' };
  }

  // A specific language filter means everyone in it gets that one
  // language's text. "All" languages with translations provided means
  // each user gets their own language's text, grouped into per-language
  // batches so each batch is sent with its own notification text.
  const buckets = {};
  users.forEach((u) => {
    const lang = language !== 'all' ? language : (LANGS.includes(u.language) ? u.language : 'az');
    (buckets[lang] = buckets[lang] || []).push(u.id);
  });

  let sent = 0;
  let total = 0;
  for (const lang of Object.keys(buckets)) {
    const tokens = await tokensForUserIds(supabase, buckets[lang]);
    total += tokens.length;
    if (!tokens.length) continue;
    sent += await sendToTokens(messaging, tokens, contentFor(lang, title, body, translations));
  }
  await logBroadcast(supabase, { title, body, audiencePlan, audienceLanguage, mode: 'targeted', sent, total });
  return { sent, total, mode: 'targeted' };
}

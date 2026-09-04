/**
 * Calls the admin panel's /api/delete-account Vercel function to
 * permanently delete a user's account and personal data. Unlike
 * lib/pushNotify.ts this is NOT best-effort — account deletion is a
 * deliberate, user-initiated action, so a failure must reach the caller
 * rather than being silently swallowed.
 *
 * NOTIFY_SECRET alone (EXPO_PUBLIC_NOTIFY_SECRET) only proves "this came
 * from our app" — it's the same static value in every install, not a
 * per-user credential — so the endpoint requires real proof of account
 * ownership on top of it:
 *   - 'email-' accounts have a real Supabase Auth session; this attaches
 *     its access token and the server verifies it server-side. One call,
 *     no extra UX.
 *   - 'apple-'/'google-' accounts never get a Supabase Auth session
 *     (auth-context.tsx's Apple/Google sign-in is native-SDK only), so
 *     there's no token to attach — deleteAccount() instead requests a
 *     one-time code pushed to this device via FCM and returns
 *     { needsCode: true }; the caller must then collect that code from
 *     the user and call confirmAccountDeletion.
 */
import { supabase, isSupabaseConfigured } from './supabase';

const API_BASE = process.env.EXPO_PUBLIC_ADMIN_API_URL;
const NOTIFY_SECRET = process.env.EXPO_PUBLIC_NOTIFY_SECRET;

async function callDeleteAccount(body: Record<string, unknown>, authToken?: string): Promise<Record<string, unknown>> {
  if (!API_BASE) {
    throw new Error('Hesab silmə xidməti hazırda əlçatan deyil.');
  }
  const response = await fetch(`${API_BASE.replace(/\/$/, '')}/api/delete-account`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-notify-secret': NOTIFY_SECRET ?? '',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof json.error === 'string' ? json.error : 'failed');
  }
  return json;
}

export type DeleteAccountResult = { needsCode: boolean };

/**
 * Starts (and for 'email-' accounts, completes) account deletion. For
 * 'apple-'/'google-' accounts this only requests the confirmation code
 * and returns { needsCode: true } — the account isn't deleted yet, call
 * confirmAccountDeletion next with the code the user receives.
 */
export async function deleteAccount(userId: string): Promise<DeleteAccountResult> {
  if (userId.startsWith('email-')) {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase qoşulmayıb.');
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error('Sessiya bitib, yenidən daxil olun.');
    await callDeleteAccount({ userId }, token);
    return { needsCode: false };
  }

  await callDeleteAccount({ userId, action: 'request' });
  return { needsCode: true };
}

/** Completes deletion for 'apple-'/'google-' accounts using the code pushed by deleteAccount(). */
export async function confirmAccountDeletion(userId: string, code: string): Promise<void> {
  await callDeleteAccount({ userId, action: 'confirm', code });
}

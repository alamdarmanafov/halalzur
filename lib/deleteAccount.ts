/**
 * Calls the admin panel's /api/delete-account Vercel function to
 * permanently delete a user's account and personal data. Unlike
 * lib/pushNotify.ts this is NOT best-effort — account deletion is a
 * deliberate, user-initiated action, so a failure must reach the caller
 * rather than being silently swallowed.
 */
const API_BASE = process.env.EXPO_PUBLIC_ADMIN_API_URL;
const NOTIFY_SECRET = process.env.EXPO_PUBLIC_NOTIFY_SECRET;

export async function deleteAccount(userId: string): Promise<void> {
  if (!API_BASE) {
    throw new Error('Hesab silmə xidməti hazırda əlçatan deyil.');
  }
  const response = await fetch(`${API_BASE.replace(/\/$/, '')}/api/delete-account`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-notify-secret': NOTIFY_SECRET ?? '',
    },
    body: JSON.stringify({ userId }),
  });
  if (!response.ok) {
    throw new Error('Hesab silinmədi, yenidən cəhd edin.');
  }
}

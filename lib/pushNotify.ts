/**
 * Fires a real push notification (via the admin panel's
 * /api/send-notification Vercel function → Firebase Cloud Messaging) for
 * one user — used for the event-triggered notifications (registration,
 * achievements, product/place submissions, premium purchase).
 *
 * Silently does nothing if EXPO_PUBLIC_ADMIN_API_URL isn't set, and never
 * throws — a push failing should never block whatever action triggered
 * it. Requires the device to already have registered an FCM token
 * (lib/notifications.ts registerForPushNotifications), so this only
 * reaches a device, never a fresh install mid-signup.
 */
const API_BASE = process.env.EXPO_PUBLIC_ADMIN_API_URL;
const NOTIFY_SECRET = process.env.EXPO_PUBLIC_NOTIFY_SECRET;

/**
 * `data.route`, if set, is an expo-router path (e.g. "/achievements" or
 * "/product/8690504048068") — lib/notifications.ts uses it to take the
 * user straight to the relevant screen when they tap the notification,
 * instead of just opening the app to wherever it was left.
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: { route?: string }
): Promise<void> {
  if (!API_BASE) return;
  try {
    await fetch(`${API_BASE.replace(/\/$/, '')}/api/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-notify-secret': NOTIFY_SECRET ?? '',
      },
      body: JSON.stringify({ userId, title, body, data }),
    });
  } catch {
    // best-effort
  }
}

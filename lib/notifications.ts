import { Platform } from 'react-native';
import {
  getMessaging,
  requestPermission,
  getToken,
  subscribeToTopic,
  onMessage,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Push delivery goes through Firebase Cloud Messaging (this file).
 * Supabase (see supabase/schema.sql's device_tokens table) only stores
 * which token belongs to which local user, so a future backend can send
 * a targeted push via the Firebase Admin SDK — Supabase itself never
 * sends anything.
 *
 * Every device auto-subscribes to a single broadcast topic, so you can
 * send an announcement to everyone directly from the Firebase console
 * (Cloud Messaging → New campaign → topic "halalzur_all") with zero
 * backend code.
 *
 * NOTE: needs an EAS dev-client/TestFlight/production build — Firebase's
 * native module isn't present in plain Expo Go.
 *
 * NOTE: `requestPermission`/`AuthorizationStatus` are marked deprecated
 * by @react-native-firebase (they point to `expo-notifications` or
 * `react-native-permissions` instead) but are still functional as of
 * this SDK version — fine to keep using for now, worth revisiting if a
 * future upgrade removes them.
 */
const BROADCAST_TOPIC = 'halalzur_all';

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (Platform.OS !== 'ios') return null;

  try {
    const messaging = getMessaging();
    const authStatus = await requestPermission(messaging);
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED || authStatus === AuthorizationStatus.PROVISIONAL;
    if (!enabled) return null;

    await subscribeToTopic(messaging, BROADCAST_TOPIC);
    const token = await getToken(messaging);

    if (token && isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('device_tokens')
        .upsert(
          { user_id: userId, fcm_token: token, platform: 'ios', updated_at: new Date().toISOString() },
          { onConflict: 'fcm_token' }
        );
      if (error) console.warn('device_tokens upsert failed:', error.message);
    }

    return token;
  } catch (err) {
    // Most commonly: no native Firebase module (Expo Go) — not fatal,
    // the rest of the app doesn't depend on push notifications.
    console.warn('Push notification registration failed:', err);
    return null;
  }
}

/**
 * FCM doesn't show a system banner for foreground messages on its own —
 * that's standard iOS/Android behavior, not a bug. The caller decides how
 * to surface it (e.g. an Alert, or an in-app banner).
 */
export function onForegroundMessage(handler: (title: string, body: string) => void) {
  const messaging = getMessaging();
  return onMessage(messaging, async (remoteMessage) => {
    handler(remoteMessage.notification?.title ?? 'Halalzur', remoteMessage.notification?.body ?? '');
  });
}

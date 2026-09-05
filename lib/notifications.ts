import { Platform } from 'react-native';
import {
  getMessaging,
  requestPermission,
  getToken,
  subscribeToTopic,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import { router } from 'expo-router';
import { supabase, isSupabaseConfigured } from './supabase';
import { getOrClaimSyncToken } from './syncToken';

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
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return null;

  try {
    const messaging = getMessaging();
    const authStatus = await requestPermission(messaging);
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED || authStatus === AuthorizationStatus.PROVISIONAL;
    if (!enabled) return null;

    await subscribeToTopic(messaging, BROADCAST_TOPIC);
    const token = await getToken(messaging);

    if (token && isSupabaseConfigured && supabase) {
      // register_device_token requires this device to already hold the
      // account's sync_token — see migration_2026_09_05_device_tokens_
      // lockdown.sql for why a direct upsert here used to let anyone
      // register a device under someone else's userId.
      const syncToken = await getOrClaimSyncToken(userId);
      if (syncToken) {
        const { error } = await supabase.rpc('register_device_token', {
          p_user_id: userId,
          p_token: syncToken,
          p_fcm_token: token,
          p_platform: Platform.OS,
        });
        if (error) console.warn('register_device_token failed:', error.message);
      }
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
 * to surface it (e.g. an Alert, or an in-app banner). `route`, if the
 * notification carried one (lib/pushNotify.ts's `data.route`), is where a
 * tap on it should take the user.
 */
export function onForegroundMessage(handler: (title: string, body: string, route?: string) => void) {
  const messaging = getMessaging();
  return onMessage(messaging, async (remoteMessage) => {
    handler(
      remoteMessage.notification?.title ?? 'Halalzur',
      remoteMessage.notification?.body ?? '',
      remoteMessage.data?.route as string | undefined
    );
  });
}

function navigateToNotificationRoute(remoteMessage: { data?: Record<string, string | object> } | null) {
  const route = remoteMessage?.data?.route;
  if (!route || typeof route !== 'string') return;
  try {
    router.push(route as any);
  } catch {
    // Route may not resolve if the app's still initializing — not fatal.
  }
}

/**
 * Handles the two cases FCM's foreground `onMessage` doesn't cover:
 * tapping a notification that arrived while backgrounded, and one that
 * cold-started the app (getInitialNotification). Call once on mount.
 */
export function setupNotificationNavigation(): () => void {
  const messaging = getMessaging();
  const unsubscribe = onNotificationOpenedApp(messaging, navigateToNotificationRoute);
  getInitialNotification(messaging).then(navigateToNotificationRoute);
  return unsubscribe;
}

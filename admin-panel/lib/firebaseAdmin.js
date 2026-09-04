// Shared Firebase Admin SDK initializer for every Vercel function that
// sends push (send-notification.js, send-broadcast.js,
// process-scheduled-broadcasts.js). Lives outside admin-panel/api/ on
// purpose — files directly under api/ each become their own Vercel route.
import { initializeApp, cert, getApps } from 'firebase-admin/app';

/**
 * FIREBASE_PRIVATE_KEY has two common ways to end up malformed once pasted
 * into Vercel's env var UI:
 *   1. The surrounding double quotes from the downloaded JSON file get
 *      copied along with the value ("-----BEGIN...").
 *   2. The JSON's escaped "\n" sequences are expected to survive as the
 *      two literal characters backslash+n, but some paste paths (or a
 *      "multiline" env var that already has real line breaks) don't need
 *      the replace at all — doing it anyway is harmless since it's a
 *      no-op on text that has no literal "\n" left.
 * This normalizes both cases instead of failing with "Invalid PEM
 * formatted message" the moment either one is off.
 */
function normalizePrivateKey(raw) {
  if (!raw) return '';
  let key = raw.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, '\n');
}

export function getFirebaseApp() {
  if (getApps().length) return getApps()[0];
  return initializeApp({
    credential: cert({
      projectId: (process.env.FIREBASE_PROJECT_ID || '').trim(),
      clientEmail: (process.env.FIREBASE_CLIENT_EMAIL || '').trim(),
      privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    }),
  });
}

/**
 * Custom notification sound, spread into every messaging.send()/sendEach()
 * call's message object. assets/sounds/success.wav is bundled into the
 * native app by plugins/withNotificationSound.js — "success.wav" on iOS
 * (exact filename in the app bundle) and "success" on Android (raw
 * resource name, no extension). Requires a new build to take effect (it's
 * a native asset, not something JS-only can carry).
 */
export const NOTIFICATION_SOUND = {
  apns: { payload: { aps: { sound: 'success.wav' } } },
  android: { notification: { sound: 'success' } },
};

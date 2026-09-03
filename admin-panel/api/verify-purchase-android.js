// Vercel serverless function — Android/Google Play counterpart to
// verify-purchase.js. Verifies a completed Play Billing subscription
// against the Google Play Developer API before granting Premium — same
// reasoning as the iOS version: the client alone is never trusted to
// grant users.plan='premium'.
//
// Required Vercel environment variables (Settings → Environment Variables):
//   NOTIFY_SECRET               — shared secret; must match the app's
//                                  EXPO_PUBLIC_NOTIFY_SECRET
//   SUPABASE_URL                 — same value as EXPO_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY    — Supabase → Project Settings → API →
//                                  service_role (secret) key
//   GOOGLE_SERVICE_ACCOUNT_JSON  — Play Console → Setup → API access →
//                                  link/create a Google Cloud project →
//                                  create a service account with access to
//                                  "View financial data" → Google Cloud
//                                  Console → that service account → Keys →
//                                  Add key → JSON → paste the ENTIRE
//                                  downloaded JSON file content as this
//                                  variable's value (one line is fine).
import { JWT } from 'google-auth-library';
import { createClient } from '@supabase/supabase-js';

const PACKAGE_NAME = 'com.halalzur.app';
// Must match app/subscription.tsx's PLANS ids (same ids are used for both
// the App Store and Play Console products) — checked here too so a
// verified transaction for some unrelated product can't be replayed to
// claim Premium.
const KNOWN_PRODUCT_IDS = [
  'com.halalzur.app.premium.monthly',
  'com.halalzur.app.premium.sixmonth',
  'com.halalzur.app.premium.yearly',
];

const ACTIVE_STATES = new Set(['SUBSCRIPTION_STATE_ACTIVE', 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD']);

async function fetchSubscription(purchaseToken) {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return { error: 'google_not_configured' };

  let credentials;
  try {
    credentials = JSON.parse(raw);
  } catch {
    return { error: 'google_not_configured' };
  }

  try {
    const client = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });
    const url =
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}` +
      `/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`;
    const res = await client.request({ url });
    return { payload: res.data };
  } catch (err) {
    return { error: err.message ?? 'google_verification_failed' };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  if (!process.env.NOTIFY_SECRET || req.headers['x-notify-secret'] !== process.env.NOTIFY_SECRET) {
    console.error('verify-purchase-android: unauthorized — NOTIFY_SECRET missing or mismatched');
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const { userId, purchaseToken, productId } = req.body || {};
  if (!userId || !purchaseToken || !productId) {
    res.status(400).json({ error: 'missing_fields' });
    return;
  }
  if (!KNOWN_PRODUCT_IDS.includes(productId)) {
    res.status(400).json({ error: 'unknown_product' });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('verify-purchase-android: supabase_not_configured');
    res.status(500).json({ error: 'supabase_not_configured' });
    return;
  }

  const { payload, error } = await fetchSubscription(purchaseToken);
  if (error) {
    console.error('verify-purchase-android: google verification failed', { userId, error });
    res.status(200).json({ verified: false, error });
    return;
  }

  if (!ACTIVE_STATES.has(payload.subscriptionState)) {
    res.status(200).json({ verified: false, error: 'not_active', state: payload.subscriptionState });
    return;
  }

  const lineItem = (payload.lineItems || []).find((item) => item.productId === productId);
  if (!lineItem || !lineItem.expiryTime) {
    console.error('verify-purchase-android: mismatch', {
      userId,
      expectedProductId: productId,
      gotLineItems: (payload.lineItems || []).map((i) => i.productId),
    });
    res.status(200).json({ verified: false, error: 'mismatch' });
    return;
  }

  const expiresAt = new Date(lineItem.expiryTime);
  if (expiresAt.getTime() < Date.now()) {
    res.status(200).json({ verified: false, error: 'expired' });
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { error: updateError } = await supabase
      .from('users')
      .update({ plan: 'premium', premium_expires_at: expiresAt.toISOString(), updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (updateError) throw updateError;

    console.log('verify-purchase-android: granted', { userId, productId, expiresAt: expiresAt.toISOString() });
    res.status(200).json({ verified: true, premiumExpiresAt: expiresAt.toISOString() });
  } catch (err) {
    console.error('verify-purchase-android: supabase update failed', err);
    res.status(500).json({ error: err.message });
  }
}

// Vercel serverless function — verifies a completed StoreKit purchase
// directly against Apple's App Store Server API before granting Premium.
//
// Why this exists: app/subscription.tsx used to set users.plan='premium'
// straight from the client right after finishTransaction(), with no
// server-side check that Apple actually confirms the purchase. Since
// users.plan/premium_expires_at sit behind an open ("Public update", not
// admin-gated — real end-user profile edits need it) RLS policy, anyone
// holding the public anon key (trivially extractable from the app bundle)
// could PATCH themselves into Premium forever with zero purchase, by
// calling the Supabase REST API directly — this is now the only place a
// purchase grants Premium, and it only does so after Apple's own API
// confirms the transaction is real, unrevoked, and unexpired.
//
// NOT covered by this fix: lib/referrals.ts's grantMilestoneBonusIfEarned
// and lib/auth-context.tsx's grantAchievementPremium also grant Premium
// through that same open users.update policy, based on client-computed
// referral/achievement counts — a smaller, lower-urgency version of the
// same underlying gap (users.plan is writable by anyone with the anon
// key), left as a follow-up.
//
// Required Vercel environment variables (Settings → Environment Variables):
//   NOTIFY_SECRET               — shared secret; must match the app's
//                                  EXPO_PUBLIC_NOTIFY_SECRET
//   SUPABASE_URL                 — same value as EXPO_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY    — Supabase → Project Settings → API →
//                                  service_role (secret) key
//   APPLE_ISSUER_ID              |  App Store Connect → Users and Access →
//   APPLE_KEY_ID                 |  Integrations → In-App Purchase tab →
//   APPLE_PRIVATE_KEY            |  "Generate API Key". Issuer ID is shown
//                                    at the top of that page; Key ID and a
//                                    one-time .p8 file download appear once
//                                    the key is generated. Paste the WHOLE
//                                    .p8 file content — including the
//                                    -----BEGIN/END PRIVATE KEY----- lines
//                                    — as APPLE_PRIVATE_KEY.
import { AppStoreServerAPIClient, Environment } from '@apple/app-store-server-library';
import { createClient } from '@supabase/supabase-js';

const BUNDLE_ID = 'com.halalzur.app';
// Must match app/subscription.tsx's PLANS ids — checked here too so a
// verified transaction for some unrelated product can't be replayed to
// claim Premium.
const KNOWN_PRODUCT_IDS = [
  'com.halalzur.app.premium.monthly',
  'com.halalzur.app.premium.sixmonth',
  'com.halalzur.app.premium.yearly',
];

function decodeJWSPayload(jws) {
  const parts = jws.split('.');
  if (parts.length !== 3) throw new Error('malformed_jws');
  return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
}

/**
 * Fetches the transaction straight from Apple's authenticated API — trust
 * comes from that authenticated channel (our private key + TLS), not from
 * re-verifying the returned JWS's own signature, so this doesn't need
 * Apple's root certificates at all.
 *
 * A sandbox (TestFlight/dev build) purchase's transaction id doesn't exist
 * in Production and vice versa — tries Production first (the common case
 * once live) and falls back to Sandbox, rather than requiring the caller
 * to know which environment a given purchase came from.
 */
async function fetchTransaction(transactionId) {
  const signingKey = process.env.APPLE_PRIVATE_KEY;
  const keyId = process.env.APPLE_KEY_ID;
  const issuerId = process.env.APPLE_ISSUER_ID;
  if (!signingKey || !keyId || !issuerId) return { error: 'apple_not_configured' };

  for (const environment of [Environment.PRODUCTION, Environment.SANDBOX]) {
    try {
      const client = new AppStoreServerAPIClient(signingKey, keyId, issuerId, BUNDLE_ID, environment);
      const response = await client.getTransactionInfo(transactionId);
      return { payload: decodeJWSPayload(response.signedTransactionInfo) };
    } catch (err) {
      if (environment === Environment.SANDBOX) return { error: err.message ?? 'apple_verification_failed' };
      // else fall through and retry against Sandbox
    }
  }
  return { error: 'apple_verification_failed' };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  if (!process.env.NOTIFY_SECRET || req.headers['x-notify-secret'] !== process.env.NOTIFY_SECRET) {
    console.error('verify-purchase: unauthorized — NOTIFY_SECRET missing or mismatched');
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const { userId, transactionId, productId } = req.body || {};
  if (!userId || !transactionId || !productId) {
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
    console.error('verify-purchase: supabase_not_configured');
    res.status(500).json({ error: 'supabase_not_configured' });
    return;
  }

  const { payload, error } = await fetchTransaction(transactionId);
  if (error) {
    console.error('verify-purchase: apple verification failed', { userId, transactionId, error });
    res.status(200).json({ verified: false, error });
    return;
  }

  if (payload.bundleId !== BUNDLE_ID || payload.productId !== productId) {
    console.error('verify-purchase: mismatch', {
      userId,
      transactionId,
      gotBundleId: payload.bundleId,
      gotProductId: payload.productId,
      expectedProductId: productId,
    });
    res.status(200).json({ verified: false, error: 'mismatch' });
    return;
  }
  if (payload.revocationDate) {
    res.status(200).json({ verified: false, error: 'revoked' });
    return;
  }
  if (!payload.expiresDate || payload.expiresDate < Date.now()) {
    res.status(200).json({ verified: false, error: 'expired' });
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { error: updateError } = await supabase
      .from('users')
      .update({
        plan: 'premium',
        premium_expires_at: new Date(payload.expiresDate).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    if (updateError) throw updateError;

    console.log('verify-purchase: granted', { userId, transactionId, productId, expiresDate: payload.expiresDate });
    res.status(200).json({ verified: true, premiumExpiresAt: new Date(payload.expiresDate).toISOString() });
  } catch (err) {
    console.error('verify-purchase: supabase update failed', err);
    res.status(500).json({ error: err.message });
  }
}

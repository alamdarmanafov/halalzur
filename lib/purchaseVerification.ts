const API_BASE = process.env.EXPO_PUBLIC_ADMIN_API_URL;
const NOTIFY_SECRET = process.env.EXPO_PUBLIC_NOTIFY_SECRET;

/**
 * Sends a completed StoreKit purchase's transaction id to
 * admin-panel/api/verify-purchase.js, which checks it against Apple's App
 * Store Server API before granting Premium server-side — see that file's
 * header comment for why this exists (the client used to set
 * users.plan='premium' directly, which anyone holding the public anon key
 * could also do with zero purchase). The caller must treat a purchase as
 * successful only once this resolves true — do not grant Premium locally
 * (setPlan) on the strength of finishTransaction() alone.
 */
export async function verifyApplePurchase(
  userId: string,
  transactionId: string,
  productId: string
): Promise<boolean> {
  if (!API_BASE) {
    console.warn('verifyApplePurchase: EXPO_PUBLIC_ADMIN_API_URL not set — cannot verify purchase');
    return false;
  }
  try {
    const res = await fetch(`${API_BASE.replace(/\/$/, '')}/api/verify-purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-notify-secret': NOTIFY_SECRET ?? '' },
      body: JSON.stringify({ userId, transactionId, productId }),
    });
    const data = await res.json();
    return !!data.verified;
  } catch (err: any) {
    console.warn('verifyApplePurchase failed:', err.message);
    return false;
  }
}

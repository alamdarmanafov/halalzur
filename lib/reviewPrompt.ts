import * as StoreReview from 'expo-store-review';

/**
 * iOS itself caps how often the system rating prompt actually shows
 * (roughly 3x per year) regardless of how often this is called, so it's
 * safe to fire at every "happy moment" (premium purchase, achievement
 * unlock) without extra frequency-limiting logic of our own.
 */
export async function maybeRequestReview(): Promise<void> {
  try {
    if (await StoreReview.hasAction()) {
      await StoreReview.requestReview();
    }
  } catch {
    // best-effort
  }
}

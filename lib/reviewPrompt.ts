import AsyncStorage from '@react-native-async-storage/async-storage';
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

const SCAN_TRIGGER_KEY = 'halalzur.reviewPromptScanTrigger';
// Purchase/achievement moments are naturally one-shot (you only unlock a
// given tier or subscribe once), but the core "scan a product, get a
// useful answer" loop repeats constantly — the best-timed ask for a Free
// user who never hits either of those. Fires once, the first time
// lifetime scan count crosses this, not on every scan past it.
const SCAN_TRIGGER_THRESHOLD = 5;

export async function maybeRequestReviewAfterScans(totalScans: number): Promise<void> {
  if (totalScans < SCAN_TRIGGER_THRESHOLD) return;
  try {
    const already = await AsyncStorage.getItem(SCAN_TRIGGER_KEY);
    if (already) return;
    await AsyncStorage.setItem(SCAN_TRIGGER_KEY, '1');
    await maybeRequestReview();
  } catch {
    // best-effort
  }
}

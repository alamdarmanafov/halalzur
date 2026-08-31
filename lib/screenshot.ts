import { captureRef } from 'react-native-view-shot';
import { rootViewRef } from './screenshotRef';

/** Best-effort — returns null rather than throwing if capture fails. */
export async function captureAppScreenshot(): Promise<string | null> {
  try {
    if (!rootViewRef.current) return null;
    return await captureRef(rootViewRef, { format: 'jpg', quality: 0.6 });
  } catch {
    return null;
  }
}

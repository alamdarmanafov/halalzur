import { captureRef } from 'react-native-view-shot';
import { rootViewRef } from './screenshotRef';

/** Best-effort — returns null rather than throwing if capture fails. */
export async function captureAppScreenshot(): Promise<string | null> {
  if (!rootViewRef.current) {
    console.warn('captureAppScreenshot: rootViewRef.current is not set yet');
    return null;
  }
  try {
    return await captureRef(rootViewRef, { format: 'jpg', quality: 0.6 });
  } catch (err) {
    console.warn('captureAppScreenshot failed:', err);
    return null;
  }
}

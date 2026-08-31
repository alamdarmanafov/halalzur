import * as Haptics from 'expo-haptics';
import { CertificationResult } from './types';

/** unknown reads the same as mushbooh everywhere else in the app — same here. */
export function hapticForStatus(status: CertificationResult['status']) {
  if (status === 'halal') return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  if (status === 'haram') return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

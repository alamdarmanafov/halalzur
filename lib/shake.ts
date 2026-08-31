import { Accelerometer, AccelerometerMeasurement } from 'expo-sensors';

const SHAKE_MAGNITUDE_THRESHOLD = 2.2;
const SHAKE_COOLDOWN_MS = 2000;

/** Fires `callback` when the device is shaken, anywhere the listener is mounted. */
export function onShake(callback: () => void): () => void {
  let lastShakeAt = 0;
  Accelerometer.setUpdateInterval(120);
  const subscription = Accelerometer.addListener(({ x, y, z }: AccelerometerMeasurement) => {
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    const now = Date.now();
    if (magnitude > SHAKE_MAGNITUDE_THRESHOLD && now - lastShakeAt > SHAKE_COOLDOWN_MS) {
      lastShakeAt = now;
      callback();
    }
  });
  return () => subscription.remove();
}

import * as Network from 'expo-network';

/**
 * Halalzur never shows a certification result from a stale/offline cache —
 * every lookup must reach the (future) live GIMDES-backed service, so a
 * missing connection is always a hard stop, not a silent fallback.
 */
export async function hasInternetConnection(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return !!state.isConnected && state.isInternetReachable !== false;
  } catch {
    return false;
  }
}

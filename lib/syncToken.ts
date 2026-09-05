/**
 * Per-account secret required by the favorites_* and history_* RPCs
 * (lib/favorites.ts, lib/historyBackup.ts) now that `favorites` and
 * `scan_history_backup` carry no anon-key policies of their own — see
 * supabase/migration_2026_09_05_sync_token.sql for why: 'apple-'/'google-'
 * accounts never get a Supabase Auth session, so there's no auth.uid()
 * for RLS to check, and the account id alone isn't secret enough to key
 * access on (it's derived from Apple/Google's own account id, and the
 * `users` table already exposes ids via its public-read policy).
 *
 * Generated locally and claimed server-side (first-claim-wins, via the
 * claim_sync_token RPC) the first time a device signs in to a given
 * account. A second device signing in to an account that already claimed
 * a token from elsewhere simply won't get one back — see that
 * migration's "known limitation" note — and falls back to local-only
 * favorites/history on that device, same as before this feature existed.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_PREFIX = 'halalzur_sync_token_';

const cache = new Map<string, string>();

/**
 * Returns this device's sync token for userId — from cache/AsyncStorage
 * if already claimed, otherwise generates one and tries to claim it.
 * Returns null if Supabase isn't configured, the claim failed (some other
 * device already holds this account's token, or — since syncUser()'s
 * `users` upsert on sign-in is fire-and-forget — that row simply hasn't
 * landed yet), or the request errored. A failure is never cached: callers
 * treat null as "no cloud sync available right now" and simply retry on
 * their next favorites/history call, same as the rest of the sync layer.
 */
export async function getOrClaimSyncToken(userId: string): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const hit = cache.get(userId);
  if (hit) return hit;

  const key = STORAGE_PREFIX + userId;
  try {
    const cached = await AsyncStorage.getItem(key);
    if (cached) {
      cache.set(userId, cached);
      return cached;
    }

    const token = Crypto.randomUUID();
    const { data, error } = await supabase.rpc('claim_sync_token', { p_user_id: userId, p_token: token });
    if (error || data !== true) return null;

    await AsyncStorage.setItem(key, token);
    cache.set(userId, token);
    return token;
  } catch {
    return null;
  }
}

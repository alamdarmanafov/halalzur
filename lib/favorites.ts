import { CertificationResult } from './types';
import { supabase, isSupabaseConfigured } from './supabase';
import { getOrClaimSyncToken } from './syncToken';

/** Same scope as lib/userSync.ts — only real (Apple/Google) accounts sync. */
function isSyncableUserId(id: string): boolean {
  return id.startsWith('apple-') || id.startsWith('google-');
}

type FavoriteRow = { data: CertificationResult };

/**
 * Favorites for a signed-in account, newest first — lets Favoritlər
 * survive a reinstall/device change instead of only living in
 * AsyncStorage. Stores the full CertificationResult snapshot (not just a
 * barcode) since a favorited product may have come from an external
 * lookup (Open Food Facts/UPCitemdb) with nothing in certified_entries to
 * join back to.
 *
 * Goes through the favorites_* RPCs (not a direct table read/write) —
 * see supabase/migration_2026_09_05_sync_token.sql for why the table
 * itself has no anon-key policy anymore.
 */
export async function fetchRemoteFavorites(userId: string): Promise<CertificationResult[] | null> {
  if (!isSupabaseConfigured || !supabase || !isSyncableUserId(userId)) return null;
  const token = await getOrClaimSyncToken(userId);
  if (!token) return null;

  const { data, error } = await supabase.rpc('favorites_list', { p_user_id: userId, p_token: token });
  if (error || !data) return null;
  return (data as FavoriteRow[]).map((row) => row.data);
}

export async function syncFavoriteAdd(userId: string, result: CertificationResult): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !isSyncableUserId(userId)) return;
  const token = await getOrClaimSyncToken(userId);
  if (!token) return;
  await supabase.rpc('favorites_upsert', {
    p_user_id: userId,
    p_token: token,
    p_barcode: result.barcode,
    p_data: result,
  });
}

export async function syncFavoriteRemove(userId: string, barcode: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !isSyncableUserId(userId)) return;
  const token = await getOrClaimSyncToken(userId);
  if (!token) return;
  await supabase.rpc('favorites_delete', { p_user_id: userId, p_token: token, p_barcode: barcode });
}

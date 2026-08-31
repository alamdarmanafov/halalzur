import { CertificationResult } from './types';
import { supabase, isSupabaseConfigured } from './supabase';

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
 */
export async function fetchRemoteFavorites(userId: string): Promise<CertificationResult[] | null> {
  if (!isSupabaseConfigured || !supabase || !isSyncableUserId(userId)) return null;

  const { data, error } = await supabase
    .from('favorites')
    .select('data')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .returns<FavoriteRow[]>();

  if (error || !data) return null;
  return data.map((row) => row.data);
}

export async function syncFavoriteAdd(userId: string, result: CertificationResult): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !isSyncableUserId(userId)) return;
  await supabase
    .from('favorites')
    .upsert({ user_id: userId, barcode: result.barcode, data: result }, { onConflict: 'user_id,barcode' });
}

export async function syncFavoriteRemove(userId: string, barcode: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !isSyncableUserId(userId)) return;
  await supabase.from('favorites').delete().eq('user_id', userId).eq('barcode', barcode);
}

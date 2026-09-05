import { CertificationResult } from './types';
import { supabase, isSupabaseConfigured } from './supabase';
import { getOrClaimSyncToken } from './syncToken';

/** Same scope as lib/favorites.ts — only real (Apple/Google) accounts sync. */
function isSyncableUserId(id: string): boolean {
  return id.startsWith('apple-') || id.startsWith('google-');
}

type HistoryRow = { data: CertificationResult };

/**
 * Goes through the history_* RPCs (not a direct table read/write) — see
 * supabase/migration_2026_09_05_sync_token.sql for why scan_history_backup
 * has no anon-key policy anymore.
 */
export async function fetchRemoteHistory(userId: string): Promise<CertificationResult[] | null> {
  if (!isSupabaseConfigured || !supabase || !isSyncableUserId(userId)) return null;
  const token = await getOrClaimSyncToken(userId);
  if (!token) return null;

  const { data, error } = await supabase.rpc('history_list', { p_user_id: userId, p_token: token });
  if (error || !data) return null;
  return (data as HistoryRow[]).map((row) => row.data);
}

export async function syncHistoryAdd(userId: string, result: CertificationResult): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !isSyncableUserId(userId)) return;
  const token = await getOrClaimSyncToken(userId);
  if (!token) return;
  await supabase.rpc('history_add', {
    p_user_id: userId,
    p_token: token,
    p_barcode: result.barcode,
    p_data: result,
  });
}

export async function syncHistoryRemove(userId: string, barcode: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !isSyncableUserId(userId)) return;
  const token = await getOrClaimSyncToken(userId);
  if (!token) return;
  await supabase.rpc('history_remove', { p_user_id: userId, p_token: token, p_barcode: barcode });
}

export async function syncHistoryClear(userId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !isSyncableUserId(userId)) return;
  const token = await getOrClaimSyncToken(userId);
  if (!token) return;
  await supabase.rpc('history_clear', { p_user_id: userId, p_token: token });
}

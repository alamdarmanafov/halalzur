import { CertificationResult } from './types';
import { supabase, isSupabaseConfigured } from './supabase';

/** Same scope as lib/favorites.ts — only real (Apple/Google) accounts sync. */
function isSyncableUserId(id: string): boolean {
  return id.startsWith('apple-') || id.startsWith('google-');
}

type HistoryRow = { data: CertificationResult };

export async function fetchRemoteHistory(userId: string): Promise<CertificationResult[] | null> {
  if (!isSupabaseConfigured || !supabase || !isSyncableUserId(userId)) return null;

  const { data, error } = await supabase
    .from('scan_history_backup')
    .select('data')
    .eq('user_id', userId)
    .order('scanned_at', { ascending: false })
    .limit(200)
    .returns<HistoryRow[]>();

  if (error || !data) return null;
  return data.map((row) => row.data);
}

export async function syncHistoryAdd(userId: string, result: CertificationResult): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !isSyncableUserId(userId)) return;
  await supabase
    .from('scan_history_backup')
    .upsert(
      { user_id: userId, barcode: result.barcode, data: result, scanned_at: new Date().toISOString() },
      { onConflict: 'user_id,barcode' }
    );
}

export async function syncHistoryRemove(userId: string, barcode: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !isSyncableUserId(userId)) return;
  await supabase.from('scan_history_backup').delete().eq('user_id', userId).eq('barcode', barcode);
}

export async function syncHistoryClear(userId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !isSyncableUserId(userId)) return;
  await supabase.from('scan_history_backup').delete().eq('user_id', userId);
}

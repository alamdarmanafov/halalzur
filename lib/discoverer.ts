import { supabase, isSupabaseConfigured } from './supabase';

export type Discoverer = { userId: string; userName: string | null; discoveredAt: string };

/**
 * "İlk mən tapdım" badge — the earliest product_submissions row for this
 * barcode (excluding rejected ones, so spam/mistakes don't get credited).
 * No new table: product_submissions already records who first suggested a
 * barcode and when, which is exactly "who found this first".
 */
export async function getFirstDiscoverer(barcode: string): Promise<Discoverer | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase
    .from('product_submissions')
    .select('submitted_by, submitted_by_name, created_at')
    .eq('barcode', barcode)
    .neq('review_status', 'rejected')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle<{ submitted_by: string; submitted_by_name: string | null; created_at: string }>();
  if (error || !data) return null;
  return { userId: data.submitted_by, userName: data.submitted_by_name, discoveredAt: data.created_at };
}

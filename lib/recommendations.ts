import { supabase, isSupabaseConfigured } from './supabase';

/** How many users have tapped "Tövsiyə et" on this barcode. */
export async function getRecommendCount(barcode: string): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 0;
  const { count, error } = await supabase
    .from('product_recommendations')
    .select('id', { count: 'exact', head: true })
    .eq('barcode', barcode);
  if (error) return 0;
  return count ?? 0;
}

export async function hasRecommended(userId: string, barcode: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { data, error } = await supabase
    .from('product_recommendations')
    .select('id')
    .eq('user_id', userId)
    .eq('barcode', barcode)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

/** Inserts or removes this user's own recommendation row for the barcode. */
export async function toggleRecommend(
  userId: string,
  barcode: string,
  currentlyRecommended: boolean
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase qoşulmayıb.');
  if (currentlyRecommended) {
    const { error } = await supabase
      .from('product_recommendations')
      .delete()
      .eq('user_id', userId)
      .eq('barcode', barcode);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('product_recommendations').insert({ user_id: userId, barcode });
    if (error) throw error;
  }
}

/**
 * Batched (one query for the whole visible list) rather than per-row —
 * the Places tab renders a list, not a single detail screen like a
 * product barcode does, so N individual count queries per render would
 * be wasteful.
 */
export async function getPlaceRecommendCounts(placeIds: string[]): Promise<Record<string, number>> {
  if (!isSupabaseConfigured || !supabase || !placeIds.length) return {};
  const { data, error } = await supabase.from('place_recommendations').select('place_id').in('place_id', placeIds);
  if (error || !data) return {};
  const counts: Record<string, number> = {};
  data.forEach((row) => {
    counts[row.place_id] = (counts[row.place_id] ?? 0) + 1;
  });
  return counts;
}

export async function getMyRecommendedPlaceIds(userId: string, placeIds: string[]): Promise<Set<string>> {
  if (!isSupabaseConfigured || !supabase || !placeIds.length) return new Set();
  const { data, error } = await supabase
    .from('place_recommendations')
    .select('place_id')
    .eq('user_id', userId)
    .in('place_id', placeIds);
  if (error || !data) return new Set();
  return new Set(data.map((row) => row.place_id));
}

/** Inserts or removes this user's own recommendation row for the place. */
export async function togglePlaceRecommend(
  userId: string,
  placeId: string,
  currentlyRecommended: boolean
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase qoşulmayıb.');
  if (currentlyRecommended) {
    const { error } = await supabase
      .from('place_recommendations')
      .delete()
      .eq('user_id', userId)
      .eq('place_id', placeId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('place_recommendations').insert({ user_id: userId, place_id: placeId });
    if (error) throw error;
  }
}

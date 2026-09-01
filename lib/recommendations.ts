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

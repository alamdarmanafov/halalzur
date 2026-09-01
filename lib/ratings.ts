import { supabase, isSupabaseConfigured } from './supabase';

export type RatingSummary = { average: number; count: number };

export async function getRatingSummary(barcode: string): Promise<RatingSummary> {
  if (!isSupabaseConfigured || !supabase) return { average: 0, count: 0 };
  const { data, error } = await supabase.from('product_ratings').select('rating').eq('barcode', barcode);
  if (error || !data || !data.length) return { average: 0, count: 0 };
  const sum = data.reduce((acc, row) => acc + (row.rating as number), 0);
  return { average: sum / data.length, count: data.length };
}

export async function getMyRating(userId: string, barcode: string): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 0;
  const { data, error } = await supabase
    .from('product_ratings')
    .select('rating')
    .eq('user_id', userId)
    .eq('barcode', barcode)
    .maybeSingle();
  if (error || !data) return 0;
  return data.rating as number;
}

/** Upserts this user's own 1-5 star rating for the barcode. */
export async function setRating(userId: string, barcode: string, rating: number): Promise<void> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase qoşulmayıb.');
  const { error } = await supabase
    .from('product_ratings')
    .upsert({ user_id: userId, barcode, rating, updated_at: new Date().toISOString() }, { onConflict: 'user_id,barcode' });
  if (error) throw error;
}

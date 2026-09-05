import { supabase, isSupabaseConfigured } from './supabase';
import { getOrClaimSyncToken } from './syncToken';

export async function getFollowedBrands(userId: string): Promise<string[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase.from('brand_follows').select('brand').eq('user_id', userId);
  if (error || !data) return [];
  return data.map((row) => row.brand as string);
}

export async function isFollowingBrand(userId: string, brand: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { data } = await supabase
    .from('brand_follows')
    .select('id')
    .eq('user_id', userId)
    .eq('brand', brand)
    .maybeSingle();
  return !!data;
}

export async function followBrand(userId: string, brand: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const token = await getOrClaimSyncToken(userId);
  if (!token) return;
  await supabase.rpc('brand_follow_add', { p_user_id: userId, p_token: token, p_brand: brand });
}

export async function unfollowBrand(userId: string, brand: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const token = await getOrClaimSyncToken(userId);
  if (!token) return;
  await supabase.rpc('brand_follow_remove', { p_user_id: userId, p_token: token, p_brand: brand });
}

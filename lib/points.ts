import { supabase, isSupabaseConfigured } from './supabase';

/** Shared by product-submission approvals and referral bonuses. */
export async function awardPoints(userId: string, userName: string | null, amount: number): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  const { data: existing } = await supabase
    .from('user_points')
    .select('points')
    .eq('user_id', userId)
    .maybeSingle();

  await supabase.from('user_points').upsert(
    {
      user_id: userId,
      user_name: userName,
      points: (existing?.points ?? 0) + amount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
}

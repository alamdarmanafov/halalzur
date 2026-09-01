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
  // Best-effort — backs the admin panel's "Bu ay" leaderboard toggle,
  // never blocks the actual point award if it fails.
  supabase.from('points_log').insert({ user_id: userId, user_name: userName, amount }).then(() => {});
}

/** How many points one day of redeemed Premium costs — see redeemPointsForPremium. */
export const POINTS_PER_PREMIUM_DAY = 10;
/** Below this, floor(points / POINTS_PER_PREMIUM_DAY) would be a trivial reward. */
export const MIN_REDEEMABLE_DAYS = 3;

/**
 * Spends whatever whole days of Premium the user's current point balance
 * covers (leaving any remainder points), returning how many days that
 * was. Not logged to points_log — that table is an "earned" activity
 * feed for the admin panel's monthly leaderboard, and a redemption isn't
 * activity, it's spending. auth-context.tsx's redeemPointsForPremium
 * actually grants the Premium time after this succeeds.
 */
export async function redeemPointsForPremium(userId: string): Promise<number> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase qoşulmayıb.');

  const { data: existing, error } = await supabase
    .from('user_points')
    .select('points')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;

  const currentPoints = existing?.points ?? 0;
  const days = Math.floor(currentPoints / POINTS_PER_PREMIUM_DAY);
  if (days < MIN_REDEEMABLE_DAYS) {
    throw new Error(`Ən azı ${MIN_REDEEMABLE_DAYS * POINTS_PER_PREMIUM_DAY} xal lazımdır.`);
  }

  const spent = days * POINTS_PER_PREMIUM_DAY;
  const { error: updateError } = await supabase
    .from('user_points')
    .update({ points: currentPoints - spent, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (updateError) throw updateError;

  return days;
}

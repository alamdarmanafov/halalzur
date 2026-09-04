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

export type PointsRedemption = { days: number; newExpiresAt: string };

/**
 * Calls the redeem_points_for_premium Postgres function (see
 * supabase/migration_2026_09_04_server_side_reward_premium.sql), which
 * deducts the spent points and grants the Premium extension in one
 * server-side transaction — this used to read the point balance, deduct
 * client-side, then have auth-context.tsx separately PATCH users.plan
 * with a client-computed day count via the same open RLS policy real
 * profile edits need (so a crafted request could claim any day count),
 * and as two non-atomic steps, a crash between them could deduct points
 * without ever granting the time. Not logged to points_log — that table
 * is an "earned" activity feed for the admin panel's monthly
 * leaderboard, and a redemption isn't activity, it's spending.
 */
export async function redeemPointsForPremium(userId: string): Promise<PointsRedemption> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase qoşulmayıb.');

  const { data, error } = await supabase
    .rpc('redeem_points_for_premium', { p_user_id: userId })
    .maybeSingle<{ granted_days: number | null; new_expires_at: string | null }>();
  if (error) throw error;
  if (!data || data.granted_days == null || !data.new_expires_at) {
    throw new Error(`Ən azı ${MIN_REDEEMABLE_DAYS * POINTS_PER_PREMIUM_DAY} xal lazımdır.`);
  }

  return { days: data.granted_days, newExpiresAt: data.new_expires_at };
}

export type GiftResult = { toUserId: string; toName: string | null; newExpiresAt: string };

/**
 * Spends the caller's own points to gift Premium days to a friend found by
 * referral code — see gift_premium_from_points in
 * supabase/migration_2026_09_04_gift_premium.sql for why this is a single
 * server-side RPC rather than two client-side steps.
 */
export async function giftPremiumFromPoints(userId: string, toReferralCode: string, days: number): Promise<GiftResult> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase qoşulmayıb.');

  const { data, error } = await supabase
    .rpc('gift_premium_from_points', { p_from_user_id: userId, p_to_referral_code: toReferralCode.trim(), p_days: days })
    .maybeSingle<{ to_user_id: string; to_name: string | null; new_expires_at: string }>();
  if (error) throw error;
  if (!data) throw new Error('Kod tapılmadı, ya da kifayət qədər xalınız yoxdur.');

  return { toUserId: data.to_user_id, toName: data.to_name, newExpiresAt: data.new_expires_at };
}

export type PromoRedemption = { days: number; newExpiresAt: string };

/** Redeems an admin-issued promo code (see admin panel's "Promo-kodlar" panel) for Premium days. */
export async function redeemPromoCode(userId: string, code: string): Promise<PromoRedemption> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase qoşulmayıb.');

  const { data, error } = await supabase
    .rpc('redeem_promo_code', { p_user_id: userId, p_code: code.trim() })
    .maybeSingle<{ granted_days: number | null; new_expires_at: string | null }>();
  if (error) throw error;
  if (!data || data.granted_days == null || !data.new_expires_at) {
    throw new Error('Kod tapılmadı, vaxtı bitib, ya da limit dolub.');
  }

  return { days: data.granted_days, newExpiresAt: data.new_expires_at };
}

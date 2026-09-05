import { supabase, isSupabaseConfigured } from './supabase';
import { sendPushNotification } from './pushNotify';

export const REFERRAL_BONUS_POINTS = 20;

/**
 * Hitting a referral count exactly awards a lump sum of points (days *
 * POINTS_PER_PREMIUM_DAY, see lib/points.ts) — not Premium directly. The
 * person then redeems those points into Premium themselves whenever they
 * want, through the same self-redeem flow (redeemPointsForPremium) as any
 * other earned points. Checked only at the moment a referral is redeemed
 * (grantMilestoneBonusIfEarned below), so it fires once, on the exact
 * referral that crosses the threshold.
 */
export const REFERRAL_MILESTONES: { count: number; premiumDays: number }[] = [
  { count: 5, premiumDays: 30 },
  { count: 10, premiumDays: 60 },
  { count: 25, premiumDays: 90 },
];

function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase qoşulmayıb — dəvət funksiyası işləmir.');
  }
  return supabase;
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I ambiguity

function generateCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return code;
}

/** Lazily assigns a referral code to this account the first time it's needed. */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const client = requireSupabase();
  const { data } = await client.from('users').select('referral_code').eq('id', userId).maybeSingle();
  if (data?.referral_code) return data.referral_code;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const { error } = await client.from('users').update({ referral_code: code }).eq('id', userId);
    if (!error) return code;
    // Collides with an existing code (unique constraint) — retry with a new one.
  }
  throw new Error('Dəvət kodu yaradıla bilmədi, yenidən cəhd edin.');
}

export type ReferralEntry = { id: string; name: string | null; createdAt: string };

/** Who this user has referred, newest first — for the "Sizin dəvətləriniz" list on the Referrals screen. */
export async function getMyReferrals(userId: string): Promise<ReferralEntry[]> {
  const client = requireSupabase();
  const { data: refs, error } = await client
    .from('referrals')
    .select('referred_id, created_at')
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (!refs || !refs.length) return [];

  const ids = refs.map((r) => r.referred_id);
  const { data: users } = await client.from('users').select('id, name').in('id', ids);
  const nameById = new Map((users ?? []).map((u) => [u.id as string, u.name as string | null]));

  return refs.map((r) => ({
    id: r.referred_id as string,
    name: nameById.get(r.referred_id as string) ?? null,
    createdAt: r.created_at as string,
  }));
}

/**
 * Calls the grant_referral_milestone_bonus Postgres function (see
 * supabase/migration_2026_09_05_referral_milestones_to_points.sql), which
 * recomputes the referral count from the referrals table itself and
 * tracks already-granted milestones server-side — this used to count and
 * grant client-side, writing straight to users.plan via the same open
 * RLS policy real profile edits need, so a crafted request could claim a
 * referral count that was never real. The function is idempotent: safe
 * to call after every redeemReferral, whether or not a milestone was
 * actually just crossed. It credits points, not Premium directly — the
 * person redeems them into Premium themselves from the profile screen.
 */
async function grantMilestoneBonusIfEarned(referrerId: string): Promise<void> {
  const client = requireSupabase();
  const { data, error } = await client
    .rpc('grant_referral_milestone_bonus', { p_user_id: referrerId })
    .maybeSingle<{ granted_points: number | null; milestone_days: number | null }>();
  if (error || !data || data.granted_points == null) return;

  sendPushNotification(
    referrerId,
    '🎁 Xal qazandınız!',
    `Dostlarınızı dəvət etdiyiniz üçün ${data.granted_points} xal (${data.milestone_days} günlük Premium dəyərində) hesabınıza əlavə olundu! Profildən Premium-a çevirə bilərsiniz.`,
    { route: '/(tabs)/profile' }
  );
}

export async function hasRedeemedReferral(userId: string): Promise<boolean> {
  const client = requireSupabase();
  const { data } = await client.from('referrals').select('id').eq('referred_id', userId).maybeSingle();
  return !!data;
}

/**
 * redeem_referral_code (security definer) does the code lookup,
 * self-referral check, the referrals insert, and the points award all in
 * one atomic server-side step — see migration_2026_09_05_points_lockdown.sql
 * for why that used to be three separate client calls through
 * (now-closed) open RLS policies, letting a crafted request insert a fake
 * referral or forge its own points award.
 */
export async function redeemReferralCode(userId: string, code: string): Promise<void> {
  const client = requireSupabase();
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) throw new Error('Kod boşdur.');

  const { data, error } = await client
    .rpc('redeem_referral_code', { p_user_id: userId, p_code: trimmed })
    .maybeSingle<{ referrer_id: string; referrer_name: string | null }>();
  if (error) throw error;
  if (!data) throw new Error('Kod tapılmadı, ya da artıq istifadə etmisiniz.');

  // Best-effort, after the referral itself is safely recorded — a
  // milestone-bonus failure should never surface as a failed redemption
  // to the person redeeming the code.
  grantMilestoneBonusIfEarned(data.referrer_id).catch(() => {});
}

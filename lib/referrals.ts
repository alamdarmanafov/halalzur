import { supabase, isSupabaseConfigured } from './supabase';
import { awardPoints } from './points';
import { sendPushNotification } from './pushNotify';

export const REFERRAL_BONUS_POINTS = 20;

/**
 * On top of the linear points-to-premium-days redemption (lib/points.ts,
 * 10 points = 1 day — two referrals already covers that), hitting a
 * referral count exactly grants a lump-sum Premium bonus automatically,
 * no redemption action needed. Checked only at the moment a referral is
 * redeemed (grantMilestoneBonusIfEarned below), so it fires once, on the
 * exact referral that crosses the threshold.
 */
export const REFERRAL_MILESTONES: { count: number; premiumDays: number }[] = [
  { count: 5, premiumDays: 30 },
  { count: 10, premiumDays: 60 },
  { count: 25, premiumDays: 180 },
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
 * Fires once, the moment the referrer's total referral count exactly
 * equals a milestone (not >=, so an already-passed milestone from before
 * this feature shipped isn't re-granted on someone's next referral).
 * Extends rather than overwrites — same "add to whatever time is left"
 * rule as the admin panel's own extendUserPremium.
 */
async function grantMilestoneBonusIfEarned(referrerId: string): Promise<void> {
  const client = requireSupabase();
  const { count, error: countError } = await client
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_id', referrerId);
  if (countError || count == null) return;

  const milestone = REFERRAL_MILESTONES.find((m) => m.count === count);
  if (!milestone) return;

  const { data: owner } = await client
    .from('users')
    .select('plan, premium_expires_at')
    .eq('id', referrerId)
    .maybeSingle();
  if (!owner) return;

  const base =
    owner.plan === 'premium' && owner.premium_expires_at && new Date(owner.premium_expires_at).getTime() > Date.now()
      ? new Date(owner.premium_expires_at).getTime()
      : Date.now();
  const expiresAt = new Date(base + milestone.premiumDays * 86400000).toISOString();

  await client
    .from('users')
    .update({ plan: 'premium', premium_expires_at: expiresAt, updated_at: new Date().toISOString() })
    .eq('id', referrerId);

  sendPushNotification(
    referrerId,
    '🎁 Hədiyyə qazandınız!',
    `${milestone.count} dostunuzu dəvət etdiniz — ${milestone.premiumDays} gün pulsuz Premium hədiyyəmizdir!`,
    { route: '/referrals' }
  );
}

export async function hasRedeemedReferral(userId: string): Promise<boolean> {
  const client = requireSupabase();
  const { data } = await client.from('referrals').select('id').eq('referred_id', userId).maybeSingle();
  return !!data;
}

export async function redeemReferralCode(userId: string, userName: string | null, code: string): Promise<void> {
  const client = requireSupabase();
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) throw new Error('Kod boşdur.');

  const alreadyRedeemed = await hasRedeemedReferral(userId);
  if (alreadyRedeemed) throw new Error('Siz artıq bir dəvət kodu istifadə etmisiniz.');

  const { data: owner, error: ownerError } = await client
    .from('users')
    .select('id, name')
    .eq('referral_code', trimmed)
    .maybeSingle();
  if (ownerError) throw ownerError;
  if (!owner) throw new Error('Bu kod tapılmadı.');
  if (owner.id === userId) throw new Error('Öz kodunuzu istifadə edə bilməzsiniz.');

  const { error: insertError } = await client.from('referrals').insert({
    referrer_id: owner.id,
    referred_id: userId,
  });
  if (insertError) throw insertError;

  await Promise.all([
    awardPoints(owner.id, owner.name, REFERRAL_BONUS_POINTS),
    awardPoints(userId, userName, REFERRAL_BONUS_POINTS),
  ]);

  // Best-effort, after the referral itself is safely recorded — a
  // milestone-bonus failure should never surface as a failed redemption
  // to the person redeeming the code.
  grantMilestoneBonusIfEarned(owner.id).catch(() => {});
}

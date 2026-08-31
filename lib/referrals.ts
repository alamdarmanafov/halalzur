import { supabase, isSupabaseConfigured } from './supabase';
import { awardPoints } from './points';

export const REFERRAL_BONUS_POINTS = 20;

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
}

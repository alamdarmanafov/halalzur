import { User } from './types';
import { supabase, isSupabaseConfigured } from './supabase';
import { getOrCreateReferralCode } from './referrals';

const API_BASE = process.env.EXPO_PUBLIC_ADMIN_API_URL;
const NOTIFY_SECRET = process.env.EXPO_PUBLIC_NOTIFY_SECRET;

/**
 * A stable per-account id — Apple ('apple-...'), Google ('google-...'), or
 * real email/password via Supabase Auth ('email-...', prefixed with the
 * auth.users uuid).
 */
function isSyncableUserId(id: string): boolean {
  return id.startsWith('apple-') || id.startsWith('google-') || id.startsWith('email-');
}

/**
 * Backs the admin panel's "İstifadəçilər" list. See supabase/schema.sql's
 * `users` table comment for the email/password scope caveat.
 */
export async function syncUser(user: User): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  if (!isSyncableUserId(user.id)) return;

  const now = new Date().toISOString();
  await supabase.from('users').upsert(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      premium_expires_at: user.premiumExpiresAt,
      claimed_achievements: user.claimedAchievements,
      updated_at: now,
      last_seen_at: now,
    },
    { onConflict: 'id' }
  );

  ensureReferralCode(user.id);
  registerCountry(user.id);
}

/**
 * Fire-and-forget — asks admin-panel/api/register-country.js to stamp
 * users.country from Vercel's own edge geolocation header (no
 * third-party IP lookup). Silently does nothing if
 * EXPO_PUBLIC_ADMIN_API_URL isn't set, same as lib/pushNotify.ts.
 */
export function registerCountry(userId: string): void {
  if (!API_BASE) return;
  fetch(`${API_BASE.replace(/\/$/, '')}/api/register-country`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-notify-secret': NOTIFY_SECRET ?? '' },
    body: JSON.stringify({ userId }),
  }).catch(() => {
    // best-effort
  });
}

/**
 * Fire-and-forget — previously a referral code was only ever assigned the
 * first time someone opened app/referrals.tsx (Profil → Dostunu dəvət
 * et), so an account that never visited that screen had no code at all.
 * getOrCreateReferralCode() is a no-op once a code already exists, so
 * calling it here on every sync/app-launch is safe — it just guarantees
 * every account ends up with one without anyone having to open that
 * screen first.
 */
export function ensureReferralCode(userId: string): void {
  getOrCreateReferralCode(userId).catch((err) => {
    console.warn('ensureReferralCode failed:', err.message);
  });
}

/**
 * Fire-and-forget, called once per app launch for an already-signed-in
 * user (see the AuthProvider bootstrap effect in auth-context.tsx) — the
 * lightest possible write so opening the app updates users.last_seen_at
 * (admin panel's Users list) without re-upserting the full syncUser()
 * payload on every launch.
 */
export function touchLastSeen(userId: string): void {
  if (!isSupabaseConfigured || !supabase) return;
  if (!isSyncableUserId(userId)) return;
  supabase
    .from('users')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', userId)
    .then(({ error }) => {
      if (error) console.warn('touchLastSeen failed:', error.message);
    });
}

/**
 * Fire-and-forget — lets the admin panel's broadcast push target by
 * language (supabase/schema.sql's users.language). Called from the
 * language switcher (app/(tabs)/profile.tsx), not from syncUser(), so a
 * language change takes effect immediately rather than waiting for the
 * next sign-in/plan sync.
 */
export function syncUserLanguage(userId: string, language: 'az' | 'en'): void {
  if (!isSupabaseConfigured || !supabase) return;
  if (!isSyncableUserId(userId)) return;
  supabase
    .from('users')
    .update({ language, updated_at: new Date().toISOString(), last_seen_at: new Date().toISOString() })
    .eq('id', userId)
    .then(({ error }) => {
      if (error) console.warn('syncUserLanguage failed:', error.message);
    });
}

export type RemoteAccountState = {
  plan: User['plan'];
  premiumExpiresAt: string | null;
  claimedAchievements: number[];
  banned: boolean;
  banReason: string | null;
};

/**
 * Reads back the `users` row's plan/achievement state — the admin panel
 * writes `plan` directly, so this is the only way a plan change made from
 * the admin panel (rather than from this device's own purchase flow) ever
 * reaches the app. premium_expires_at/claimed_achievements round-trip
 * through here too so an achievement-granted Premium survives sign-out —
 * before this, those two only ever lived in local AsyncStorage, so signing
 * back in reset them to null/[] and let the same tier be re-claimed, or
 * left an already-granted Premium with no expiry to ever clear it. Same
 * scope as syncUser.
 */
export async function fetchRemoteAccountState(userId: string): Promise<RemoteAccountState | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  if (!isSyncableUserId(userId)) return null;

  const { data, error } = await supabase
    .from('users')
    .select('plan, premium_expires_at, claimed_achievements, banned, ban_reason')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    plan: data.plan as User['plan'],
    premiumExpiresAt: data.premium_expires_at ?? null,
    claimedAchievements: data.claimed_achievements ?? [],
    banned: data.banned ?? false,
    banReason: data.ban_reason ?? null,
  };
}

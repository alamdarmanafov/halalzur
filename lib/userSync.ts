import { User } from './types';
import { supabase, isSupabaseConfigured } from './supabase';

/**
 * A stable per-account id — Apple ('apple-...') or Google ('google-...')
 * sign-in. Email/password sign-in is still auth-context.tsx's demo-only
 * stub, which hands every such user the id 'local-user', so syncing those
 * would just overwrite one row instead of listing real people.
 */
function isSyncableUserId(id: string): boolean {
  return id.startsWith('apple-') || id.startsWith('google-');
}

/**
 * Backs the admin panel's "İstifadəçilər" list. See supabase/schema.sql's
 * `users` table comment for the email/password scope caveat.
 */
export async function syncUser(user: User): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  if (!isSyncableUserId(user.id)) return;

  await supabase.from('users').upsert(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      premium_expires_at: user.premiumExpiresAt,
      claimed_achievements: user.claimedAchievements,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );
}

export type RemoteAccountState = {
  plan: User['plan'];
  premiumExpiresAt: string | null;
  claimedAchievements: number[];
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
    .select('plan, premium_expires_at, claimed_achievements')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    plan: data.plan as User['plan'],
    premiumExpiresAt: data.premium_expires_at ?? null,
    claimedAchievements: data.claimed_achievements ?? [],
  };
}

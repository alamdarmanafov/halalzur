import { User } from './types';
import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Backs the admin panel's "İstifadəçilər" list. Scoped to Apple Sign-In
 * users only — email/password sign-in is still auth-context.tsx's
 * demo-only stub, which hands every such user the id 'local-user', so
 * syncing those here would just overwrite one row instead of listing
 * real people. See supabase/schema.sql's `users` table comment.
 */
export async function syncUser(user: User): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  if (!user.id.startsWith('apple-')) return;

  await supabase.from('users').upsert(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );
}

/**
 * Reads back whatever plan the `users` row currently has — the admin panel
 * writes there directly, so this is the only way a plan change made from
 * the admin panel (rather than from this device's own purchase flow) ever
 * reaches the app. Same Apple-only scope as syncUser.
 */
export async function fetchRemotePlan(userId: string): Promise<User['plan'] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  if (!userId.startsWith('apple-')) return null;

  const { data, error } = await supabase
    .from('users')
    .select('plan')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data.plan as User['plan'];
}

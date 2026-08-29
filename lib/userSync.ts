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

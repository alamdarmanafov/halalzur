import { User } from './types';

/**
 * Client-side only — see the security caveat in supabase/schema.sql above
 * product_submissions. This gates the *screen*, not the data: Supabase RLS
 * currently lets any anon-key request update product_submissions, so this
 * is not real access control, just keeps the admin UI out of normal users'
 * way until real auth exists.
 */
export const ADMIN_EMAIL = 'alamdarmanafov@gmail.com';

export function isAdmin(user: User | null): boolean {
  return !!user && user.email.toLowerCase() === ADMIN_EMAIL;
}

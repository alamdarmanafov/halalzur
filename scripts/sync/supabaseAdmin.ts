import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

/**
 * Admin client for the sync job only. Uses the SERVICE_ROLE key, which
 * bypasses Row Level Security — this must run server-side / on your own
 * machine, NEVER inside the Expo app (that's why this whole scripts/
 * folder is never imported from app/ or lib/, and Metro never bundles it).
 *
 * Put SUPABASE_SERVICE_ROLE_KEY in your local .env (no EXPO_PUBLIC_
 * prefix — that prefix is exactly what tells Expo to inline a var into
 * the shipped app bundle, so leaving it off keeps this key off the phone).
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env. ' +
      'Get the service_role key from Supabase → Project Settings → API Keys (keep it secret).'
  );
}

export const supabaseAdmin = createClient(url, serviceRoleKey);

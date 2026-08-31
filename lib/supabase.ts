import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

/**
 * Public/anon-key client only — this key is meant to be embedded in the
 * app and is safe to ship, as long as Row Level Security policies in
 * Supabase only grant it read access (see supabase/schema.sql). Never put
 * the service_role key here; that one stays on the scraper/server side.
 *
 * Apple/Google sign-in don't use supabase.auth at all (auth-context.tsx
 * manages its own local User object) — the `auth` config here only backs
 * real email/password accounts (supabase.auth.signUp/signInWithPassword),
 * so the session survives an app restart.
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

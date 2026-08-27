import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

/**
 * Public/anon-key client only — this key is meant to be embedded in the
 * app and is safe to ship, as long as Row Level Security policies in
 * Supabase only grant it read access (see supabase/schema.sql). Never put
 * the service_role key here; that one stays on the scraper/server side.
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

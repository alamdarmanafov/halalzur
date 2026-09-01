import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from './supabase';

const LAST_SEEN_KEY = 'halalzur.lastSeenVersion';

export type AppVersionInfo = {
  version: string;
  releaseNotes: string;
};

/**
 * Reads supabase/schema.sql's app_versions (the admin panel's own "Versiya
 * tarixçəsi" writes here) and, if the most recent row's version differs
 * from what this device last saw, returns it so app/_layout.tsx can show
 * a one-time "Nə yenilər var?" screen. Never shows on a device's very
 * first launch (nothing stored yet to compare against) — only on a real
 * version change.
 */
export async function checkForNewVersion(): Promise<AppVersionInfo | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from('app_versions')
    .select('version, release_notes')
    .order('released_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const lastSeen = await AsyncStorage.getItem(LAST_SEEN_KEY);
  if (lastSeen === null) {
    // First launch ever — nothing to compare against, just record it.
    await AsyncStorage.setItem(LAST_SEEN_KEY, data.version);
    return null;
  }
  if (lastSeen === data.version) return null;

  return { version: data.version, releaseNotes: data.release_notes };
}

export async function markVersionSeen(version: string): Promise<void> {
  await AsyncStorage.setItem(LAST_SEEN_KEY, version);
}

import { CertificationResult } from './types';
import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Fire-and-forget usage log for the admin panel's Dashboard (scan counts
 * by day/week/month/year) — not read by the app itself, so a failure here
 * should never block or surface to the scanning user.
 */
export async function logScanEvent(result: CertificationResult): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('scan_events').insert({ barcode: result.barcode, status: result.status });
  } catch {
    // best-effort only
  }
}

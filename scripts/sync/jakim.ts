import { SyncedEntry } from './types';

/**
 * ⚠️ NOT IMPLEMENTED YET.
 *
 * JAKIM's MyeHalal portal (https://myehalal.halal.gov.my/portal-halal/v1/)
 * is a public search UI with real product-level records, but we haven't
 * been able to inspect how it actually serves data — this sandbox's
 * network egress is policy-blocked from reaching it, so this is
 * unresearched, not just unimplemented.
 *
 * To wire this up for real, someone with browser access needs to:
 *   1. Open the portal, run a search, and check the browser's Network tab
 *      for the request the search form fires (likely a JSON endpoint —
 *      that's the easiest path) vs. server-rendered HTML (needs a proper
 *      HTML parser and possibly a headless browser if it's JS-rendered).
 *   2. Check robots.txt / terms of use before scraping at all.
 *   3. Replace this stub with a real fetch + parse, shaped like
 *      gimdes.ts's fetchGimdesEntries().
 */
export async function fetchJakimEntries(): Promise<SyncedEntry[]> {
  console.warn('[jakim] skipped — not implemented yet, see scripts/sync/jakim.ts');
  return [];
}

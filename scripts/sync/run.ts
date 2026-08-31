import { supabaseAdmin } from './supabaseAdmin';
import { fetchGimdesEntries } from './gimdes';
import { fetchJakimEntries } from './jakim';
import { fetchOpenFoodFactsEntries } from './openFoodFacts';
import { SyncedEntry } from './types';

const isDryRun = process.argv.includes('--dry-run');
const skipOpenFoodFacts = process.argv.includes('--skip-off');
const offLimitArg = process.argv.find((a: string) => a.startsWith('--off-limit='));
const offLimit = offLimitArg ? parseInt(offLimitArg.split('=')[1], 10) : 12000;

async function syncCertifier(certifierId: string, entries: SyncedEntry[]) {
  console.log(`[${certifierId}] parsed ${entries.length} entries`);

  if (entries.length === 0) {
    console.log(`[${certifierId}] nothing to sync, skipping`);
    return;
  }

  if (isDryRun) {
    console.log(`[${certifierId}] --dry-run: first 10 parsed entries —`);
    console.table(entries.slice(0, 10).map((e) => ({ brand: e.brand, status: e.status })));
    console.log(`[${certifierId}] --dry-run: not writing to Supabase.`);
    return;
  }

  // Full refresh: each certifier's published list is a complete snapshot,
  // not an incremental feed, so replace rather than diff/upsert.
  const { error: deleteError } = await supabaseAdmin
    .from('certified_entries')
    .delete()
    .eq('certifier_id', certifierId);
  if (deleteError) throw new Error(`[${certifierId}] delete failed: ${deleteError.message}`);

  const { error: insertError } = await supabaseAdmin.from('certified_entries').insert(entries);
  if (insertError) throw new Error(`[${certifierId}] insert failed: ${insertError.message}`);

  const { error: syncedAtError } = await supabaseAdmin
    .from('certifiers')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('id', certifierId);
  if (syncedAtError) {
    console.warn(`[${certifierId}] couldn't update last_synced_at: ${syncedAtError.message}`);
  }

  console.log(`[${certifierId}] wrote ${entries.length} entries`);
}

/**
 * Unlike syncCertifier's full-refresh (a certifier's list is a complete
 * snapshot), this is additive: Open Food Facts isn't a certifier and must
 * never overwrite a real certification (or an earlier OFF import) for a
 * barcode that already has a row, so each entry is upserted with
 * onConflict: 'barcode' + ignoreDuplicates — that leans on the database's
 * own unique index (idx_certified_entries_barcode_unique, see
 * supabase/schema.sql) to decide "already exists", which is atomic and
 * correct at any batch size. An earlier version pre-checked existing
 * barcodes with a single big `.in(barcode, [...])` lookup before a plain
 * insert — with thousands of barcodes in one query that silently missed
 * some matches often enough to write real duplicate rows.
 */
async function syncOpenFoodFacts(maxEntries: number) {
  console.log(`\n[openfoodfacts] fetching up to ${maxEntries} products (this can take a while)…`);
  const entries = await fetchOpenFoodFactsEntries(maxEntries);
  console.log(`[openfoodfacts] fetched ${entries.length} candidate products`);

  if (entries.length === 0) {
    console.log('[openfoodfacts] nothing to sync, skipping');
    return;
  }

  if (isDryRun) {
    console.log('[openfoodfacts] --dry-run: first 10 parsed entries —');
    console.table(entries.slice(0, 10).map((e) => ({ barcode: e.barcode, brand: e.brand, name: e.product_name })));
    console.log('[openfoodfacts] --dry-run: not writing to Supabase.');
    return;
  }

  const BATCH_SIZE = 500;
  let written = 0;
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    const { error, count } = await supabaseAdmin
      .from('certified_entries')
      .upsert(batch, { onConflict: 'barcode', ignoreDuplicates: true, count: 'exact' });
    if (error) throw new Error(`[openfoodfacts] upsert failed: ${error.message}`);
    written += count ?? 0;
  }

  console.log(`[openfoodfacts] wrote ${written} new products (${entries.length - written} already existed)`);
}

async function main() {
  if (isDryRun) console.log('Running in --dry-run mode: parsing only, no writes.\n');

  const gimdesEntries = await fetchGimdesEntries();
  await syncCertifier('gimdes', gimdesEntries);

  const jakimEntries = await fetchJakimEntries();
  await syncCertifier('jakim', jakimEntries);

  if (!skipOpenFoodFacts) {
    await syncOpenFoodFacts(offLimit);
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});

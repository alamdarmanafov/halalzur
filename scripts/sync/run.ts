import { supabaseAdmin } from './supabaseAdmin';
import { fetchGimdesEntries } from './gimdes';
import { fetchJakimEntries } from './jakim';
import { SyncedEntry } from './types';

const isDryRun = process.argv.includes('--dry-run');

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

async function main() {
  if (isDryRun) console.log('Running in --dry-run mode: parsing only, no writes.\n');

  const gimdesEntries = await fetchGimdesEntries();
  await syncCertifier('gimdes', gimdesEntries);

  const jakimEntries = await fetchJakimEntries();
  await syncCertifier('jakim', jakimEntries);

  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});

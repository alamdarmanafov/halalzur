import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Named ingredients (not E-codes) that are haram or source-dependent,
 * for when a product's ingredient text spells them out by name instead
 * of an E-number — the existing E-code regex (lib/eCodes.ts) never sees
 * "gelatin" or "donuz yağı" written as plain words, so this is a
 * separate, additive scan over the same ingredient text.
 *
 * Deliberately conservative: only items that are either unambiguous
 * (pork/wine/spirits, or an insect-derived colorant matching E120's own
 * "haram" status) go in the "haram" bucket. Anything whose actual source
 * can't be told from the name alone (gelatin, rennet, pepperoni) is
 * "mushbooh" — same "yellow, not a verdict, needs a real ingredient
 * check" meaning as an E-code marked "depends" elsewhere in this app.
 *
 * This is a starting list, not exhaustive — admins can add more via the
 * admin panel's "Açar sözlər" section (custom_ecodes' additive pattern:
 * these hardcoded entries stay fixed, admin additions merge in via
 * loadCustomHaramKeywords()).
 */
export type HaramKeywordStatus = 'haram' | 'mushbooh';

export type HaramKeywordEntry = {
  keyword: string;
  status: HaramKeywordStatus;
  note: string;
};

export const HARAM_KEYWORDS: HaramKeywordEntry[] = [
  { keyword: 'donuz əti', status: 'haram', note: 'Donuz mənşəli ət.' },
  { keyword: 'domuz eti', status: 'haram', note: 'Donuz mənşəli ət (türk yazılışı).' },
  { keyword: 'pork', status: 'haram', note: 'Donuz mənşəli ət.' },
  { keyword: 'donuz yağı', status: 'haram', note: 'Donuz mənşəli piy.' },
  { keyword: 'domuz yağı', status: 'haram', note: 'Donuz mənşəli piy (türk yazılışı).' },
  { keyword: 'lard', status: 'haram', note: 'Donuz mənşəli piy.' },
  { keyword: 'bekon', status: 'haram', note: 'Adətən donuz mənşəlidir.' },
  { keyword: 'bacon', status: 'haram', note: 'Adətən donuz mənşəlidir.' },
  { keyword: 'hamon', status: 'haram', note: 'Adətən donuz mənşəli hazır ətdir.' },
  { keyword: 'jambon', status: 'haram', note: 'Adətən donuz mənşəli hazır ətdir.' },
  { keyword: 'prosciutto', status: 'haram', note: 'Donuz mənşəli hazır ət.' },
  { keyword: 'şərab', status: 'haram', note: 'Spirtli içki.' },
  { keyword: 'şarap', status: 'haram', note: 'Spirtli içki (türk yazılışı).' },
  { keyword: 'wine', status: 'haram', note: 'Spirtli içki.' },
  { keyword: 'konyak', status: 'haram', note: 'Spirtli içki (distillə edilmiş).' },
  { keyword: 'cognac', status: 'haram', note: 'Spirtli içki (distillə edilmiş).' },
  { keyword: 'viski', status: 'haram', note: 'Spirtli içki (distillə edilmiş).' },
  { keyword: 'whisky', status: 'haram', note: 'Spirtli içki (distillə edilmiş).' },
  { keyword: 'karmin', status: 'haram', note: 'Həşərat mənşəli qırmızı rəngləyici (bax: E120).' },
  { keyword: 'koşenil', status: 'haram', note: 'Həşərat mənşəli qırmızı rəngləyici (bax: E120).' },
  { keyword: 'cochineal', status: 'haram', note: 'Həşərat mənşəli qırmızı rəngləyici (bax: E120).' },
  { keyword: 'jelatin', status: 'mushbooh', note: 'Mənbəyi (mal/balıq = halal, donuz = haram) etiketdən görünmür.' },
  { keyword: 'gelatin', status: 'mushbooh', note: 'Mənbəyi (mal/balıq = halal, donuz = haram) etiketdən görünmür.' },
  { keyword: 'peynir mayası', status: 'mushbooh', note: 'Heyvan mənşəli maya ola bilər — mənbəyi etiketdən görünmür.' },
  { keyword: 'rennet', status: 'mushbooh', note: 'Heyvan mənşəli maya ola bilər — mənbəyi etiketdən görünmür.' },
  { keyword: 'pepperoni', status: 'mushbooh', note: 'Adətən donuz, bəzən mal əti — mənbəyi etiketdən görünmür.' },
];

export const EXTRA_HARAM_KEYWORDS: HaramKeywordEntry[] = [];

export async function loadCustomHaramKeywords(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const { data, error } = await supabase.from('haram_keywords').select('keyword, status, note');
  if (error || !data) return;
  EXTRA_HARAM_KEYWORDS.length = 0;
  EXTRA_HARAM_KEYWORDS.push(
    ...data.map((row) => ({
      keyword: row.keyword as string,
      status: row.status as HaramKeywordStatus,
      note: (row.note as string) || '',
    }))
  );
}

function allKeywords(): HaramKeywordEntry[] {
  return EXTRA_HARAM_KEYWORDS.length ? [...HARAM_KEYWORDS, ...EXTRA_HARAM_KEYWORDS] : HARAM_KEYWORDS;
}

export type HaramKeywordMatch = { keyword: string; status: HaramKeywordStatus; note: string };

// Latin letters plus the Azerbaijani/Turkish accented letters actually
// used in these keywords — used to approximate a word boundary, since
// JS's \b is ASCII-only and would fail on "əti"/"yağı" etc.
const WORD_CHARS = 'a-zA-ZəıöüşçğƏIİÖÜŞÇĞ';

/** Scans free-text ingredient lists for named (non-E-code) haram/mushbooh items. */
export function extractHaramKeywords(text: string): HaramKeywordMatch[] {
  if (!text) return [];
  const matches: HaramKeywordMatch[] = [];
  const seen = new Set<string>();
  allKeywords().forEach((entry) => {
    const escaped = entry.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp('(^|[^' + WORD_CHARS + '])' + escaped + '($|[^' + WORD_CHARS + '])', 'i');
    const key = entry.keyword.toLowerCase();
    if (!seen.has(key) && re.test(text)) {
      seen.add(key);
      matches.push({ keyword: entry.keyword, status: entry.status, note: entry.note });
    }
  });
  return matches;
}

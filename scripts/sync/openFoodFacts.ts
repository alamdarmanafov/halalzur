import { SyncedEntry } from './types';

/**
 * Pulls a broad set of real-world barcoded products (name, brand,
 * ingredients) from Open Food Facts — a free, keyless, open-license
 * (ODbL) global product database — so the app has wide barcode coverage
 * without anyone physically scanning products in stores (which most
 * markets won't allow anyway, and doesn't scale to thousands of items).
 *
 * Every entry lands with status 'unknown': Open Food Facts has no concept
 * of halal certification, so none of this is a halal claim — it's just
 * enough product/ingredient data for the app's existing E-code breakdown
 * to work on a scan that isn't otherwise in the database, and for a real
 * halal status to come from either a certifier sync (gimdes.ts/jakim.ts)
 * or a user submission once someone actually verifies it.
 */

const USER_AGENT = 'Halalzur/1.0 (+https://halalzur.app; contact: alamdarmanafov@gmail.com)';
const PAGE_SIZE = 100;
const PAGES_PER_QUERY = 5; // 500 products per category/country combination, at most

// Food categories likely to matter to a halal-conscious shopper, mapped to
// the app's own PRODUCT_CATEGORIES (lib/categories.ts) so imported products
// land in the same category chips/filters as manually added ones — using
// the query slug directly is far more reliable than parsing Open Food
// Facts' own (often non-Azerbaijani, sometimes non-English) category tags.
const CATEGORY_LABELS: Record<string, string> = {
  confectioneries: 'Şirniyyat',
  chocolates: 'Şirniyyat',
  'biscuits-and-cakes': 'Şirniyyat',
  'chewing-gums': 'Şirniyyat',
  honeys: 'Şirniyyat',
  dairies: 'Süd məhsulları',
  cheeses: 'Süd məhsulları',
  yogurts: 'Süd məhsulları',
  beverages: 'İçki',
  coffees: 'İçki',
  teas: 'İçki',
  waters: 'İçki',
  'fruit-juices': 'İçki',
  sodas: 'İçki',
  meats: 'Ət məhsulları',
  snacks: 'Qəlyanaltılar',
  'chips-and-fries': 'Qəlyanaltılar',
  nuts: 'Qəlyanaltılar',
  'dried-fruits': 'Qəlyanaltılar',
  'breakfast-cereals': 'Dənli məhsullar',
  sauces: 'Souslar',
  condiments: 'Souslar',
  spreads: 'Souslar',
  'canned-foods': 'Konservlər',
  'canned-vegetables': 'Konservlər',
  'canned-fish': 'Konservlər',
  soups: 'Konservlər',
  'frozen-foods': 'Dondurulmuş məhsullar',
  'ice-creams': 'Dondurulmuş məhsullar',
  meals: 'Dondurulmuş məhsullar',
  'baby-foods': 'Uşaq qidası',
  pastas: 'Makaron və düyü',
  rices: 'Makaron və düyü',
  'oils-and-fats': 'Yağlar',
  spices: 'Ədviyyat',
};

const CATEGORIES = Object.keys(CATEGORY_LABELS);

// Biases results toward products that actually show up in Azerbaijani
// markets (Turkish/Russian imports dominate, with Georgia/Ukraine/Iran as
// land-border neighbors and Germany/Poland as common EU-import sources)
// rather than a random global sample — Open Food Facts has very little
// Azerbaijan-tagged data itself.
const COUNTRIES = [
  'turkey',
  'russia',
  'azerbaijan',
  'united-arab-emirates',
  'georgia',
  'ukraine',
  'iran',
  'germany',
  'poland',
];

type OffProduct = {
  code?: string;
  product_name?: string;
  brands?: string;
  ingredients_text?: string;
  image_front_url?: string;
};

type OffSearchResponse = {
  count: number;
  page: number;
  page_size: number;
  products: OffProduct[];
};

function splitIngredients(text: string): string[] {
  return text
    .split(/[,;]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

async function fetchCategoryPage(
  category: string,
  country: string,
  page: number
): Promise<OffSearchResponse | null> {
  const url = new URL('https://world.openfoodfacts.org/api/v2/search');
  url.searchParams.set('categories_tags_en', category);
  url.searchParams.set('countries_tags_en', country);
  url.searchParams.set('fields', 'code,product_name,brands,ingredients_text,image_front_url');
  url.searchParams.set('page_size', String(PAGE_SIZE));
  url.searchParams.set('page', String(page));

  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) return null;
  return res.json();
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type OffSkipCounts = { noCode: number; noName: number; duplicate: number };

export type OffFetchResult = { entries: SyncedEntry[]; skipped: OffSkipCounts };

export async function fetchOpenFoodFactsEntries(maxEntries: number): Promise<OffFetchResult> {
  const seen = new Map<string, SyncedEntry>();
  const skipped: OffSkipCounts = { noCode: 0, noName: 0, duplicate: 0 };

  outer: for (const country of COUNTRIES) {
    for (const category of CATEGORIES) {
      for (let page = 1; page <= PAGES_PER_QUERY; page++) {
        if (seen.size >= maxEntries) break outer;

        const data = await fetchCategoryPage(category, country, page);
        // Being polite to a free, shared, keyless API — well under OFF's
        // own rate-limit guidance for the search endpoint.
        await sleep(1500);
        if (!data || data.products.length === 0) break;

        for (const p of data.products) {
          if (seen.size >= maxEntries) break;
          if (!p.code) {
            skipped.noCode++;
            continue;
          }
          if (!p.product_name) {
            skipped.noName++;
            continue;
          }
          if (seen.has(p.code)) {
            skipped.duplicate++;
            continue;
          }
          seen.set(p.code, {
            entry_type: 'product',
            barcode: p.code,
            product_name: p.product_name.trim(),
            brand: p.brands?.split(',')[0]?.trim() || 'Naməlum',
            category: CATEGORY_LABELS[category] ?? null,
            status: 'unknown',
            certifier_id: 'openfoodfacts',
            certificate_number: null,
            verified_at: null,
            ingredients: splitIngredients(p.ingredients_text || ''),
            notes: 'Open Food Facts açıq bazasından idxal edilib — halal statusu hələ yoxlanılmayıb.',
            image_url: p.image_front_url || null,
            source_url: `https://world.openfoodfacts.org/product/${p.code}`,
          });
        }

        if (data.products.length < PAGE_SIZE) break; // last page for this query
      }
    }
  }

  return { entries: Array.from(seen.values()), skipped };
}

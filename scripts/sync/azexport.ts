import { SyncedEntry } from './types';

/**
 * Pulls real Azerbaijani-market food products (name, barcode, brand,
 * image) from azexport.az — AZPROMO's B2B export directory. Unlike Open
 * Food Facts (which has almost no genuine Azerbaijan-tagged data),
 * azexport.az lists actual Azerbaijani manufacturers' products with real
 * GTIN/EAN barcodes, so this is the better source for "scan a locally-made
 * product and actually get a match" coverage.
 *
 * The site (Laravel + Aimeos) server-renders product/category pages as
 * plain HTML with the data embedded directly — no JS rendering needed, a
 * plain fetch() gets the same markup a browser would. Parsing is regex-
 * based rather than a full HTML parser (no new dependency) since the
 * markup around each field is stable and distinctive enough.
 *
 * Every entry lands with status 'unknown', same as the Open Food Facts
 * import: azexport.az has no concept of halal certification either. The
 * "Məlumat" field on a product page is marketing copy, not a clean
 * ingredient list — parsing it into an ingredients[] array the way OFF's
 * ingredients_text is split would produce garbage, so ingredients is left
 * empty here. An admin can still run the existing "AI ilə tap" ingredient
 * lookup per product from the admin panel afterward.
 */

const BASE = 'https://azexport.az';
const USER_AGENT = 'Halalzur/1.0 (+https://halalzur.com; contact: alamdarmanafov@gmail.com)';
const MAX_PAGES_PER_CATEGORY = 60; // covers every category seen so far (worst case ~52 pages)

// Azerbaijani food/drink category ids, taken directly from azexport.az's
// own "Kənd təsərrüfatı & Ərzaq" mega-menu (Qida və içki, id 36, and its
// children) — crawling by category, not by brute-forcing /mehsul/<id>,
// since ids are shared across the whole site (electronics, furniture,
// etc. included) and food is a small fraction of it.
//
// Mapped to the app's own PRODUCT_CATEGORIES (lib/categories.ts) where a
// clear match exists; `null` categories still get imported (barcode
// coverage matters more than the category chip), just uncategorized.
const AZEXPORT_FOOD_CATEGORIES: Record<number, string | null> = {
  37: 'İçki', // Alkoqol içkilər
  38: 'Uşaq qidası',
  39: 'Çörək', // Un məmulatları
  40: 'Dənli məhsullar', // Taxıl məhsulları
  41: null, // Meyvə məhsulları
  42: null, // Qida maddələri
  43: null, // Yumurta və yumurta məhsulları
  44: 'İçki', // İçməli su
  45: 'Süd məhsulları',
  46: 'Şirniyyat',
  47: 'İçki', // Qəhvə
  48: 'Konservlər', // Konservləşdirilmiş məhsullar
  49: null, // Paxla məhsulları
  50: null, // Arıqlamaq üçün qida
  51: 'Ədviyyat', // Ədviyyat və dadverici əlavələr
  52: null, // Dəniz məhsulları
  53: null, // Digər qida və içki
  54: null, // Tez hazırlanan qidalar
  55: 'Şirniyyat', // Bal məhsulları
  1147: 'İçki', // Çay
  1177: 'Ət məhsulları', // Ət və ət məhsulları
  1188: 'Şirniyyat', // Cem
  1189: 'Souslar', // Ketçup
  1190: 'Souslar', // Tomat pastası
  1212: 'İçki', // Kampot
  1225: 'Dənli məhsullar', // Səhər yeməkləri
  1226: 'Qəlyanaltılar', // Şişirdilmiş şirin qarğıdalı
  1227: 'Şirniyyat', // Kozinaki
  1228: 'Qəlyanaltılar', // Çərəz
  1229: 'Qəlyanaltılar', // Suxari
};

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function collectProductIds(categoryHtml: string): number[] {
  const ids = new Set<number>();
  for (const m of categoryHtml.matchAll(/\/mehsul\/(\d+)/g)) {
    ids.add(parseInt(m[1], 10));
  }
  return Array.from(ids);
}

function extractField(html: string, pattern: RegExp): string | null {
  const m = html.match(pattern);
  return m ? m[1].trim() : null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function parseProductPage(html: string, productUrl: string): Omit<SyncedEntry, 'category'> | null {
  const barcode = extractField(html, /Məhsulun kodu:\s*(\d+)/);
  if (!barcode) return null;

  const name = extractField(
    html,
    /<h1 class="hidden sm:block text-black text-\[28px\] font-bold mb-1">([^<]+)<\/h1>/
  );
  if (!name) return null;

  const brand = extractField(html, /Brend:<\/span>\s*([^<]+)<\/span>/);
  const description = extractField(html, /Məlumat:<p class="font-normal mt-2">([\s\S]*?)<\/p>/);
  const image = extractField(html, /src="(https:\/\/azexport\.az\/uploads\/[^"]+)"/);

  return {
    entry_type: 'product',
    barcode,
    product_name: decodeEntities(name),
    brand: brand ? decodeEntities(brand) : 'Naməlum',
    status: 'unknown',
    certifier_id: 'azexport',
    certificate_number: null,
    verified_at: null,
    ingredients: [],
    notes: description
      ? `AzExport.az-dan idxal edilib — halal statusu hələ yoxlanılmayıb. Təsvir: ${decodeEntities(description)}`
      : 'AzExport.az-dan idxal edilib — halal statusu hələ yoxlanılmayıb.',
    image_url: image,
    source_url: productUrl,
  };
}

export type AzexportSkipCounts = { noBarcode: number; noName: number; duplicate: number; fetchFailed: number };

export type AzexportFetchResult = { entries: SyncedEntry[]; skipped: AzexportSkipCounts };

export async function fetchAzexportEntries(maxEntries: number): Promise<AzexportFetchResult> {
  const seen = new Map<string, SyncedEntry>();
  const skipped: AzexportSkipCounts = { noBarcode: 0, noName: 0, duplicate: 0, fetchFailed: 0 };
  // A product can appear on more than one category's listing (azexport
  // shows "similar products" from other categories too) — the first
  // category it's found under wins, since that's the one it was actually
  // filed in.
  const productCategory = new Map<number, string | null>();

  outerCategories: for (const [categoryId, categoryLabel] of Object.entries(AZEXPORT_FOOD_CATEGORIES)) {
    for (let page = 1; page <= MAX_PAGES_PER_CATEGORY; page++) {
      if (productCategory.size >= maxEntries) break outerCategories;

      const url = `${BASE}/kateqoriya/${categoryId}?page=${page}`;
      const html = await fetchPage(url);
      await sleep(800); // polite delay — this isn't a documented public API
      if (!html) break;

      const ids = collectProductIds(html);
      if (ids.length === 0) break; // no more pages for this category

      let newOnThisPage = 0;
      for (const id of ids) {
        if (!productCategory.has(id)) {
          productCategory.set(id, categoryLabel);
          newOnThisPage++;
        }
      }
      // Category listing pages repeat "similar products" from other
      // categories too — once a page contributes nothing new, later pages
      // won't either (products are listed in a stable, non-random order).
      if (newOnThisPage === 0) break;
    }
  }

  outerProducts: for (const [id, categoryLabel] of productCategory) {
    if (seen.size >= maxEntries) break outerProducts;
    const productUrl = `${BASE}/mehsul/${id}`;
    const html = await fetchPage(productUrl);
    await sleep(500);
    if (!html) {
      skipped.fetchFailed++;
      continue;
    }

    const parsed = parseProductPage(html, productUrl);
    if (!parsed) {
      // Distinguish "no barcode" from "no name" for the summary — re-check
      // which one was actually missing.
      if (!extractField(html, /Məhsulun kodu:\s*(\d+)/)) skipped.noBarcode++;
      else skipped.noName++;
      continue;
    }
    if (seen.has(parsed.barcode!)) {
      skipped.duplicate++;
      continue;
    }

    seen.set(parsed.barcode!, { ...parsed, category: categoryLabel });
  }

  return { entries: Array.from(seen.values()), skipped };
}

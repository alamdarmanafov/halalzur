import { CertificationResult, Certifier } from './types';
import { getCertifier } from './certifiers';
import { supabase, isSupabaseConfigured } from './supabase';
import { lookupOpenFoodFacts } from './openFoodFacts';
import { lookupUpcItemDb } from './upcItemDb';
import { TranslationKey } from './i18n';

/**
 * Local demo/offline dataset — used only as a dev fallback while the
 * Supabase project (supabase/schema.sql) isn't configured yet, or if a
 * request to it fails. Once EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY are set,
 * `lookupBarcode` and `searchProducts` query the real `certified_entries`
 * table (synced from GIMDES + JAKIM) first.
 */
const MOCK_DB: Record<string, CertificationResult> = {
  '8690504048068': {
    barcode: '8690504048068',
    productName: 'Fındık Kreması',
    brand: 'Örnek Gıda A.Ş.',
    category: 'Şirniyyat',
    status: 'halal',
    certifier: getCertifier('gimdes') ?? null,
    certificateNumber: 'GIMDES-2024-11832',
    verifiedAt: '2026-02-14',
    ingredients: ['Şəkər', 'Fındıq', 'Bitki yağı', 'Kakao', 'Vanil'],
    notes: null,
    imageEmoji: '🍫',
  },
  '8690506042027': {
    barcode: '8690506042027',
    productName: 'Tam Buğday Ekmeği',
    brand: 'Anadolu Fırın',
    category: 'Çörək',
    status: 'halal',
    certifier: getCertifier('hak') ?? null,
    certificateNumber: 'HAK-TR-2025-0447',
    verifiedAt: '2026-05-02',
    ingredients: ['Un', 'Su', 'Maya', 'Duz'],
    notes: null,
    imageEmoji: '🍞',
  },
  '4006381333931': {
    barcode: '4006381333931',
    productName: 'Marshmallow Şəkərləmə',
    brand: 'Sweet Co.',
    category: 'Şirniyyat',
    status: 'haram',
    certifier: null,
    certificateNumber: null,
    verifiedAt: null,
    ingredients: ['Şəkər', 'Qlükoza siropu', 'Jelatin (E441)', 'Karmin (E120)'],
    notes: 'Tərkibdə mənbəyi təsdiqlənməmiş E441 (jelatin) var — donuz mənşəli ola bilər.',
    imageEmoji: '🍬',
  },
  '5449000000996': {
    barcode: '5449000000996',
    productName: 'Gazlı İçki',
    brand: 'Cola Co.',
    category: 'İçki',
    status: 'mushbooh',
    certifier: null,
    certificateNumber: null,
    verifiedAt: null,
    ingredients: ['Su', 'Şəkər', 'CO2', 'Karamel rəngi (E150d)', 'Fosfor turşusu'],
    notes: 'Bəzi əlavələrin mənşəyi hələ təsdiqlənməyib — ehtiyatlı olun.',
    imageEmoji: '🥤',
  },
};

const CATEGORY_EMOJI: Record<string, string> = {
  şirniyyat: '🍬',
  çörək: '🍞',
  içki: '🥤',
  ət: '🥩',
  süd: '🥛',
  qənnadı: '🍫',
};

function emojiForCategory(category: string | null): string {
  if (!category) return '🛒';
  return CATEGORY_EMOJI[category.trim().toLowerCase()] ?? '🛒';
}

type CertifiedEntryRow = {
  barcode: string | null;
  product_name: string | null;
  brand: string;
  category: string | null;
  status: CertificationResult['status'];
  certificate_number: string | null;
  verified_at: string | null;
  ingredients: string[] | null;
  notes: string | null;
  image_url: string | null;
  certifiers: {
    id: string;
    name: string;
    short_name: string;
    country: string;
    source_url: string | null;
  } | null;
};

function mapRowToResult(row: CertifiedEntryRow, fallbackBarcode: string): CertificationResult {
  const certifier: Certifier | null = row.certifiers
    ? {
        id: row.certifiers.id,
        name: row.certifiers.name,
        shortName: row.certifiers.short_name,
        country: row.certifiers.country,
        sourceUrl: row.certifiers.source_url,
      }
    : null;

  return {
    barcode: row.barcode ?? fallbackBarcode,
    productName: row.product_name ?? row.brand,
    brand: row.brand,
    category: row.category ?? '—',
    status: row.status,
    certifier,
    certificateNumber: row.certificate_number,
    verifiedAt: row.verified_at,
    ingredients: row.ingredients ?? [],
    notes: row.notes,
    imageEmoji: emojiForCategory(row.category),
    imageUrl: row.image_url,
  };
}

/** Open Food Facts first (better ingredient coverage), then UPCitemdb. */
async function lookupExternalFallback(barcode: string): Promise<CertificationResult | null> {
  return (await lookupOpenFoodFacts(barcode)) ?? (await lookupUpcItemDb(barcode));
}

const UNKNOWN_RESULT = (barcode: string): CertificationResult => ({
  barcode,
  productName: 'Naməlum məhsul',
  brand: '—',
  category: '—',
  status: 'unknown',
  certifier: null,
  certificateNumber: null,
  verifiedAt: null,
  ingredients: [],
  notes: 'Bu barkod hələ bazamızda yoxdur. Sertifikat orqanları ilə əlaqə yaradılır.',
  imageEmoji: '❓',
});

export async function lookupBarcode(barcode: string): Promise<CertificationResult> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('certified_entries')
      .select(
        'barcode, product_name, brand, category, status, certificate_number, verified_at, ingredients, notes, image_url, certifiers(id, name, short_name, country, source_url)'
      )
      .eq('barcode', barcode)
      .eq('entry_type', 'product')
      .is('deleted_at', null)
      .limit(1)
      .maybeSingle<CertifiedEntryRow>();

    if (!error) {
      if (data) return mapRowToResult(data, barcode);
      return (await lookupExternalFallback(barcode)) ?? UNKNOWN_RESULT(barcode);
    }
    console.warn('Supabase lookupBarcode failed, falling back to local data:', error.message);
  }

  await new Promise((resolve) => setTimeout(resolve, 900));
  if (MOCK_DB[barcode]) return MOCK_DB[barcode];
  return (await lookupExternalFallback(barcode)) ?? UNKNOWN_RESULT(barcode);
}

export async function searchProducts(query: string): Promise<CertificationResult[]> {
  const q = query.trim();

  if (isSupabaseConfigured && supabase) {
    let request = supabase
      .from('certified_entries')
      .select(
        'barcode, product_name, brand, category, status, certificate_number, verified_at, ingredients, notes, image_url, certifiers(id, name, short_name, country, source_url)'
      )
      .eq('entry_type', 'product')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(30);

    if (q) {
      const safe = q.replace(/[,()%]/g, '');
      // Substring match, not exact — an exact barcode.eq. match reports
      // "not found" whenever the typed/scanned digits and the stored
      // barcode differ by a leading zero (EAN-13 vs UPC-A — Open Food
      // Facts normalizes to 13 digits with a leading 0). Substring still
      // matches "12345678905" against a stored "012345678905".
      request = request.or(
        `brand.ilike.%${safe}%,product_name.ilike.%${safe}%,category.ilike.%${safe}%,barcode.ilike.%${safe}%`
      );
    }

    const { data, error } = await request.returns<CertifiedEntryRow[]>();
    if (!error) {
      return (data ?? []).map((row) => mapRowToResult(row, row.barcode ?? ''));
    }
    // A real query error must NOT silently substitute the demo dataset in
    // production — that showed users fictional products that don't exist
    // in the real database, looking like the app disagrees with the admin
    // panel. MOCK_DB stays below only for when Supabase isn't configured
    // at all (local dev before it's set up).
    console.warn('Supabase searchProducts failed:', error.message);
    return [];
  }

  await new Promise((resolve) => setTimeout(resolve, 300));
  const lower = q.toLowerCase();
  const all = Object.values(MOCK_DB);
  if (!lower) return all;
  return all.filter(
    (p) =>
      p.productName.toLowerCase().includes(lower) ||
      p.brand.toLowerCase().includes(lower) ||
      p.category.toLowerCase().includes(lower) ||
      p.barcode.includes(lower)
  );
}

/**
 * Premium's "Halal Alternatives" feature — up to 3 halal-status products
 * from the same category, offered when the scanned product came back
 * mushbooh/haram/unknown. MOCK_DB has no meaningful categories to browse,
 * so this is Supabase-only (empty result when it isn't configured).
 */
export async function getHalalAlternatives(
  category: string,
  excludeBarcode: string
): Promise<CertificationResult[]> {
  if (!isSupabaseConfigured || !supabase || !category || category === '—') return [];

  const safeCategory = category.replace(/[,()%]/g, '');
  const { data, error } = await supabase
    .from('certified_entries')
    .select(
      'barcode, product_name, brand, category, status, certificate_number, verified_at, ingredients, notes, image_url, certifiers(id, name, short_name, country, source_url)'
    )
    .eq('entry_type', 'product')
    .eq('status', 'halal')
    .is('deleted_at', null)
    .ilike('category', `%${safeCategory}%`)
    .neq('barcode', excludeBarcode)
    .limit(3)
    .returns<CertifiedEntryRow[]>();

  if (error) {
    console.warn('getHalalAlternatives failed:', error.message);
    return [];
  }
  return (data ?? []).map((row) => mapRowToResult(row, row.barcode ?? ''));
}

/**
 * Existing brand names already in certified_entries — powers the
 * product-submission form's brand picker (search existing, or type a new
 * one if it isn't there yet).
 */
export async function getDistinctBrands(): Promise<string[]> {
  if (!isSupabaseConfigured || !supabase) {
    return Array.from(new Set(Object.values(MOCK_DB).map((p) => p.brand))).sort();
  }
  const { data, error } = await supabase
    .from('certified_entries')
    .select('brand')
    .not('brand', 'is', null)
    .is('deleted_at', null)
    .limit(1000);
  if (error || !data) return [];
  return Array.from(new Set(data.map((r) => r.brand).filter(Boolean))).sort();
}

/**
 * Refreshes a set of barcodes against certified_entries in one query —
 * used by the Products tab to re-check status/category for whatever's in
 * local scan history, since history stores a frozen snapshot from scan
 * time and never otherwise learns about a later admin approval/status
 * change for the same barcode.
 */
export async function getManyByBarcode(barcodes: string[]): Promise<Record<string, CertificationResult>> {
  if (!isSupabaseConfigured || !supabase || barcodes.length === 0) return {};

  const { data, error } = await supabase
    .from('certified_entries')
    .select(
      'barcode, product_name, brand, category, status, certificate_number, verified_at, ingredients, notes, image_url, certifiers(id, name, short_name, country, source_url)'
    )
    .eq('entry_type', 'product')
    .is('deleted_at', null)
    .in('barcode', barcodes)
    .returns<CertifiedEntryRow[]>();

  if (error || !data) return {};
  const map: Record<string, CertificationResult> = {};
  data.forEach((row) => {
    if (row.barcode) map[row.barcode] = mapRowToResult(row, row.barcode);
  });
  return map;
}

type ProductRecommendCountRow = { barcode: string; recommend_count: number };

export type RecommendedProduct = CertificationResult & { recommendCount: number };

/**
 * Products.tsx's "Tövsiyə edilən" section — ranked by how many different
 * users tapped "Tövsiyə et" on the product detail screen (lib/
 * recommendations.ts), not an admin editorial pick like
 * certified_entries.featured. Reads the count from
 * product_recommend_counts (a view, see supabase/schema.sql) then
 * re-fetches full product rows via getManyByBarcode, since the view only
 * carries enough columns for the admin panel's own report.
 */
export async function getMostRecommendedProducts(limit: number): Promise<RecommendedProduct[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('product_recommend_counts')
    .select('barcode, recommend_count')
    .order('recommend_count', { ascending: false })
    .limit(limit)
    .returns<ProductRecommendCountRow[]>();

  if (error || !data || data.length === 0) return [];

  const byBarcode = await getManyByBarcode(data.map((row) => row.barcode));
  // getManyByBarcode returns an unordered map — re-apply the
  // recommend-count ranking order, and drop any barcode that no longer
  // resolves to a live product (soft-deleted since being recommended).
  return data
    .filter((row) => !!byBarcode[row.barcode])
    .map((row) => ({ ...byBarcode[row.barcode], recommendCount: row.recommend_count }));
}

export function getAllProducts(): CertificationResult[] {
  return Object.values(MOCK_DB);
}

export function getProductByBarcode(barcode: string): CertificationResult | undefined {
  return MOCK_DB[barcode];
}

// Badge text keys — see StatusBadge.tsx for why 'unknown' reads the same as
// 'mushbooh' ("şübhəli") while 'haram' gets its own, stronger wording.
export const STATUS_LABEL_KEY: Record<CertificationResult['status'], TranslationKey> = {
  halal: 'statusLabelHalal',
  haram: 'statusLabelHaram',
  mushbooh: 'statusLabelMushbooh',
  unknown: 'statusLabelMushbooh',
};

export const STATUS_DESC_KEY: Record<CertificationResult['status'], TranslationKey> = {
  halal: 'statusDescHalal',
  haram: 'statusDescHaram',
  mushbooh: 'statusDescMushbooh',
  unknown: 'statusDescMushbooh',
};

import { CertificationResult, Certifier } from './types';
import { getCertifier } from './certifiers';
import { supabase, isSupabaseConfigured } from './supabase';

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
  certifiers: {
    id: string;
    name: string;
    short_name: string;
    country: string;
  } | null;
};

function mapRowToResult(row: CertifiedEntryRow, fallbackBarcode: string): CertificationResult {
  const certifier: Certifier | null = row.certifiers
    ? {
        id: row.certifiers.id,
        name: row.certifiers.name,
        shortName: row.certifiers.short_name,
        country: row.certifiers.country,
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
  };
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
        'barcode, product_name, brand, category, status, certificate_number, verified_at, ingredients, notes, certifiers(id, name, short_name, country)'
      )
      .eq('barcode', barcode)
      .eq('entry_type', 'product')
      .limit(1)
      .maybeSingle<CertifiedEntryRow>();

    if (!error) {
      return data ? mapRowToResult(data, barcode) : UNKNOWN_RESULT(barcode);
    }
    console.warn('Supabase lookupBarcode failed, falling back to local data:', error.message);
  }

  await new Promise((resolve) => setTimeout(resolve, 900));
  return MOCK_DB[barcode] ?? UNKNOWN_RESULT(barcode);
}

export async function searchProducts(query: string): Promise<CertificationResult[]> {
  const q = query.trim();

  if (isSupabaseConfigured && supabase) {
    let request = supabase
      .from('certified_entries')
      .select(
        'barcode, product_name, brand, category, status, certificate_number, verified_at, ingredients, notes, certifiers(id, name, short_name, country)'
      )
      .order('created_at', { ascending: false })
      .limit(30);

    if (q) {
      const safe = q.replace(/[,()%]/g, '');
      request = request.or(
        `brand.ilike.%${safe}%,product_name.ilike.%${safe}%,category.ilike.%${safe}%`
      );
    }

    const { data, error } = await request.returns<CertifiedEntryRow[]>();
    if (!error) {
      return (data ?? []).map((row) => mapRowToResult(row, row.barcode ?? ''));
    }
    console.warn('Supabase searchProducts failed, falling back to local data:', error.message);
  }

  await new Promise((resolve) => setTimeout(resolve, 300));
  const lower = q.toLowerCase();
  const all = Object.values(MOCK_DB);
  if (!lower) return all;
  return all.filter(
    (p) =>
      p.productName.toLowerCase().includes(lower) ||
      p.brand.toLowerCase().includes(lower) ||
      p.category.toLowerCase().includes(lower)
  );
}

export function getAllProducts(): CertificationResult[] {
  return Object.values(MOCK_DB);
}

export function getProductByBarcode(barcode: string): CertificationResult | undefined {
  return MOCK_DB[barcode];
}

// Badge text — see StatusBadge.tsx for why 'unknown' reads the same as
// 'mushbooh' ("şübhəli") while 'haram' gets its own, stronger wording.
export const statusLabel: Record<CertificationResult['status'], string> = {
  halal: 'HALAL',
  haram: 'MƏSLƏHƏT GÖRÜLMÜR',
  mushbooh: 'ŞÜBHƏLİ',
  unknown: 'ŞÜBHƏLİ',
};

export const statusDescription: Record<CertificationResult['status'], string> = {
  halal: 'Halal olaraq təsdiqlənib — sertifikat və ya etibarlı halal məlumatı var.',
  haram: 'Halal standartlarına uyğunluğu təsdiqlənməyib, ya da uyğun olmadığına dair əsas var.',
  mushbooh: 'Halal statusu qeyri-müəyyəndir — kifayət qədər təsdiqlənmiş məlumat yoxdur.',
  unknown: 'Halal statusu qeyri-müəyyəndir — kifayət qədər təsdiqlənmiş məlumat yoxdur.',
};

import { CertificationResult } from './types';
import { getCertifier } from './certifiers';

/**
 * Demo/offline dataset standing in for the real lookup.
 *
 * Production integration point: replace `lookupBarcode` with calls to each
 * certifier's verification API/registry (GIMDES, HAK, SMIIC member bodies,
 * JAKIM, ...). None of these currently expose a public real-time API, so
 * shipping this for real requires either (a) a data-sharing agreement with
 * each certifier, or (b) building Halalzur's own crowdsourced + manually
 * verified database seeded from their published certificate lists (most
 * publish PDFs/registries on their sites that can be scraped/imported).
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

export async function lookupBarcode(barcode: string): Promise<CertificationResult> {
  await new Promise((resolve) => setTimeout(resolve, 900));

  const hit = MOCK_DB[barcode];
  if (hit) return hit;

  return {
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
  };
}

export async function searchProducts(query: string): Promise<CertificationResult[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const q = query.trim().toLowerCase();
  const all = Object.values(MOCK_DB);
  if (!q) return all;
  return all.filter(
    (p) =>
      p.productName.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
  );
}

export function getAllProducts(): CertificationResult[] {
  return Object.values(MOCK_DB);
}

export function getProductByBarcode(barcode: string): CertificationResult | undefined {
  return MOCK_DB[barcode];
}

export const statusLabel: Record<CertificationResult['status'], string> = {
  halal: 'Halal təsdiqlənib',
  haram: 'Halal deyil',
  mushbooh: 'Şübhəli',
  unknown: 'Naməlum',
};

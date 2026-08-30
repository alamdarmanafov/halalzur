/**
 * UPCitemdb — free, keyless "trial" lookup tier (100 requests/day per IP,
 * https://www.upcitemdb.com/wiki/doku.php?id=trial_api), used as a second
 * fallback after Open Food Facts. It's a general retail catalog, not
 * food-specific: no ingredients, no halal status — just name/brand/
 * category/image, same role Open Food Facts plays but covering products
 * OFF doesn't have (it's stronger on non-EU/non-food barcodes).
 *
 * A paid UPCitemdb key, or Go-UPC (https://go-upc.com), would raise the
 * request quota and coverage further — set EXPO_PUBLIC_UPCITEMDB_KEY to
 * use one once you have it (see the trial endpoint's docs for the paid
 * endpoint URL change). GS1's own "Verified by GS1" and GS1 Azerbaijan
 * are membership/registry services, not public lookup APIs — worth a
 * direct partnership inquiry to GS1 Azerbaijan for authoritative local
 * product data, but not something to wire up here without credentials.
 */
import { CertificationResult } from './types';

type UpcItemDbItem = {
  title?: string;
  brand?: string;
  category?: string;
  images?: string[];
};

type UpcItemDbResponse = {
  code: string;
  total: number;
  items?: UpcItemDbItem[];
};

export async function lookupUpcItemDb(barcode: string): Promise<CertificationResult | null> {
  try {
    const response = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(barcode)}`
    );
    if (!response.ok) return null;
    const data: UpcItemDbResponse = await response.json();
    const item = data.items?.[0];
    if (data.code !== 'OK' || !item || !item.title) return null;

    return {
      barcode,
      productName: item.title.trim(),
      brand: item.brand?.trim() || '—',
      category: item.category?.split('/')[0]?.trim() || '—',
      status: 'unknown',
      certifier: null,
      certificateNumber: null,
      verifiedAt: null,
      ingredients: [],
      notes:
        'Məhsul adı UPCitemdb açıq kataloqundan götürülüb — tərkib məlumatı yoxdur, halal statusu heç bir sertifikat orqanı tərəfindən təsdiqlənməyib.',
      imageEmoji: '🛒',
      imageUrl: item.images?.[0] ?? null,
    };
  } catch {
    return null;
  }
}

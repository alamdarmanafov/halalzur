/**
 * Open Food Facts — free, keyless, open-license (ODbL) global product
 * database, used only as an ingredients/product-info fallback when a
 * barcode isn't in our own certified_entries table. It has no concept of
 * halal status, so a result from it always comes back 'unknown' and lets
 * the existing E-code lookup (run over the ingredients it returns) speak
 * for itself.
 */
import { CertificationResult } from './types';

type OpenFoodFactsProduct = {
  product_name?: string;
  brands?: string;
  categories?: string;
  ingredients_text?: string;
  ingredients_text_tr?: string;
};

type OpenFoodFactsResponse = {
  status: number;
  product?: OpenFoodFactsProduct;
};

function splitIngredients(text: string): string[] {
  return text
    .split(/[,;]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export async function lookupOpenFoodFacts(barcode: string): Promise<CertificationResult | null> {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
    if (!response.ok) return null;
    const data: OpenFoodFactsResponse = await response.json();
    if (data.status !== 1 || !data.product) return null;

    const { product } = data;
    const ingredientsText = product.ingredients_text_tr || product.ingredients_text || '';
    const ingredients = splitIngredients(ingredientsText);
    if (!product.product_name && ingredients.length === 0) return null;

    return {
      barcode,
      productName: product.product_name?.trim() || 'Naməlum məhsul',
      brand: product.brands?.split(',')[0]?.trim() || '—',
      category: product.categories?.split(',')[0]?.trim() || '—',
      status: 'unknown',
      certifier: null,
      certificateNumber: null,
      verifiedAt: null,
      ingredients,
      notes:
        'Tərkib Open Food Facts açıq bazasından götürülüb — halal statusu heç bir sertifikat orqanı tərəfindən təsdiqlənməyib. Aşağıdakı E-kodlara əsasən ehtiyatlı olun.',
      imageEmoji: '🛒',
    };
  } catch {
    return null;
  }
}

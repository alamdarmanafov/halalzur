import { TranslationKey } from './i18n';

/**
 * Personal dietary/allergen tags a user can opt into (lib/dietaryProfile-
 * context.tsx). Matching is plain keyword search over the ingredient text
 * — the same free-text field haramKeywords.ts already searches — not a
 * certified classification, so it's a best-effort heads-up, not a
 * guarantee the way the halal/E-code data is.
 */
export type DietaryTag = 'vegan' | 'dairy_free' | 'sugar_free' | 'gluten_free';
export type AllergenTag = 'nuts' | 'milk' | 'gluten' | 'eggs' | 'soy' | 'fish';

export const DIETARY_TAG_LABEL_KEY: Record<DietaryTag, TranslationKey> = {
  vegan: 'dietTagVegan',
  dairy_free: 'dietTagDairyFree',
  sugar_free: 'dietTagSugarFree',
  gluten_free: 'dietTagGlutenFree',
};

export const ALLERGEN_TAG_LABEL_KEY: Record<AllergenTag, TranslationKey> = {
  nuts: 'allergenNuts',
  milk: 'allergenMilk',
  gluten: 'allergenGluten',
  eggs: 'allergenEggs',
  soy: 'allergenSoy',
  fish: 'allergenFish',
};

// Ingredient-text keywords that trigger each tag — deliberately keeps to
// common Azerbaijani/Russian/English/Turkish ingredient-list spellings
// rather than every possible synonym.
const DIETARY_KEYWORDS: Record<DietaryTag, string[]> = {
  vegan: ['süd', 'yumurta', 'bal', 'jelatin', 'желатин', 'молоко', 'яйцо', 'мёд', 'milk', 'egg', 'honey', 'gelatin', 'süt', 'yumurta', 'bal', 'jelatin', 'whey', 'kazein', 'казеин'],
  dairy_free: ['süd', 'pendir', 'yogurt', 'krem', 'laktoz', 'молоко', 'сыр', 'йогурт', 'лактоза', 'milk', 'cheese', 'yogurt', 'lactose', 'süt', 'peynir', 'krema', 'whey', 'kazein', 'казеин'],
  sugar_free: ['şəkər', 'qlükoza', 'fruktoza', 'saxaroza', 'сахар', 'глюкоза', 'фруктоза', 'sugar', 'glucose', 'fructose', 'şeker', 'glikoz'],
  gluten_free: ['buğda', 'un', 'arpa', 'çovdar', 'qluten', 'пшеница', 'мука', 'ячмень', 'рожь', 'глютен', 'wheat', 'flour', 'barley', 'rye', 'gluten', 'buğday', 'un'],
};

const ALLERGEN_KEYWORDS: Record<AllergenTag, string[]> = {
  nuts: ['fındıq', 'qoz', 'badam', 'yerfındığı', 'арахис', 'орех', 'миндаль', 'фундук', 'peanut', 'nut', 'almond', 'hazelnut', 'fıstık', 'ceviz'],
  milk: ['süd', 'pendir', 'yogurt', 'krem', 'laktoz', 'молоко', 'сыр', 'йогурт', 'milk', 'cheese', 'yogurt', 'lactose', 'süt', 'peynir', 'whey', 'kazein'],
  gluten: ['buğda', 'un', 'arpa', 'çovdar', 'qluten', 'пшеница', 'мука', 'глютен', 'wheat', 'flour', 'barley', 'gluten', 'buğday'],
  eggs: ['yumurta', 'яйцо', 'egg', 'yumurta'],
  soy: ['soya', 'соя', 'soy', 'soya'],
  fish: ['balıq', 'рыба', 'fish', 'balık', 'anchovy', 'ançous'],
};

function matchesAny(ingredientText: string, keywords: string[]): boolean {
  const lower = ingredientText.toLowerCase();
  return keywords.some((k) => lower.includes(k.toLowerCase()));
}

export function matchDietaryTags(ingredientText: string, tags: DietaryTag[]): DietaryTag[] {
  if (!ingredientText || tags.length === 0) return [];
  return tags.filter((tag) => matchesAny(ingredientText, DIETARY_KEYWORDS[tag]));
}

export function matchAllergenTags(ingredientText: string, tags: AllergenTag[]): AllergenTag[] {
  if (!ingredientText || tags.length === 0) return [];
  return tags.filter((tag) => matchesAny(ingredientText, ALLERGEN_KEYWORDS[tag]));
}

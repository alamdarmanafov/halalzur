import { Language } from './i18n';

/**
 * A curated dictionary of common Azerbaijani ingredient terms, used to
 * show product ingredient lists in English without needing the admin to
 * type an English version of every product, and without an automatic
 * translation API (real accuracy risk for allergen/halal-relevant terms —
 * a mistranslation here isn't just awkward, it could mislead someone with
 * a real dietary restriction). Anything not in this list is shown exactly
 * as entered rather than guessed at.
 */
const GLOSSARY: Record<string, string> = {
  şəkər: 'sugar',
  'qlükoza şərbəti': 'glucose syrup',
  qlükoza: 'glucose',
  fruktoza: 'fructose',
  laktoza: 'lactose',
  bal: 'honey',

  'bitki yağı': 'vegetable oil',
  'günəbaxan yağı': 'sunflower oil',
  'palma yağı': 'palm oil',
  'zeytun yağı': 'olive oil',
  'kərə yağı': 'butter',
  'kakao yağı': 'cocoa butter',
  marqarin: 'margarine',
  'heyvan yağı': 'animal fat',
  'donuz piyi': 'lard',

  süd: 'milk',
  'süd tozu': 'milk powder',
  qaymaq: 'cream',
  pendir: 'cheese',
  yoğurt: 'yogurt',
  zərdab: 'whey',
  kazein: 'casein',

  un: 'flour',
  'buğda unu': 'wheat flour',
  çovdar: 'rye',
  arpa: 'barley',
  düyü: 'rice',
  qarğıdalı: 'corn',
  yulaf: 'oats',
  nişasta: 'starch',

  'vanil aromatı': 'vanilla flavor',
  aromatizator: 'flavoring',
  'dad artırıcı': 'flavor enhancer',
  sirkə: 'vinegar',
  'limon turşusu': 'citric acid',
  duz: 'salt',
  maya: 'yeast',
  jelatin: 'gelatin',
  pektin: 'pectin',
  karragenan: 'carrageenan',
  lesitin: 'lecithin',
  'soya lesitini': 'soy lecithin',
  emulqator: 'emulsifier',
  sabitləşdirici: 'stabilizer',
  qatılaşdırıcı: 'thickener',
  konservant: 'preservative',
  antioksidant: 'antioxidant',
  rəngləyici: 'colorant',

  fındıq: 'hazelnut',
  badam: 'almond',
  qoz: 'walnut',
  yerfındığı: 'peanut',
  kişmiş: 'raisin',
  kokos: 'coconut',
  alma: 'apple',

  yumurta: 'egg',
  ət: 'meat',
  toyuq: 'chicken',
  'mal əti': 'beef',
  balıq: 'fish',

  su: 'water',
  spirt: 'alcohol',
  ətir: 'fragrance',
  qliserin: 'glycerin',

  'heyvan mənşəli': 'animal-derived',
  'bitki mənşəli': 'plant-derived',
};

/** Case/whitespace-insensitive exact-term lookup — no partial substring matching. */
export function translateIngredientTerm(term: string, language: Language): string {
  if (language !== 'en') return term;
  const key = term.trim().toLowerCase();
  return GLOSSARY[key] ?? term;
}

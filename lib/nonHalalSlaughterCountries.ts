/**
 * Countries where meat production is presumed to NOT typically follow
 * halal slaughter (dhabihah) practice — used only to add a short,
 * Premium-only explanatory reason on the product detail screen when a
 * haram/mushbooh product's admin-entered origin_country matches one of
 * these. This is a coarse, admin-maintained heuristic, not a certification
 * claim — it never changes a product's actual halal status, which stays a
 * human (admin) decision like every other status call in this app.
 *
 * Matching is case-insensitive and accepts either the Azerbaijani or
 * English country name, since admins may type either (the admin panel's
 * "İstehsalçı ölkə" select stores the Azerbaijani label, but earlier
 * free-typed data may hold an English one).
 *
 * List mirrors admin-panel/index.html's PRODUCT_ORIGIN_COUNTRIES select
 * options minus the Muslim-majority ones (Azərbaycan, Türkiyə, İran,
 * Səudiyyə Ərəbistanı, BƏƏ, Malayziya, İndoneziya, Pakistan), where
 * halal slaughter is the standard, expected practice.
 */
// Written in natural capitalization (matching the admin panel's dropdown
// option labels exactly) and lowercased below via the same .toLowerCase()
// call isNonHalalSlaughterCountry() applies to the stored value — the
// Azerbaijani capital "İ" lowercases to "i̇" (with a combining dot, not
// plain "i") in plain JS .toLowerCase(), so hand-typing an approximated
// lowercase form here would silently never match; letting both sides run
// through the same transform sidesteps that entirely.
const NON_HALAL_SLAUGHTER_COUNTRIES = new Set(
  [
    'Rusiya', 'Russia',
    'Gürcüstan', 'Georgia',
    'Ukrayna', 'Ukraine',
    'Almaniya', 'Germany',
    'Fransa', 'France',
    'Polşa', 'Poland',
    'Belçika', 'Belgium',
    'İtaliya', 'Italy',
    'İspaniya', 'Spain',
    'Niderland', 'Netherlands', 'Hollandiya',
    'Böyük Britaniya', 'United Kingdom', 'UK',
    'İsveçrə', 'Switzerland',
    'Avstriya', 'Austria',
    'İsveç', 'Sweden',
    'Norveç', 'Norway',
    'Danimarka', 'Denmark',
    'Finlandiya', 'Finland',
    'Yunanıstan', 'Greece',
    'Portuqaliya', 'Portugal',
    'Çexiya', 'Czechia', 'Czech Republic',
    'Macarıstan', 'Hungary',
    'Rumıniya', 'Romania',
    'Bolqarıstan', 'Bulgaria',
    'Serbiya', 'Serbia',
    'Xorvatiya', 'Croatia',
    'Yaponiya', 'Japan',
    'Çin', 'China',
    'Cənubi Koreya', 'South Korea',
    'ABŞ', 'USA', 'United States',
    'Kanada', 'Canada',
    'Braziliya', 'Brazil',
    'Hindistan', 'India',
  ].map((s) => s.toLowerCase())
);

export function isNonHalalSlaughterCountry(country: string | null | undefined): boolean {
  if (!country) return false;
  return NON_HALAL_SLAUGHTER_COUNTRIES.has(country.trim().toLowerCase());
}

// Azerbaijani back vowels (a, ı, o, u) take the "-da" locative suffix,
// front vowels (e, ə, i, ö, ü) take "-də" — a simple two-way vowel-harmony
// rule, decided by the LAST vowel in the word (e.g. "Rusiya" -> "Rusiyada",
// "Çin" -> "Çində", "İsveçrə" -> "İsveçrədə"). Used only to phrase the
// Azerbaijani reason sentence ("Bu məhsul Rusiyada kəsilib...") — other
// locales phrase around the country name instead, so they don't need this.
export function withAzLocativeSuffix(country: string): string {
  const backVowels = 'aıou';
  const lastVowel = [...country.toLowerCase()].reverse().find((ch) => /[aıioöuüeə]/.test(ch));
  const suffix = lastVowel && backVowels.includes(lastVowel) ? 'da' : 'də';
  return country + suffix;
}

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
 * English country name, since admins may type either.
 */
const NON_HALAL_SLAUGHTER_COUNTRIES = new Set(
  ['rusiya', 'russia', 'almaniya', 'germany'].map((s) => s.toLowerCase())
);

export function isNonHalalSlaughterCountry(country: string | null | undefined): boolean {
  if (!country) return false;
  return NON_HALAL_SLAUGHTER_COUNTRIES.has(country.trim().toLowerCase());
}

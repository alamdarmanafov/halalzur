import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Canonical product categories — shared by the Products tab's filter
 * chips and the product-submission form's category picker so new
 * submissions stay filterable against the same fixed set instead of
 * users typing free-form variants of the same category.
 *
 * This hardcoded list is the fallback for when Supabase isn't configured
 * (or the fetch below fails) — the source of truth is now the
 * product_categories table (supabase/schema.sql), editable from the admin
 * panel's Kateqoriyalar tab without a code change.
 */
export const PRODUCT_CATEGORIES = [
  'Şirniyyat',
  'Çörək',
  'İçki',
  'Süd məhsulları',
  'Ət məhsulları',
  'Konservlər',
  'Dondurulmuş məhsullar',
  'Souslar',
  'Qəlyanaltılar',
  'Dənli məhsullar',
  'Uşaq qidası',
  'Makaron və düyü',
  'Yağlar',
  'Ədviyyat',
  'Kosmetika',
] as const;

export async function getProductCategories(): Promise<string[]> {
  if (!isSupabaseConfigured || !supabase) return [...PRODUCT_CATEGORIES];
  const { data, error } = await supabase
    .from('product_categories')
    .select('label')
    .order('sort_order', { ascending: true });
  if (error || !data || data.length === 0) return [...PRODUCT_CATEGORIES];
  return data.map((row) => row.label as string);
}

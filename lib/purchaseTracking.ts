import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Fire-and-forget log of a completed Premium purchase, called from
 * app/subscription.tsx's onPurchaseSuccess right after finishTransaction.
 * Backs the admin panel's "Premium gəlir (təxmini)" dashboard widget —
 * see the purchase_events table comment in supabase/schema.sql for what
 * this estimate does and doesn't capture (no server-verified receipts,
 * no renewals/refunds, gross retail price rather than Apple's payout).
 */
export function logPurchaseEvent(userId: string, productId: string, estimatedUsdAmount: number): void {
  if (!isSupabaseConfigured || !supabase) return;
  supabase
    .from('purchase_events')
    .insert({ user_id: userId, product_id: productId, estimated_usd_amount: estimatedUsdAmount })
    .then(({ error }) => {
      if (error) console.warn('logPurchaseEvent failed:', error.message);
    });
}

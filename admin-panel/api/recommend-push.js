// Vercel serverless function — "might interest you" push. For each user
// due for one (users.last_recommend_sent_at null or 7+ days old), looks
// at their favorites (the richest per-user signal that already carries a
// product category — see supabase/schema.sql's favorites.data jsonb) to
// find their most-favorited category, then picks one halal product in
// that category they haven't already favorited. Fired daily by
// .github/workflows/recommend-push.yml — nothing in the app calls this.
//
// Users with no favorites yet are skipped (no signal to recommend from)
// — deliberately not scan_events, which has no user_id by design (see
// supabase/schema.sql's scan_events comment: aggregate usage only).
//
// Auth + required env vars: same NOTIFY_SECRET/Supabase/Firebase set
// process-scheduled-broadcasts.js already needs — no new setup.
import { getMessaging } from 'firebase-admin/messaging';
import { createClient } from '@supabase/supabase-js';
import { getFirebaseApp } from '../lib/firebaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  if (!process.env.NOTIFY_SECRET || req.headers['x-notify-secret'] !== process.env.NOTIFY_SECRET) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  if (
    !process.env.SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !process.env.FIREBASE_PRIVATE_KEY
  ) {
    res.status(500).json({ error: 'not_configured' });
    return;
  }

  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const resendAfter = new Date(Date.now() - 7 * 86400000).toISOString();

    const { data: candidates, error } = await supabase
      .from('users')
      .select('id')
      .or(`last_recommend_sent_at.is.null,last_recommend_sent_at.lt.${resendAfter}`)
      .limit(100);
    if (error) throw error;
    if (!candidates || !candidates.length) {
      res.status(200).json({ notified: 0 });
      return;
    }

    const messaging = getMessaging(getFirebaseApp());
    let notified = 0;

    for (const user of candidates) {
      const { data: favorites } = await supabase
        .from('favorites')
        .select('barcode, data')
        .eq('user_id', user.id)
        .limit(50);
      if (!favorites || !favorites.length) continue;

      const counts = {};
      favorites.forEach((f) => {
        const category = f.data && f.data.category;
        if (category) counts[category] = (counts[category] || 0) + 1;
      });
      const topCategory = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
      if (!topCategory) continue;

      const knownBarcodes = favorites.map((f) => f.barcode);
      const { data: candidateProducts } = await supabase
        .from('certified_entries')
        .select('barcode, product_name, brand')
        .eq('entry_type', 'product')
        .eq('category', topCategory)
        .eq('status', 'halal')
        .is('deleted_at', null)
        .not('barcode', 'is', null)
        .limit(20);
      const pick = (candidateProducts || []).find((p) => !knownBarcodes.includes(p.barcode));
      if (!pick) continue;

      const { data: tokens } = await supabase.from('device_tokens').select('fcm_token').eq('user_id', user.id);
      if (!tokens || !tokens.length) continue;

      const title = 'Sizi maraqlandıra bilər';
      const body = `${pick.product_name || pick.brand} (${topCategory}) — yoxlayın!`;
      let sentAny = false;
      for (const { fcm_token } of tokens) {
        try {
          await messaging.send({
            token: fcm_token,
            notification: { title, body },
            data: { route: `/product/${pick.barcode}` },
          });
          sentAny = true;
        } catch (err) {
          console.error('recommend-push: FCM send failed', err.code, err.message);
        }
      }
      if (sentAny) {
        await supabase.from('users').update({ last_recommend_sent_at: new Date().toISOString() }).eq('id', user.id);
        notified++;
      }
    }

    res.status(200).json({ notified });
  } catch (err) {
    console.error('recommend-push: unexpected error', err);
    res.status(500).json({ error: err.message });
  }
}

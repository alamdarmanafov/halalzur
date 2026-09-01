// Vercel serverless function — combines what used to be three separate
// cron-fired routes (weekly-digest.js, win-back-push.js, recommend-push.js)
// into one, dispatched by a `job` query param/body field. Vercel's Hobby
// (free) plan caps a deployment at 12 serverless functions — every file
// under admin-panel/api/ is its own function, and adding those three
// separately pushed the project over that limit and broke every deploy.
// Merging them here is the standard workaround; the three GitHub Actions
// workflows now call this same route with a different `job` value each.
//
// Each job keeps its own auth + required-env-var check and its own
// try/catch, so one job's failure can't affect another's — this is
// really three independent functions sharing one file, not one combined
// pipeline.
import { getMessaging } from 'firebase-admin/messaging';
import { createClient } from '@supabase/supabase-js';
import { getFirebaseApp } from '../lib/firebaseAdmin.js';

function checkConfigured(res) {
  if (
    !process.env.SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !process.env.FIREBASE_PRIVATE_KEY
  ) {
    res.status(500).json({ error: 'not_configured' });
    return false;
  }
  return true;
}

// Sends one push to everyone (topic-based, same BROADCAST_TOPIC as
// sendBroadcast's "all/all" case) summarizing the last 7 days: how many
// new halal-certified products were added, and the single most-scanned
// product of the week. Fired weekly by .github/workflows/weekly-digest.yml.
async function runWeeklyDigest(res) {
  if (!checkConfigured(res)) return;
  const BROADCAST_TOPIC = 'halalzur_all';
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    const { count: newCount } = await supabase
      .from('certified_entries')
      .select('id', { count: 'exact', head: true })
      .eq('entry_type', 'product')
      .is('deleted_at', null)
      .gte('created_at', weekAgo);

    const { data: scans } = await supabase.from('scan_events').select('barcode').gte('created_at', weekAgo);
    let topLine = '';
    if (scans && scans.length) {
      const counts = {};
      scans.forEach((s) => {
        counts[s.barcode] = (counts[s.barcode] || 0) + 1;
      });
      const topBarcode = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      const { data: topProduct } = await supabase
        .from('certified_entries')
        .select('product_name, brand')
        .eq('barcode', topBarcode)
        .eq('entry_type', 'product')
        .limit(1)
        .maybeSingle();
      if (topProduct) {
        topLine = ` Ən çox skan edilən: ${topProduct.product_name || topProduct.brand}.`;
      }
    }

    const newLine = newCount ? `Bu həftə ${newCount} yeni məhsul əlavə edildi.` : 'Bu həftə yeni məhsullar əlavə edildi.';
    const body = `${newLine}${topLine} Yoxlamaq üçün tətbiqi aç!`;

    const messaging = getMessaging(getFirebaseApp());
    await messaging.send({ topic: BROADCAST_TOPIC, notification: { title: 'Həftəlik Halalzur xülasəsi', body } });

    res.status(200).json({ sent: true, newCount: newCount || 0, body });
  } catch (err) {
    console.error('cron-jobs[weekly-digest]: unexpected error', err);
    res.status(500).json({ error: err.message });
  }
}

// Nudges users who haven't opened the app in 7+ days, at most once
// every 14 days per user (users.last_winback_sent_at tracks that).
// Fired daily by .github/workflows/win-back-push.yml.
async function runWinBackPush(res) {
  if (!checkConfigured(res)) return;
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const inactiveSince = new Date(Date.now() - 7 * 86400000).toISOString();
    const resendAfter = new Date(Date.now() - 14 * 86400000).toISOString();

    const { data: candidates, error } = await supabase
      .from('users')
      .select('id, last_winback_sent_at')
      .not('last_seen_at', 'is', null)
      .lt('last_seen_at', inactiveSince)
      .or(`last_winback_sent_at.is.null,last_winback_sent_at.lt.${resendAfter}`)
      .limit(200);
    if (error) throw error;
    if (!candidates || !candidates.length) {
      res.status(200).json({ notified: 0 });
      return;
    }

    const messaging = getMessaging(getFirebaseApp());
    const title = 'Sizi darıxdıq!';
    const body = 'Yeni halal məhsulları yoxlamaq üçün Halalzur-a qayıdın 🍏';
    let notified = 0;

    for (const user of candidates) {
      const { data: tokens } = await supabase.from('device_tokens').select('fcm_token').eq('user_id', user.id);
      if (!tokens || !tokens.length) continue;
      let sentAny = false;
      for (const { fcm_token } of tokens) {
        try {
          await messaging.send({ token: fcm_token, notification: { title, body } });
          sentAny = true;
        } catch (err) {
          console.error('cron-jobs[win-back]: FCM send failed', err.code, err.message);
        }
      }
      if (sentAny) {
        await supabase.from('users').update({ last_winback_sent_at: new Date().toISOString() }).eq('id', user.id);
        notified++;
      }
    }

    res.status(200).json({ notified });
  } catch (err) {
    console.error('cron-jobs[win-back]: unexpected error', err);
    res.status(500).json({ error: err.message });
  }
}

// "Might interest you" push. For each user due for one
// (users.last_recommend_sent_at null or 7+ days old), looks at their
// favorites (the richest per-user signal that already carries a product
// category — see supabase/schema.sql's favorites.data jsonb) to find
// their most-favorited category, then picks one halal product in that
// category they haven't already favorited. Fired daily by
// .github/workflows/recommend-push.yml.
async function runRecommendPush(res) {
  if (!checkConfigured(res)) return;
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
          console.error('cron-jobs[recommend]: FCM send failed', err.code, err.message);
        }
      }
      if (sentAny) {
        await supabase.from('users').update({ last_recommend_sent_at: new Date().toISOString() }).eq('id', user.id);
        notified++;
      }
    }

    res.status(200).json({ notified });
  } catch (err) {
    console.error('cron-jobs[recommend]: unexpected error', err);
    res.status(500).json({ error: err.message });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  if (!process.env.NOTIFY_SECRET || req.headers['x-notify-secret'] !== process.env.NOTIFY_SECRET) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const job = req.query.job || (req.body && req.body.job);
  if (job === 'weekly-digest') return runWeeklyDigest(res);
  if (job === 'win-back') return runWinBackPush(res);
  if (job === 'recommend') return runRecommendPush(res);
  res.status(400).json({ error: 'unknown_job', job });
}

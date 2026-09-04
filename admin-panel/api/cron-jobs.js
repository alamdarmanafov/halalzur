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

// Nudges users at escalating inactivity tiers (7/30/90/180 days by
// default — editable via the admin panel's winback_templates table).
// Each tier fires exactly once per user: users.last_winback_tier_sent
// tracks the highest tier already sent, so a user who's crossed a new
// threshold since the last run gets that tier's copy, never a repeat
// of one already sent and never more than one tier per run. Fired
// daily by .github/workflows/win-back-push.yml.
async function runWinBackPush(res) {
  if (!checkConfigured(res)) return;
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data: templates, error: templatesError } = await supabase
      .from('winback_templates')
      .select('days_inactive, title, body')
      .order('days_inactive', { ascending: true });
    if (templatesError) throw templatesError;
    if (!templates || !templates.length) {
      res.status(200).json({ notified: 0 });
      return;
    }
    const lowestTier = templates[0].days_inactive;
    const highestTier = templates[templates.length - 1].days_inactive;
    const inactiveSince = new Date(Date.now() - lowestTier * 86400000).toISOString();

    const { data: candidates, error } = await supabase
      .from('users')
      .select('id, last_seen_at, last_winback_tier_sent, muted_notification_types')
      .not('last_seen_at', 'is', null)
      .lt('last_seen_at', inactiveSince)
      .or(`last_winback_tier_sent.is.null,last_winback_tier_sent.lt.${highestTier}`)
      .limit(200);
    if (error) throw error;
    if (!candidates || !candidates.length) {
      res.status(200).json({ notified: 0 });
      return;
    }

    const messaging = getMessaging(getFirebaseApp());
    let notified = 0;

    for (const user of candidates) {
      if ((user.muted_notification_types || []).includes('winback')) continue;
      const daysInactive = Math.floor((Date.now() - new Date(user.last_seen_at).getTime()) / 86400000);
      // Highest tier this user has now crossed that they haven't already received.
      const template = [...templates]
        .reverse()
        .find((t) => daysInactive >= t.days_inactive && t.days_inactive > (user.last_winback_tier_sent || 0));
      if (!template) continue;

      const { data: tokens } = await supabase.from('device_tokens').select('fcm_token').eq('user_id', user.id);
      if (!tokens || !tokens.length) continue;
      let sentAny = false;
      for (const { fcm_token } of tokens) {
        try {
          await messaging.send({ token: fcm_token, notification: { title: template.title, body: template.body } });
          sentAny = true;
        } catch (err) {
          console.error('cron-jobs[win-back]: FCM send failed', err.code, err.message);
        }
      }
      if (sentAny) {
        await supabase
          .from('users')
          .update({ last_winback_sent_at: new Date().toISOString(), last_winback_tier_sent: template.days_inactive })
          .eq('id', user.id);
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
      .select('id, muted_notification_types')
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
      if ((user.muted_notification_types || []).includes('recommend')) continue;
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

// Weekly "new in your favorite category" push. Reuses the same
// top-favorited-category signal as runRecommendPush, but only notifies
// when there's genuinely new supply (a certified_entries row added in the
// last 7 days in that category) rather than any pick from the whole
// category — a distinct, narrower signal from "might interest you".
// Skips users who muted 'category_digest' (see users.muted_notification_types).
async function runCategoryDigestPush(res) {
  if (!checkConfigured(res)) return;
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const resendAfter = new Date(Date.now() - 7 * 86400000).toISOString();
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    const { data: candidates, error } = await supabase
      .from('users')
      .select('id, muted_notification_types')
      .or(`last_category_digest_sent_at.is.null,last_category_digest_sent_at.lt.${resendAfter}`)
      .limit(100);
    if (error) throw error;
    if (!candidates || !candidates.length) {
      res.status(200).json({ notified: 0 });
      return;
    }

    const messaging = getMessaging(getFirebaseApp());
    let notified = 0;

    for (const user of candidates) {
      if ((user.muted_notification_types || []).includes('category_digest')) continue;

      const { data: favorites } = await supabase.from('favorites').select('data').eq('user_id', user.id).limit(50);
      if (!favorites || !favorites.length) continue;

      const counts = {};
      favorites.forEach((f) => {
        const category = f.data && f.data.category;
        if (category) counts[category] = (counts[category] || 0) + 1;
      });
      const topCategory = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
      if (!topCategory) continue;

      const { data: newProducts, count } = await supabase
        .from('certified_entries')
        .select('product_name, brand', { count: 'exact' })
        .eq('entry_type', 'product')
        .eq('category', topCategory)
        .eq('status', 'halal')
        .is('deleted_at', null)
        .gte('created_at', weekAgo)
        .limit(1);
      if (!count) continue;

      const { data: tokens } = await supabase.from('device_tokens').select('fcm_token').eq('user_id', user.id);
      if (!tokens || !tokens.length) continue;

      const first = newProducts && newProducts[0];
      const title = `${topCategory}: yeni halal məhsullar`;
      const body =
        count === 1
          ? `${first?.product_name || first?.brand} əlavə edildi — yoxlayın!`
          : `${count} yeni məhsul əlavə edildi, o cümlədən ${first?.product_name || first?.brand}.`;
      let sentAny = false;
      for (const { fcm_token } of tokens) {
        try {
          await messaging.send({ token: fcm_token, notification: { title, body } });
          sentAny = true;
        } catch (err) {
          console.error('cron-jobs[category-digest]: FCM send failed', err.code, err.message);
        }
      }
      if (sentAny) {
        await supabase.from('users').update({ last_category_digest_sent_at: new Date().toISOString() }).eq('id', user.id);
        notified++;
      }
    }

    res.status(200).json({ notified });
  } catch (err) {
    console.error('cron-jobs[category-digest]: unexpected error', err);
    res.status(500).json({ error: err.message });
  }
}

// Monthly "Halal Detektiv" reward — whoever submitted the most (non-
// rejected) unknown-product suggestions in the previous calendar month
// gets 7 days of free Premium plus a congratulatory push. Idempotent: if
// ANY user already carries this month's award marker
// (last_detective_award_month), the job is a no-op on re-run.
async function runMonthlyDetectivePush(res) {
  if (!checkConfigured(res)) return;
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const now = new Date();
    const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString();
    const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

    const { data: alreadyAwarded } = await supabase
      .from('users')
      .select('id')
      .eq('last_detective_award_month', monthKey)
      .limit(1);
    if (alreadyAwarded && alreadyAwarded.length) {
      res.status(200).json({ awarded: false, reason: 'already_awarded_this_month' });
      return;
    }

    const { data: submissions, error } = await supabase
      .from('product_submissions')
      .select('submitted_by')
      .neq('review_status', 'rejected')
      .gte('created_at', monthStart)
      .lt('created_at', monthEnd);
    if (error) throw error;
    if (!submissions || !submissions.length) {
      res.status(200).json({ awarded: false, reason: 'no_submissions' });
      return;
    }

    const counts = {};
    submissions.forEach((s) => {
      counts[s.submitted_by] = (counts[s.submitted_by] || 0) + 1;
    });
    const [winnerId, winnerCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

    const AWARD_DAYS = 7;
    const { data: winner } = await supabase.from('users').select('premium_expires_at, plan').eq('id', winnerId).maybeSingle();
    const base =
      winner?.plan === 'premium' && winner.premium_expires_at && new Date(winner.premium_expires_at) > now
        ? new Date(winner.premium_expires_at)
        : now;
    const newExpiresAt = new Date(base.getTime() + AWARD_DAYS * 86400000).toISOString();

    await supabase
      .from('users')
      .update({
        plan: 'premium',
        premium_expires_at: newExpiresAt,
        last_detective_award_month: monthKey,
        updated_at: new Date().toISOString(),
      })
      .eq('id', winnerId);

    const { data: tokens } = await supabase.from('device_tokens').select('fcm_token').eq('user_id', winnerId);
    if (tokens && tokens.length) {
      const messaging = getMessaging(getFirebaseApp());
      for (const { fcm_token } of tokens) {
        try {
          await messaging.send({
            token: fcm_token,
            notification: {
              title: '🕵️ Ayın Halal Detektivi sizsiniz!',
              body: `Bu ay ${winnerCount} məhsul əlavə etdiniz — ${AWARD_DAYS} gün pulsuz Premium hədiyyəmizdir!`,
            },
            data: { route: '/(tabs)/profile' },
          });
        } catch (err) {
          console.error('cron-jobs[monthly-detective]: FCM send failed', err.code, err.message);
        }
      }
    }

    res.status(200).json({ awarded: true, winnerId, winnerCount, newExpiresAt });
  } catch (err) {
    console.error('cron-jobs[monthly-detective]: unexpected error', err);
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
  if (job === 'category-digest') return runCategoryDigestPush(res);
  if (job === 'monthly-detective') return runMonthlyDetectivePush(res);
  res.status(400).json({ error: 'unknown_job', job });
}

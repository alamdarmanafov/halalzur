// Vercel serverless function — sends one push to everyone (topic-based,
// same BROADCAST_TOPIC as sendBroadcast's "all/all" case) summarizing
// the last 7 days: how many new halal-certified products were added,
// and the single most-scanned product of the week. Fired weekly by
// .github/workflows/weekly-digest.yml — nothing in the app calls this.
//
// Auth + required env vars: same NOTIFY_SECRET/Supabase/Firebase set
// process-scheduled-broadcasts.js already needs — no new setup.
import { getMessaging } from 'firebase-admin/messaging';
import { createClient } from '@supabase/supabase-js';
import { getFirebaseApp } from '../lib/firebaseAdmin.js';

const BROADCAST_TOPIC = 'halalzur_all';

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
    console.error('weekly-digest: unexpected error', err);
    res.status(500).json({ error: err.message });
  }
}

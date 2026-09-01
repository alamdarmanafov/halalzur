// Vercel serverless function — checks whether each certifier's source_url
// still resolves. Runs server-side rather than from the browser because a
// third-party site's CORS policy (or lack of one) can't be relied on for
// a client-side fetch, and a broken/expired certifier link is otherwise
// invisible until someone happens to click it.
//
// Required Vercel environment variables:
//   SUPABASE_ANON_KEY   — same public value embedded in admin-panel/index.html
//   SUPABASE_URL        — same value as EXPO_PUBLIC_SUPABASE_URL
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  if (!process.env.SUPABASE_ANON_KEY || req.headers['x-app-key'] !== process.env.SUPABASE_ANON_KEY) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  if (!process.env.SUPABASE_URL) {
    res.status(500).json({ error: 'supabase_not_configured' });
    return;
  }

  try {
    const listRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/certifiers?select=id,short_name,source_url&source_url=not.is.null`,
      { headers: { apikey: process.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}` } }
    );
    if (!listRes.ok) throw new Error(`certifiers list failed: ${listRes.status}`);
    const certifiers = await listRes.json();

    const results = await Promise.all(
      certifiers.map(async (c) => {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);
          const r = await fetch(c.source_url, { method: 'GET', redirect: 'follow', signal: controller.signal });
          clearTimeout(timeout);
          return { id: c.id, short_name: c.short_name, source_url: c.source_url, ok: r.ok, status: r.status };
        } catch (err) {
          return { id: c.id, short_name: c.short_name, source_url: c.source_url, ok: false, status: null, error: err.message };
        }
      })
    );

    res.status(200).json({ results });
  } catch (err) {
    console.error('check-certifier-links: unexpected error', err);
    res.status(500).json({ error: err.message });
  }
}

// Vercel serverless function — pulls a Wolt venue's product list (name,
// price, barcode when Wolt has one, image) from a pasted wolt.com link,
// for the admin panel's "Linkdən idxal et" flow. Runs server-side
// because Wolt's own CORS policy can't be relied on for a client-side
// fetch, and this also keeps the call off the admin's own IP.
//
// Ported from a proven, already-working implementation
// (github.com/alamdarmanafov/cheapbasket, admin/lib/wolt.ts) — Araz
// Almarket's own online store is itself a Wolt venue (slug "araz"), so
// one Wolt importer covers both Wolt and Araz Almarket; no separate
// Araz-specific scraper is needed. Trimmed down from that source to just
// what halalzur's price-display feature needs (name/price/barcode/
// image) — the category-matching and multi-provider (non-Wolt) parts of
// the original aren't ported since nothing here uses them.
//
// This never touches halal status or certified_entries directly — it
// only returns a preview list for the admin to look at. Matching a
// returned item to an existing product (and where that gets stored) is
// a separate, not-yet-built step; this endpoint is the "pull the data"
// half only.
//
// Required Vercel environment variables:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY — for verifyAdmin()
//
// Auth: verifies the caller's Supabase Auth token belongs to a real
// admin (admin-panel/lib/verifyAdmin.js).
import { verifyAdmin } from '../lib/verifyAdmin.js';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

/** Slug from any Wolt venue URL form: /venue/<slug>, /restaurant/<slug>, ?venue=<slug>, or a bare slug. */
function venueSlug(input) {
  const s = decodeURIComponent(input.trim());
  const m = s.match(/\/(?:venue|restaurant|store)\/([a-z0-9][a-z0-9-]*)/i) ?? s.match(/[?&](?:venue|slug)=([a-z0-9][a-z0-9-]*)/i);
  if (m) return m[1].toLowerCase();
  if (/^[a-z0-9][a-z0-9-]*$/i.test(s) && !/^https?:/i.test(s)) return s.toLowerCase();
  return null;
}

/** Resolve short / share links to a venue slug by following redirects and reading the page. */
async function resolveVenueSlug(input) {
  const direct = venueSlug(input);
  if (direct) return direct;
  const s = input.trim();
  if (/^https?:\/\//i.test(s)) {
    try {
      const res = await fetch(s, { redirect: 'follow', headers: { 'User-Agent': UA, Accept: 'text/html,application/json' } });
      const fromFinal = venueSlug(res.url || '');
      if (fromFinal) return fromFinal;
      const html = await res.text();
      const m = html.match(/\/venue\/([a-z0-9][a-z0-9-]*)/i) ?? html.match(/"slug"\s*:\s*"([a-z0-9][a-z0-9-]*)"/i);
      if (m) return m[1].toLowerCase();
    } catch {
      // fall through to the error below
    }
  }
  throw new Error(`Wolt venue linki tanınmadı: "${s.slice(0, 80)}". Wolt-da marketin səhifəsini aç, ünvan sətrindəki linki kopyala (…/venue/<ad>).`);
}

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json', 'Accept-Language': 'az,en' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : null);
const arr = (v) => (Array.isArray(v) ? v : []);
const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : typeof v === 'number' ? String(v) : null);

/** Wolt prices are integers in minor units (250 = 2.50 AZN); floats are taken as-is. */
function money(v) {
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) v = Number(v);
  if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) return null;
  return Number.isInteger(v) ? v / 100 : Math.round(v * 100) / 100;
}

const isHttp = (v) => typeof v === 'string' && /^https?:\/\//.test(v);

/** Finds a product photo wherever Wolt puts it. */
function firstImage(it) {
  const direct = [it.image_url, it.imageUrl, it.image, it.photo, it.thumbnail, it.picture].find(isHttp);
  if (direct) return direct;
  const lists = [it.images, it.media, it.photos];
  for (const l of lists) {
    for (const i of arr(l)) {
      if (isHttp(i)) return i;
      const o = obj(i);
      const u = o && [o.url, o.src, o.image_url, o.original, o.large, o.medium].find(isHttp);
      if (u) return u;
    }
  }
  return null;
}

function normalise(it) {
  const id = str(it.id) ?? str(it.item_id) ?? str(it._id);
  const name = str(it.name) ?? str(it.title);
  if (!id || !name) return null;
  const price = money(it.price) ?? money(it.baseprice) ?? money(it.base_price) ?? money(obj(it.price)?.amount);
  const orig = money(it.original_price) ?? money(it.original_baseprice) ?? money(it.price_before_discount) ?? money(it.regular_price);
  const bc = str(it.barcode_gtin) ?? str(it.gtin) ?? str(it.barcode) ?? str(it.ean);
  return {
    ext_id: id,
    name,
    price,
    regular_price: orig != null && price != null && orig > price ? orig : null,
    barcode: bc && /^\d{8,14}$/.test(bc) ? bc : null,
    image_url: firstImage(it),
  };
}

/** Collect items from a Wolt payload (items at top level or nested in categories). */
function extract(payload) {
  const p = obj(payload);
  if (!p) return null;
  const root = obj(p.assortment) ?? obj(p.data) ?? p;
  const categories = arr(root.categories);
  const seen = new Map();
  const add = (x) => {
    const o = obj(x);
    const n = o && normalise(o);
    if (n && !seen.has(n.ext_id)) seen.set(n.ext_id, n);
  };
  arr(root.items).forEach(add);
  const walk = (cats) => {
    for (const c of cats) {
      const o = obj(c);
      if (!o) continue;
      arr(o.items).forEach(add);
      walk(arr(o.subcategories ?? o.children));
    }
  };
  walk(categories);
  return { venue: str(obj(root.venue)?.name) ?? '', items: [...seen.values()] };
}

/** Newer consumer API: /assortment lists categories; item bodies come per category. */
async function consumerApi(slug) {
  const base = `https://consumer-api.wolt.com/consumer-api/consumer-assortment/v1/venues/slug/${encodeURIComponent(slug)}/assortment`;
  const top = await getJson(`${base}?language=az`);
  const first = extract(top);
  if (!first) return null;
  const cats = arr(obj(top)?.categories);
  const slugs = cats.map((c) => str(obj(c)?.slug)).filter(Boolean);
  if (first.items.length > 500 || !slugs.length) return first;

  const merged = new Map(first.items.map((i) => [i.ext_id, i]));
  let idx = 0;
  const worker = async () => {
    while (idx < slugs.length) {
      const s = slugs[idx++];
      try {
        const r = extract(await getJson(`${base}/categories/slug/${encodeURIComponent(s)}?language=az`));
        r?.items.forEach((i) => merged.set(i.ext_id, i));
      } catch {
        // skip this category, keep the rest
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(5, slugs.length) }, worker));
  return { ...first, items: [...merged.values()] };
}

/** Older restaurant API: one call with every item. */
async function restaurantApi(slug) {
  const url = `https://restaurant-api.wolt.com/v4/venues/slug/${encodeURIComponent(slug)}/menu?unit_prices=true&show_weighted_items=true&show_subcategories=true`;
  return extract(await getJson(url));
}

async function fetchWoltVenue(input) {
  const slug = await resolveVenueSlug(input);
  const errors = [];
  for (const fn of [consumerApi, restaurantApi]) {
    try {
      const r = await fn(slug);
      if (r && r.items.length) return r;
    } catch (e) {
      errors.push(e.message);
    }
  }
  throw new Error(`Wolt-dan məhsul çəkilmədi. ${errors.join(' | ')}`);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  const admin = await verifyAdmin(req);
  if (!admin) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const { url } = req.body || {};
  if (!url || !String(url).trim()) {
    res.status(400).json({ error: 'missing_url' });
    return;
  }

  try {
    const result = await fetchWoltVenue(String(url));
    res.status(200).json(result);
  } catch (err) {
    console.error('import-source: unexpected error', err);
    res.status(500).json({ error: err.message });
  }
}

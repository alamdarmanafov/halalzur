// Vercel serverless function — pulls a shop page's product list (name,
// price, barcode when the site has one, image) from a pasted link, for
// the admin panel's "Linkdən qiymət çək" flow. Runs server-side because
// a third-party site's CORS policy can't be relied on for a client-side
// fetch, and this also keeps the call off the admin's own IP.
//
// Ported from a proven, already-working implementation
// (github.com/alamdarmanafov/cheapbasket, admin/lib/wolt.ts +
// admin/lib/generic-import.ts), trimmed to what this preview needs
// (name/price/barcode/image — no category-matching).
//
// Two paths, dispatched by URL:
//   - wolt.com / wolt.page.link / Wolt share links → the Wolt consumer/
//     restaurant JSON APIs directly (Araz Almarket's own online store is
//     itself a Wolt venue, slug "araz", so this covers it too — no
//     separate Araz-specific code needed).
//   - any other shop URL → fetchGenericPage: tries, in order, a raw
//     JSON API response, embedded SSR JSON (__NEXT_DATA__ and similar),
//     schema.org JSON-LD, schema.org microdata, OpenGraph product tags,
//     and — only if none of those found anything and OPENAI_API_KEY is
//     set — an AI pass over the page's visible text. Follows pagination
//     up to a time/item budget. Pages that render products only via
//     client-side JavaScript (nothing in the server HTML) can't be read
//     this way; the error message says so and points at the Network-tab
//     workaround (paste the site's own JSON endpoint instead).
//
// This never touches halal status or certified_entries directly — it
// only returns a preview list for the admin to look at. Deciding what
// to do with the results (e.g. inserting barcode-carrying items) happens
// client-side in admin-panel/index.html.
//
// Required Vercel environment variables:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY — for verifyAdmin()
//   OPENAI_API_KEY, OPENAI_MODEL (optional) — only used as the generic
//     path's last-resort fallback; every other extraction strategy works
//     without it.
//
// Auth: verifies the caller's Supabase Auth token belongs to a real
// admin (admin-panel/lib/verifyAdmin.js).
import { verifyAdmin } from '../lib/verifyAdmin.js';

export const config = { maxDuration: 60 };

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : null);
const arr = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);
const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : typeof v === 'number' ? String(v) : null);
const isHttp = (v) => typeof v === 'string' && /^https?:\/\//.test(v);

// ============================== Wolt path ==============================

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

/** Wolt prices are integers in minor units (250 = 2.50 AZN); floats are taken as-is. */
function money(v) {
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) v = Number(v);
  if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) return null;
  return Number.isInteger(v) ? v / 100 : Math.round(v * 100) / 100;
}

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

function normaliseWoltItem(it) {
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
function extractWolt(payload) {
  const p = obj(payload);
  if (!p) return null;
  const root = obj(p.assortment) ?? obj(p.data) ?? p;
  const categories = arr(root.categories);
  const seen = new Map();
  const add = (x) => {
    const o = obj(x);
    const n = o && normaliseWoltItem(o);
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
  const first = extractWolt(top);
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
        const r = extractWolt(await getJson(`${base}/categories/slug/${encodeURIComponent(s)}?language=az`));
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
  return extractWolt(await getJson(url));
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

// =========================== Generic-page path ===========================
// Any shop that isn't Wolt: schema.org JSON-LD / OpenGraph product tags
// (free, exact) first, embedded SSR JSON second, then — only if nothing
// structured was found — the page text goes to OpenAI and comes back as a
// JSON product list. Pages rendered only by client-side JavaScript (no
// products anywhere in the server HTML) can't be read this way.

/** "2,05 ₼", "2.05 AZN", "2 man 5 q" → 2.05 */
function parsePrice(v) {
  if (typeof v === 'number') return Number.isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : null;
  const s = str(v);
  if (!s) return null;
  const m = s.replace(/\s/g, '').match(/(\d+(?:[.,]\d{1,2})?)/);
  if (!m) return null;
  const n = Number(m[1].replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<(br|\/p|\/div|\/li|\/tr|\/h[1-6]|\/article|\/section)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

/**
 * Products embedded in __NEXT_DATA__ / __NUXT_DATA__ / window.__INITIAL_STATE__
 * JSON blobs. These appear on Next.js / Nuxt / other SSR frameworks and
 * contain the full product list without needing AI.
 */
function fromEmbeddedJson(html, base) {
  const blobs = [];
  for (const m of html.matchAll(/<script[^>]*id=["'](?:__NEXT_DATA__|__NUXT_DATA__|__INITIAL_STATE__|__REDUX_STATE__|__APP_STATE__|initial-state)["'][^>]*>([\s\S]*?)<\/script>/gi)) blobs.push(m[1]);
  for (const m of html.matchAll(/window\.__[A-Z_]+__\s*=\s*(\{[\s\S]{200,}?\}|\[[\s\S]{200,}?\])\s*;/g)) blobs.push(m[1]);

  const out = [];
  const seen = new Set();

  const tryItem = (o) => {
    const name = str(o.name ?? o.title ?? o.product_name ?? o.productName);
    const price = parsePrice(o.price ?? o.sell_price ?? o.selling_price ?? o.current_price ?? o.salePrice ?? o.price_value ?? o.price_az ?? o.priceCurrent);
    if (!name || price == null || seen.has(name.toLowerCase())) return;
    seen.add(name.toLowerCase());
    const old = parsePrice(o.old_price ?? o.compare_price ?? o.comparePrice ?? o.regular_price ?? o.originalPrice ?? o.price_old ?? o.crossed_price);
    const img = str(o.image ?? o.image_url ?? o.imageUrl ?? o.thumbnail ?? o.photo ?? o.cover ?? o.main_image ?? o.picture);
    const absImg = img ? (() => { try { return new URL(img, base).toString(); } catch { return null; } })() : null;
    const barcode = str(o.barcode ?? o.ean ?? o.ean13 ?? o.gtin ?? o.gtin13 ?? o.upc);
    const id = str(o.id ?? o.uuid ?? o.sku ?? o.slug ?? o.product_id ?? o.productId ?? o.guid) ?? name;
    out.push({
      ext_id: `${base.hostname}-${id}`,
      name,
      price,
      regular_price: old != null && old > price ? old : null,
      barcode: barcode && /^\d{8,14}$/.test(barcode) ? barcode : null,
      image_url: absImg,
    });
  };

  const walk = (v, depth) => {
    if (depth > 12) return;
    if (Array.isArray(v)) {
      const sample = v.slice(0, 3).map((x) => obj(x)).filter(Boolean);
      const looksLikeProducts = sample.length >= 2 && sample.every((o) => {
        const hasName = !!(o.name ?? o.title ?? o.product_name ?? o.productName);
        const hasPrice = parsePrice(o.price ?? o.sell_price ?? o.selling_price ?? o.current_price ?? o.priceCurrent) != null;
        return hasName && hasPrice;
      });
      if (looksLikeProducts) { v.forEach((x) => { const o = obj(x); if (o) tryItem(o); }); return; }
      v.forEach((x) => walk(x, depth + 1));
      return;
    }
    const o = obj(v);
    if (!o) return;
    for (const val of Object.values(o)) walk(val, depth + 1);
  };

  for (const blob of blobs) {
    try { walk(JSON.parse(blob), 0); } catch { /* broken JSON */ }
    if (out.length > 0) break; // first blob that yields products is enough
  }
  return out;
}

/**
 * Schema.org microdata (itemprop attributes) — used by older / PHP-based
 * shop platforms that don't emit JSON-LD.
 */
function fromMicrodata(html, base) {
  const out = [];
  const blocks = html.split(/<[^>]+itemtype=["'][^"']*Product[^"']*["'][^>]*>/i).slice(1);
  for (const block of blocks) {
    const chunk = block.slice(0, 3000);
    const iProp = (p) =>
      chunk.match(new RegExp(`itemprop=["']${p}["'][^>]+content=["']([^"']+)["']`, 'i'))?.[1] ??
      chunk.match(new RegExp(`itemprop=["']${p}["'][^>]*>([^<]{1,120})<`, 'i'))?.[1]?.trim() ??
      null;
    const name = iProp('name');
    const price = parsePrice(iProp('price'));
    if (!name || price == null) continue;
    const img = iProp('image') ?? chunk.match(/itemprop=["']image["'][^>]+src=["']([^"']+)["']/i)?.[1] ?? null;
    out.push({
      ext_id: iProp('sku') ?? iProp('productID') ?? `${base.hostname}-${name}`,
      name,
      price,
      regular_price: null,
      barcode: null,
      image_url: img ? (() => { try { return new URL(img, base).toString(); } catch { return null; } })() : null,
    });
  }
  return out;
}

/** Products from schema.org JSON-LD blocks. */
function fromJsonLd(html, base) {
  const out = [];
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  const walk = (v) => {
    const o = obj(v);
    if (!o) { arr(v).forEach(walk); return; }
    const type = arr(o['@type']).map(String);
    if (type.includes('Product')) {
      const offers = arr(o.offers).map(obj).filter(Boolean);
      const offer = offers[0];
      const price = parsePrice(offer?.price ?? offer?.lowPrice ?? o.price);
      const name = str(o.name);
      if (name && price != null) {
        const img = str(arr(o.image)[0]) ?? str(obj(arr(o.image)[0])?.url);
        out.push({
          ext_id: str(o.sku) ?? str(o.productID) ?? str(o['@id']) ?? str(o.url) ?? name,
          name,
          price,
          regular_price: null,
          barcode: [o.gtin13, o.gtin, o.gtin14, o.gtin12, o.gtin8].map(str).find((x) => x && /^\d{8,14}$/.test(x)) ?? null,
          image_url: img ? new URL(img, base).toString() : null,
        });
      }
    }
    for (const v2 of Object.values(o)) if (v2 && typeof v2 === 'object') walk(v2);
  };
  for (const b of blocks) {
    try { walk(JSON.parse(b)); } catch { /* ignore broken block */ }
  }
  return out;
}

/** Single product page described with OpenGraph product meta tags. */
function fromOpenGraph(html, base) {
  const meta = (p) => html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${p}["'][^>]+content=["']([^"']+)["']`, 'i'))?.[1] ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${p}["']`, 'i'))?.[1] ?? null;
  const price = parsePrice(meta('product:price:amount') ?? meta('og:price:amount'));
  const name = meta('og:title');
  if (!price || !name) return [];
  const img = meta('og:image');
  return [{ ext_id: base.toString(), name, price, regular_price: null, barcode: null, image_url: img ? new URL(img, base).toString() : null }];
}

/** AI extraction over the visible text (works for any shop layout that renders server-side). */
async function fromAI(text, base) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('Bu səhifədə strukturlu məhsul məlumatı yoxdur; AI ilə oxumaq üçün OPENAI_API_KEY lazımdır');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You extract grocery products from the text of an Azerbaijani supermarket web page. Return JSON {"items":[{"name": string, "price": number|null, "old_price": number|null, "size": string|null, "barcode": string|null}]}. Prices are in AZN (₼/AZN/man). old_price = crossed-out regular price when a discount is shown. Skip navigation, banners and anything that is not a product with a price. Keep the product name as written (brand + name). Max 300 items.' },
        { role: 'user', content: text.slice(0, 60000) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  const raw = j.choices?.[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? '{}');
  const out = [];
  (parsed.items ?? []).forEach((it, i) => {
    const price = parsePrice(it.price);
    const old = parsePrice(it.old_price);
    const name = [it.name, it.size].filter(Boolean).join(' ').trim();
    if (!name || price == null) return;
    out.push({ ext_id: `${base.hostname}-${i}-${name.toLowerCase().replace(/[^a-z0-9əıöüşçğ]+/g, '-')}`, name, price, regular_price: old != null && old > price ? old : null, barcode: it.barcode && /^\d{8,14}$/.test(it.barcode) ? it.barcode : null, image_url: null });
  });
  return out;
}

async function fetchHtml(url) {
  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,application/json', 'Accept-Language': 'az,ru,en' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`Səhifə açılmadı: ${res.status} ${url.hostname}`);
  return res.text();
}

/**
 * If the URL returns raw JSON (a REST/GraphQL product API), parse it
 * directly without going through HTML extraction. Handles paginated APIs
 * that return { items/data/products/results: [...] } or a bare array.
 */
function fromJsonApi(body, base) {
  const trimmed = body.trimStart();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return [];
  let root;
  try { root = JSON.parse(body); } catch { return []; }
  const candidates = [];
  if (Array.isArray(root)) {
    candidates.push(root);
  } else {
    const o = root;
    for (const key of ['items', 'data', 'products', 'results', 'goods', 'catalog', 'list', 'entities', 'rows', 'content']) {
      if (Array.isArray(o[key])) { candidates.push(o[key]); break; }
    }
    if (!candidates.length) {
      for (const v of Object.values(o)) {
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          const inner = v;
          for (const key of ['items', 'data', 'products', 'results', 'goods']) {
            if (Array.isArray(inner[key])) { candidates.push(inner[key]); break; }
          }
          if (candidates.length) break;
        }
      }
    }
  }
  if (!candidates.length) return [];
  const list = candidates[0];
  if (!list.length || typeof list[0] !== 'object') return [];
  const fakeHtml = `<script id="__NEXT_DATA__">${JSON.stringify({ pageProps: { products: list } })}</script>`;
  return fromEmbeddedJson(fakeHtml, base);
}

/** Products of one page: json-api → embedded-JSON → JSON-LD → microdata → OpenGraph → AI over the text. */
async function parsePage(html, base, allowAI) {
  const api = fromJsonApi(html, base);
  if (api.length >= 1) return { items: api, source: 'json-api' };

  const embedded = fromEmbeddedJson(html, base);
  if (embedded.length >= 3) return { items: embedded, source: 'embedded-json' };

  const jld = fromJsonLd(html, base);
  if (jld.length >= 3) return { items: jld, source: 'json-ld' };

  const micro = fromMicrodata(html, base);
  if (micro.length >= 3) return { items: micro, source: 'microdata' };

  const og = fromOpenGraph(html, base);
  if (og.length) return { items: [...jld, ...micro, ...og], source: 'og' };

  if (allowAI) {
    const text = htmlToText(html);
    if (text.length < 200) throw new Error(
      'Səhifə boş gəldi — məhsullar JavaScript ilə yüklənir, server HTML-ə vermir.\n' +
      'Həll: brauzerdə F12 → Network → Fetch/XHR → saytı yenilə → "products", "catalog", "items" adlı sorğunun URL-ini kopyala → buraya yapışdır.'
    );
    const ai = await fromAI(text, base);
    if (ai.length) return { items: ai, source: 'ai' };
  }
  return { items: [...jld, ...micro, ...og, ...embedded], source: 'partial' };
}

/**
 * Next page of a paginated listing. Strategies tried in order: rel=next
 * link, an href with a page-number pattern, incrementing the current
 * URL's own page param, a /page/N pathname, offset-based pagination, and
 * finally a plain ?page=2 guess after a successful first page.
 */
function nextPageUrl(html, current, pageNo, prevCount) {
  const abs = (h) => { try { const u = new URL(h.replace(/&amp;/g, '&'), current); return u.hostname === current.hostname ? u : null; } catch { return null; } };

  const rel = html.match(/<(?:link|a)[^>]+rel=["']next["'][^>]+href=["']([^"']+)["']/i)?.[1] ?? html.match(/<(?:link|a)[^>]+href=["']([^"']+)["'][^>]+rel=["']next["']/i)?.[1];
  if (rel) { const u = abs(rel); if (u && u.toString() !== current.toString()) return u; }

  const want = pageNo + 1;
  for (const m of html.matchAll(/href=["']([^"']+)["']/gi)) {
    const h = m[1].replace(/&amp;/g, '&');
    if (new RegExp(`(?:[?&](?:page|p|pg|pagina|sayfa|stranka|seite)=${want}(?:&|$)|/page/${want}(?:/|$|\\?))`).test(h)) { const u = abs(h); if (u) return u; }
  }

  for (const key of ['page', 'p', 'pg', 'sayfa', 'stranka']) {
    if (current.searchParams.has(key) && /^\d+$/.test(current.searchParams.get(key) ?? '')) {
      const u = new URL(current.toString()); u.searchParams.set(key, String(want)); return u;
    }
  }

  const pm = current.pathname.match(/^(.*\/page\/)(\d+)(\/?)$/);
  if (pm) { const u = new URL(current.toString()); u.pathname = `${pm[1]}${want}${pm[3]}`; return u; }

  const offsetKeys = ['offset', 'start', 'from', 'skip'];
  for (const key of offsetKeys) {
    const cur = current.searchParams.get(key);
    if (cur && /^\d+$/.test(cur)) {
      const u = new URL(current.toString());
      u.searchParams.set(key, String(Number(cur) + prevCount));
      return u;
    }
  }
  if (prevCount > 0) {
    for (const m of html.matchAll(/href=["']([^"']+)["']/gi)) {
      const h = m[1].replace(/&amp;/g, '&');
      for (const key of offsetKeys) {
        if (new RegExp(`[?&]${key}=${prevCount}(?:&|$)`).test(h)) { const u = abs(h); if (u) return u; }
      }
    }
  }

  if (pageNo === 1 && prevCount > 0) {
    const u = new URL(current.toString());
    u.searchParams.set('page', '2');
    return u;
  }

  return null;
}

const MAX_ITEMS = 1000;
const MAX_PAGES = 60;
const TIME_BUDGET_MS = 45_000; // config.maxDuration above allows 60 s

/**
 * Import from any shop page. Follows the listing's pagination (up to
 * MAX_ITEMS products / MAX_PAGES pages / TIME_BUDGET_MS) and returns one
 * entry per product (same name or id on a later page is dropped).
 */
async function fetchGenericPage(input) {
  const started = Date.now();
  const first = new URL(input.trim());
  const seen = new Map();
  const ids = new Set();
  const visited = new Set();
  const sources = new Set();
  let url = first;
  let pageNo = 1;
  let pages = 0;
  const pageParam = first.searchParams.get('page') ?? first.searchParams.get('p');
  if (pageParam && /^\d+$/.test(pageParam)) pageNo = Number(pageParam);
  while (url && pages < MAX_PAGES && seen.size < MAX_ITEMS && Date.now() - started < TIME_BUDGET_MS) {
    if (visited.has(url.toString())) break;
    visited.add(url.toString());
    let html;
    try { html = await fetchHtml(url); } catch (e) { if (pages === 0) throw e; break; }
    const { items, source } = await parsePage(html, url, pages === 0);
    pages += 1;
    sources.add(source);
    let added = 0;
    for (const it of items) {
      const k = it.name.toLowerCase();
      if (seen.has(k) || ids.has(it.ext_id)) continue;
      seen.set(k, it); ids.add(it.ext_id); added += 1;
      if (seen.size >= MAX_ITEMS) break;
    }
    if (pages > 1 && added === 0) break;
    if (!items.length) break;
    url = nextPageUrl(html, url, pageNo, items.length);
    pageNo += 1;
  }
  if (!seen.size) throw new Error(`${first.hostname}: məhsul tapılmadı`);
  return { venue: first.hostname, items: [...seen.values()] };
}

// ============================== Dispatcher ==============================

async function fetchAnySource(input) {
  const s = input.trim();
  if (/wolt\.com|wolt\.page\.link/i.test(s) || !/^https?:\/\//i.test(s)) return fetchWoltVenue(s);
  return fetchGenericPage(s);
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
    const result = await fetchAnySource(String(url));
    res.status(200).json(result);
  } catch (err) {
    console.error('import-source: unexpected error', err);
    res.status(500).json({ error: err.message });
  }
}

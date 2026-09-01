// Vercel serverless function — AI fallback for the admin panel's
// "E-kodları avtomatik tap" button (admin-panel/index.html), used only
// when Open Food Facts (queried directly from the browser, no server
// call needed — see findOffImage's comment for why that's safe) has no
// ingredients_text for the barcode.
//
// Uses OpenAI's Responses API with its web_search tool to search the
// web for the product's ingredient list, then extracts E-codes with our
// own regex from whatever text comes back — the model's own claimed
// E-code list is never trusted directly, only the raw text it cites,
// and the admin panel always shows AI-sourced codes as a review list
// the admin must explicitly confirm before anything is written to the
// database. The halal status itself is never touched by this — that
// stays a human (admin) decision, same as every other product edit.
//
// NOTE ON THE OPENAI RESPONSE SHAPE: this was written without being able
// to reach platform.openai.com's current docs (network-blocked in the
// build environment), so the JSON parsing below is deliberately
// schema-tolerant — it walks the whole response recursively collecting
// every string under a "text" key and every string under a "url" key,
// rather than depending on one exact field path. If OpenAI's response
// shape has moved since this was written, this still has a good chance
// of finding the right text/citation; if calls come back empty even
// though OPENAI_API_KEY is set, check the raw response shape (log it
// temporarily) against the current Responses API docs.
//
// Degrades gracefully: if OPENAI_API_KEY isn't set, returns
// { source: "not_configured" } instead of erroring — this route is
// optional, the OFF-only path already covers most products.
//
// Required Vercel environment variables:
//   OPENAI_API_KEY — from platform.openai.com → API keys
//   OPENAI_MODEL   — optional, defaults to "gpt-4o-mini". Override this
//                     if that model stops supporting the web_search tool.
//
// Auth: same "x-app-key must match the public Supabase anon key"
// pattern as send-broadcast.js/send-user-notification.js.
const ECODE_PATTERN = /E\s?\d{3,4}[a-z]?/gi;

function extractECodes(text) {
  if (!text) return [];
  const matches = text.match(ECODE_PATTERN) || [];
  const normalized = matches.map((m) => m.toUpperCase().replace(/\s+/g, ''));
  return [...new Set(normalized)];
}

// Recursively collects every string value found under the given key
// name anywhere in the object/array tree — see the shape-tolerance note
// above for why this is written this way instead of a fixed field path.
function collectStrings(node, key, out) {
  if (node == null) return;
  if (Array.isArray(node)) {
    node.forEach((v) => collectStrings(v, key, out));
    return;
  }
  if (typeof node === 'object') {
    Object.keys(node).forEach((k) => {
      const v = node[k];
      if (k === key && typeof v === 'string') out.push(v);
      else collectStrings(v, key, out);
    });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  if (!process.env.SUPABASE_ANON_KEY || req.headers['x-app-key'] !== process.env.SUPABASE_ANON_KEY) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const { productName, brand } = req.body || {};
  if (!productName) {
    res.status(400).json({ error: 'missing_fields' });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    res.status(200).json({ source: 'not_configured', ecodes: [] });
    return;
  }

  try {
    const prompt =
      `Search the web for the full ingredients/composition list of the food product "${productName}"` +
      (brand ? ` made by "${brand}"` : '') +
      `. Report the ingredient list exactly as you find it on a manufacturer, retailer, or ingredient-database page, ` +
      `including any E-numbers/E-codes (like E471, E322) exactly as written. Name the source URL you found it on. ` +
      `If you cannot find a real ingredient list for this specific product, say so plainly instead of guessing.`;

    const aiRes = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        tools: [{ type: 'web_search' }],
        input: prompt,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text().catch(() => '');
      console.error('find-ecodes-ai: OpenAI API error', aiRes.status, errText);
      res.status(200).json({ source: 'error', ecodes: [] });
      return;
    }

    const json = await aiRes.json();

    const texts = [];
    collectStrings(json, 'text', texts);
    // The Responses API convenience field, when present, is the
    // cleanest single source of the final answer text.
    if (typeof json.output_text === 'string') texts.unshift(json.output_text);
    const rawText = texts.join('\n').trim();

    const urls = [];
    collectStrings(json, 'url', urls);
    const citation = urls.find((u) => /^https?:\/\//i.test(u)) || null;

    const ecodes = extractECodes(rawText);
    res.status(200).json({ source: 'ai', ecodes, rawText, citation });
  } catch (err) {
    console.error('find-ecodes-ai: unexpected error', err);
    res.status(200).json({ source: 'error', ecodes: [] });
  }
}

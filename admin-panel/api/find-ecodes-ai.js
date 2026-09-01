// Vercel serverless function — AI fallback for the admin panel's
// "E-kodları avtomatik tap" button (admin-panel/index.html), used only
// when Open Food Facts (queried directly from the browser, no server
// call needed — see findOffImage's comment for why that's safe) has no
// ingredients_text for the barcode.
//
// Searches the web via Claude's web_search tool for the product's
// ingredient list, then extracts E-codes with the SAME regex the rest
// of the app uses (ECODE_PATTERN) from whatever text comes back — the
// model's own claimed E-code list is never trusted directly, only the
// raw text it cites, and the admin panel always shows AI-sourced codes
// as a review list the admin must explicitly confirm before anything
// is written to the database. The halal status itself is never touched
// by this — that stays a human (admin) decision, same as every other
// product edit.
//
// Degrades gracefully: if ANTHROPIC_API_KEY isn't set, returns
// { source: "not_configured" } instead of erroring — this route is
// optional, the OFF-only path already covers most products.
//
// Required Vercel environment variable (new, not needed by any other
// route in this project):
//   ANTHROPIC_API_KEY — from console.anthropic.com → API Keys
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

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(200).json({ source: 'not_configured', ecodes: [] });
    return;
  }

  try {
    const query =
      `Search the web for the full ingredients/composition list of the food product "${productName}"` +
      (brand ? ` made by "${brand}"` : '') +
      `. Report the ingredient list exactly as you find it on a manufacturer, retailer, or ingredient-database page, ` +
      `including any E-numbers/E-codes (like E471, E322) exactly as written. Name the source URL you found it on. ` +
      `If you cannot find a real ingredient list for this specific product, say so plainly instead of guessing.`;

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
        messages: [{ role: 'user', content: query }],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text().catch(() => '');
      console.error('find-ecodes-ai: Anthropic API error', aiRes.status, errText);
      res.status(200).json({ source: 'error', ecodes: [] });
      return;
    }

    const json = await aiRes.json();
    const content = json.content || [];
    const rawText = content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    const searchResultBlock = content.find((b) => b.type === 'web_search_tool_result');
    const firstResult =
      searchResultBlock && Array.isArray(searchResultBlock.content) ? searchResultBlock.content[0] : null;
    const citation = (firstResult && firstResult.url) || null;

    const ecodes = extractECodes(rawText);
    res.status(200).json({ source: 'ai', ecodes, rawText, citation });
  } catch (err) {
    console.error('find-ecodes-ai: unexpected error', err);
    res.status(200).json({ source: 'error', ecodes: [] });
  }
}

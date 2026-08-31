import { PDFParse } from 'pdf-parse';
import { SyncedEntry } from './types';

/**
 * ⚠️ UNVERIFIED — this URL was found via web search, not by browsing the
 * live GIMDES site (this sandbox's network egress is policy-blocked from
 * reaching gimdes.org). Before relying on this, open
 * https://www.gimdes.org/helal-sertifikali-firmalarin-listesi.html
 * yourself, confirm/copy the current PDF link, and override it with the
 * GIMDES_PDF_URL env var if it has changed.
 */
const DEFAULT_GIMDES_PDF_URL =
  process.env.GIMDES_PDF_URL ??
  'https://www.gimdes.org/wp-content/uploads/2013/12/helal-sertifikali-firmalar-listesi.pdf';

const NOISE_PATTERNS = [
  /^\d+$/, // bare page numbers
  /^sayfa\b/i,
  /^page\b/i,
  /gimdes/i, // header/footer repeats the org name
  /^www\./i,
  /^https?:\/\//i,
  /^\d{1,2}[./]\d{1,2}[./]\d{2,4}$/, // a lone date
];

function looksLikeNoise(line: string): boolean {
  if (line.length < 3 || line.length > 120) return true;
  return NOISE_PATTERNS.some((pattern) => pattern.test(line));
}

/**
 * Best-effort line-based parser: GIMDES's published list is (as far as we
 * could tell from search results, not direct inspection) essentially one
 * certified company/brand name per line. This has NOT been validated
 * against the real PDF's actual layout — run with --dry-run first and
 * eyeball the output before trusting it, and adjust this function to
 * match what you actually see (e.g. if entries are "Company — Category"
 * on one line, or come in multi-column table form that pdf-parse
 * flattens differently than expected).
 */
export function parseGimdesText(rawText: string): string[] {
  const lines = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !looksLikeNoise(line));

  return Array.from(new Set(lines));
}

export async function fetchGimdesEntries(): Promise<SyncedEntry[]> {
  const parser = new PDFParse({ url: DEFAULT_GIMDES_PDF_URL });
  const result = await parser.getText();
  const brands = parseGimdesText(result.text);

  return brands.map((brand) => ({
    entry_type: 'company',
    barcode: null,
    product_name: null,
    brand,
    category: null,
    status: 'halal',
    certifier_id: 'gimdes',
    certificate_number: null,
    verified_at: null,
    ingredients: [],
    notes: null,
    image_url: null,
    source_url: DEFAULT_GIMDES_PDF_URL,
  }));
}

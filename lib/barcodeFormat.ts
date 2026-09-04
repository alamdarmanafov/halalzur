/**
 * Best-effort barcode symbology guess from digit length alone — the app
 * never receives the scanner's raw format string once a code reaches this
 * screen (from history, deep link, or manual entry), so this infers it the
 * same way retail POS systems commonly do, purely for display.
 */
export function detectBarcodeFormat(barcode: string): string {
  const digits = barcode.trim();
  if (!/^\d+$/.test(digits)) return 'CODE128';
  switch (digits.length) {
    case 8:
      return 'EAN-8';
    case 12:
      return 'UPC-A';
    case 13:
      return 'EAN-13';
    default:
      return 'CODE128';
  }
}

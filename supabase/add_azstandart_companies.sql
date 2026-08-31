-- AZSTANDART-certified companies (source: user-provided news articles,
-- Aug 2026). These are brand/company-level halal certifications, not
-- individual barcoded products — same shape as most GIMDES entries
-- (entry_type = 'company', barcode left null, matched by brand text
-- search in the app rather than a scanned barcode). Run once in
-- Supabase → SQL Editor.
insert into certified_entries (entry_type, brand, status, certifier_id, verified_at, notes, source_url) values
  ('company', 'Min bərəkət', 'halal', 'azstandart', current_date,
   'Səhliyalı müəssisəsinin "Min bərəkət" ticarət nişanı — AZSTANDART Halal sertifikatı alıb.',
   'https://qaynarinfo.az/az/bu-muessiseler-quothalalquot-sertifikati-aldi-siyahi'),
  ('company', 'Halal nemət', 'halal', 'azstandart', current_date,
   'Səhliyalı müəssisəsinin "Halal nemət" ticarət nişanı — AZSTANDART Halal sertifikatı alıb.',
   'https://qaynarinfo.az/az/bu-muessiseler-quothalalquot-sertifikati-aldi-siyahi'),
  ('company', 'Kral', 'halal', 'azstandart', current_date,
   'Hakan Foods Azərbaycan Trading Co. Ltd MMC-nin "Kral" ticarət nişanı — AZSTANDART Halal sertifikatı alıb.',
   'https://qaynarinfo.az/az/bu-muessiseler-quothalalquot-sertifikati-aldi-siyahi'),
  ('company', 'Yeni dad', 'halal', 'azstandart', current_date,
   'Hakan Foods Azərbaycan Trading Co. Ltd MMC-nin "Yeni dad" ticarət nişanı — AZSTANDART Halal sertifikatı alıb.',
   'https://qaynarinfo.az/az/bu-muessiseler-quothalalquot-sertifikati-aldi-siyahi'),
  ('company', 'AZ Protein Foods Group', 'halal', 'azstandart', current_date,
   'Halal qaydalara uyğun kəsilmiş ət məhsulları — AZSTANDART Halal sertifikatı alıb.',
   'https://qaynarinfo.az/az/bu-muessiseler-quothalalquot-sertifikati-aldi-siyahi'),
  ('company', 'SAB', 'halal', 'azstandart', current_date,
   'Zəhmət Ruzi MMC-nin "SAB" ticarət nişanı — AZSTANDART Halal sertifikatı alıb.',
   'https://qaynarinfo.az/az/bu-muessiseler-quothalalquot-sertifikati-aldi-siyahi'),
  ('company', 'M&T', 'halal', 'azstandart', current_date,
   'M&T LTD firması — AZSTANDART Halal sertifikatı alıb.',
   'https://qaynarinfo.az/az/bu-muessiseler-quothalalquot-sertifikati-aldi-siyahi');

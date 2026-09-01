-- AZSTANDART-certified companies (source: user-provided news articles,
-- Aug 2026). These are brand/company-level halal certifications, not
-- individual barcoded products — same shape as most GIMDES entries
-- (entry_type = 'company', barcode left null, matched by brand text
-- search in the app rather than a scanned barcode). Run once in
-- Supabase → SQL Editor.

-- This project's certifiers table never got this row inserted (schema.sql
-- gained it after the initial setup ran) — certified_entries.certifier_id
-- has a foreign key into certifiers, so this must exist first.
insert into certifiers (id, name, short_name, country, source_url) values
  ('azstandart', 'AZSTANDART Halal Sertifikatlaşdırma Orqanı (Azərbaycan Standartlaşdırma İnstitutu)', 'AZSTANDART', 'Azərbaycan', 'https://azstandart.az/')
on conflict (id) do nothing;

-- INSERT ... SELECT ... WHERE NOT EXISTS instead of a plain multi-row
-- VALUES insert — makes this safe to run more than once. A plain INSERT
-- doesn't know these company-level rows have no barcode to check a
-- unique constraint against (Postgres never treats NULL as equal to
-- NULL for uniqueness), so running this file twice previously created
-- duplicate rows for every brand below, silently, with no error.
insert into certified_entries (entry_type, brand, status, certifier_id, verified_at, notes, source_url)
select v.entry_type, v.brand, v.status, v.certifier_id, v.verified_at, v.notes, v.source_url
from (values
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
   'https://qaynarinfo.az/az/bu-muessiseler-quothalalquot-sertifikati-aldi-siyahi')
) as v(entry_type, brand, status, certifier_id, verified_at, notes, source_url)
where not exists (
  select 1 from certified_entries ce
  where ce.brand = v.brand and ce.certifier_id = v.certifier_id and ce.barcode is null
);

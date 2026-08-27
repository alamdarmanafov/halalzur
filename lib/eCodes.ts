import { ECodeEntry, ECodeStatus } from './types';

/**
 * Fixed E-code (food additive) classification, following the categories
 * halal-certification bodies (GIMDES, HAK/SMIIC-aligned guides, JAKIM)
 * publish for consumers: "halal", "haram", "mushbooh" (doubtful — commonly
 * flagged, opinions vary between certifiers/madhabs), and "depends" (the
 * code itself is neutral; status hinges on the raw material's source,
 * which the label alone cannot tell you).
 *
 * This is a lookup table, not an AI verdict — Halalzur never infers status
 * from ingredient text; it only reports what's in this table. Treat it as
 * a starting reference, not a substitute for an official certificate: the
 * definitive source is always the certifier's own current publication.
 */
export const E_CODES: ECodeEntry[] = [
  { code: 'E100', name: 'Kurkumin', category: 'Rəngləyici', status: 'halal', note: 'Bitki mənşəli (zərçöp).' },
  {
    code: 'E120',
    name: 'Karmin / Koşenil',
    category: 'Rəngləyici',
    status: 'mushbooh',
    note: 'Həşərat (koşenil böcəyi) mənşəlidir. Bəzi sertifikat orqanları icazə verir, bəziləri şübhəli sayır.',
  },
  { code: 'E140', name: 'Xlorofil', category: 'Rəngləyici', status: 'halal', note: 'Bitki mənşəli.' },
  {
    code: 'E150a-d',
    name: 'Karamel rəngi',
    category: 'Rəngləyici',
    status: 'depends',
    note: 'İstehsal prosesində spirtdən istifadə oluna bilər — mənbəyə görə dəyişir.',
  },
  {
    code: 'E153',
    name: 'Bitki kömürü / Karbon qara',
    category: 'Rəngləyici',
    status: 'depends',
    note: 'Bəzən heyvan sümüyündən alınan kömür istifadə oluna bilər.',
  },
  { code: 'E160a', name: 'Karotinlər', category: 'Rəngləyici', status: 'halal', note: 'Bitki mənşəli.' },
  {
    code: 'E252',
    name: 'Kalium nitrat',
    category: 'Qoruyucu',
    status: 'mushbooh',
    note: 'Ət məhsullarında istifadə olunur, ətin mənşəyi halal olmalıdır.',
  },
  {
    code: 'E322',
    name: 'Lesitin',
    category: 'Emulqator',
    status: 'depends',
    note: 'Ən çox soyadan (halal), nadir hallarda yumurta/heyvan mənşəli ola bilər.',
  },
  {
    code: 'E422',
    name: 'Qliserin (Qliserol)',
    category: 'Nəmləndirici',
    status: 'depends',
    note: 'Bitki yağından və ya heyvan piyindən alına bilər.',
  },
  {
    code: 'E430-436',
    name: 'Polioksietilen törəmələri',
    category: 'Emulqator',
    status: 'mushbooh',
    note: 'Yağ turşusu mənbəyi (bitki/heyvan) etiketdə göstərilmir.',
  },
  {
    code: 'E441',
    name: 'Jelatin',
    category: 'Sabitləşdirici',
    status: 'depends',
    note: 'Donuzdan olarsa haram, halal kəsilmiş heyvan və ya balıqdan olarsa halal.',
  },
  {
    code: 'E471',
    name: 'Yağ turşularının mono- və digliseridləri',
    category: 'Emulqator',
    status: 'depends',
    note: 'Ən çox bitki yağından, lakin heyvan piyindən də ola bilər — mənbə qeyri-müəyyəndir.',
  },
  {
    code: 'E472',
    name: 'Mono- və digliseridlərin efirləri',
    category: 'Emulqator',
    status: 'depends',
    note: 'E471 kimi, mənbəyi göstərilmədikcə şübhəlidir.',
  },
  {
    code: 'E542',
    name: 'Yeyilə bilən sümük fosfatı',
    category: 'Anti-kekləşdirici',
    status: 'mushbooh',
    note: 'Heyvan sümüyündən alınır, kəsim üsulu bilinmir.',
  },
  {
    code: 'E631',
    name: 'Dinatrium inozinat',
    category: 'Dad gücləndirici',
    status: 'depends',
    note: 'Ət və ya balıqdan alına bilər, mənbə etiketdə aydın deyil.',
  },
  {
    code: 'E635',
    name: 'Dinatrium 5-ribonukleotidlər',
    category: 'Dad gücləndirici',
    status: 'depends',
    note: 'E631-ə bənzər, ət/balıq mənşəyi qarışıq ola bilər.',
  },
  {
    code: 'E904',
    name: 'Şellak',
    category: 'Parlaqlaşdırıcı',
    status: 'halal',
    note: 'Həşərat qatranıdır, əksər sertifikat orqanları halal sayır (qan/ət deyil).',
  },
  {
    code: 'E920',
    name: 'L-Sistein',
    category: 'Un təkmilləşdirici',
    status: 'mushbooh',
    note: 'Ənənəvi olaraq insan/donuz saçından alınır, bəzi istehsalçılar sintetik istifadə edir.',
  },
  {
    code: 'E1105',
    name: 'Lizozim',
    category: 'Qoruyucu',
    status: 'depends',
    note: 'Adətən yumurtadan alınır (halal), amma mənbə yoxlanmalıdır.',
  },
  {
    code: 'E1519',
    name: 'Benzil spirti',
    category: 'Həlledici',
    status: 'mushbooh',
    note: 'Spirt əsaslıdır — miqdar və mənbəyə görə fərqli fətvalar var.',
  },
  {
    code: 'E1520',
    name: 'Propilen qlikol',
    category: 'Nəmləndirici',
    status: 'halal',
    note: 'Sintetik mənşəlidir, əksər sertifikat orqanları halal sayır.',
  },
];

export function findECode(query: string): ECodeEntry | undefined {
  const q = query.trim().toUpperCase().replace(/\s+/g, '');
  return E_CODES.find((e) => e.code.toUpperCase().replace(/\s+/g, '') === q);
}

export function searchECodes(query: string): ECodeEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return E_CODES;
  return E_CODES.filter(
    (e) =>
      e.code.toLowerCase().includes(q) ||
      e.name.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q)
  );
}

/** Pulls every "E123" / "E123a" style token out of free-form ingredient text. */
export function extractECodesFromText(text: string): ECodeEntry[] {
  const matches = text.match(/E\s?-?\s?\d{3,4}[a-h]?/gi) ?? [];
  const found = new Map<string, ECodeEntry>();
  for (const raw of matches) {
    const normalized = raw.toUpperCase().replace(/[\s-]/g, '');
    const entry = E_CODES.find((e) => e.code.toUpperCase().startsWith(normalized.slice(0, 4)));
    if (entry) found.set(entry.code, entry);
  }
  return Array.from(found.values());
}

export const eCodeStatusLabel: Record<ECodeStatus, string> = {
  halal: 'Halal',
  haram: 'Halal deyil',
  mushbooh: 'Şübhəli',
  depends: 'Mənbədən asılıdır',
};

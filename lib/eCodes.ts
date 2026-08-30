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
    code: 'E101',
    name: 'Riboflavin (B2 vitamini)',
    category: 'Rəngləyici',
    status: 'depends',
    note: 'Çox vaxt sintetik/mikrobial mənbədən, nadir hallarda heyvan mənşəli ola bilər.',
  },
  { code: 'E102', name: 'Tartrazin', category: 'Rəngləyici', status: 'halal', note: 'Tam sintetik mənşəlidir.' },
  { code: 'E110', name: 'Gün batımı sarısı', category: 'Rəngləyici', status: 'halal', note: 'Tam sintetik mənşəlidir.' },
  { code: 'E122', name: 'Karmoizin', category: 'Rəngləyici', status: 'halal', note: 'Tam sintetik mənşəlidir.' },
  { code: 'E124', name: 'Ponso 4R', category: 'Rəngləyici', status: 'halal', note: 'Tam sintetik mənşəlidir.' },
  { code: 'E127', name: 'Eritrozin', category: 'Rəngləyici', status: 'halal', note: 'Tam sintetik mənşəlidir.' },
  { code: 'E131', name: 'Patent göy', category: 'Rəngləyici', status: 'halal', note: 'Tam sintetik mənşəlidir.' },
  { code: 'E132', name: 'İndiqotin', category: 'Rəngləyici', status: 'halal', note: 'Tam sintetik mənşəlidir.' },
  { code: 'E141', name: 'Xlorofilin mis kompleksləri', category: 'Rəngləyici', status: 'halal', note: 'Bitki mənşəli.' },
  { code: 'E142', name: 'Yaşıl S', category: 'Rəngləyici', status: 'halal', note: 'Tam sintetik mənşəlidir.' },
  { code: 'E160b', name: 'Annato', category: 'Rəngləyici', status: 'halal', note: 'Bitki mənşəli (annato toxumu).' },
  { code: 'E161', name: 'Ksantofillər', category: 'Rəngləyici', status: 'halal', note: 'Bitki mənşəli.' },
  { code: 'E162', name: 'Çuğundur qırmızısı', category: 'Rəngləyici', status: 'halal', note: 'Bitki mənşəli (çuğundur).' },
  { code: 'E163', name: 'Antosianinlər', category: 'Rəngləyici', status: 'halal', note: 'Bitki mənşəli.' },
  { code: 'E170', name: 'Kalsium karbonat', category: 'Rəngləyici', status: 'halal', note: 'Mineral mənşəli.' },
  { code: 'E200', name: 'Sorbin turşusu', category: 'Qoruyucu', status: 'halal', note: 'Sintetik/bitki mənşəli.' },
  { code: 'E202', name: 'Kalium sorbat', category: 'Qoruyucu', status: 'halal', note: 'Sintetik/bitki mənşəli.' },
  { code: 'E211', name: 'Natrium benzoat', category: 'Qoruyucu', status: 'halal', note: 'Sintetik mənşəlidir.' },
  { code: 'E220', name: 'Kükürd dioksid', category: 'Qoruyucu', status: 'halal', note: 'Qeyri-üzvi mənşəlidir.' },
  { code: 'E223', name: 'Natrium metabisulfit', category: 'Qoruyucu', status: 'halal', note: 'Qeyri-üzvi mənşəlidir.' },
  {
    code: 'E250',
    name: 'Natrium nitrit',
    category: 'Qoruyucu',
    status: 'mushbooh',
    note: 'Əsasən emal olunmuş ət məhsullarında istifadə olunur — ətin mənşəyi halal olmalıdır.',
  },
  {
    code: 'E251',
    name: 'Natrium nitrat',
    category: 'Qoruyucu',
    status: 'mushbooh',
    note: 'E250 kimi, əsasən ət məhsullarında — ətin mənşəyi halal olmalıdır.',
  },
  {
    code: 'E300',
    name: 'Askorbin turşusu (C vitamini)',
    category: 'Antioksidant',
    status: 'depends',
    note: 'Adətən bitki/qarğıdalı nişastasından, nadir hallarda heyvan mənşəli fermentasiya mühiti istifadə oluna bilər.',
  },
  {
    code: 'E304',
    name: 'Askorbil palmitat',
    category: 'Antioksidant',
    status: 'depends',
    note: 'Yağ turşusu hissəsi bitki və ya heyvan mənşəli ola bilər.',
  },
  {
    code: 'E306-309',
    name: 'Tokoferollar (E vitamini)',
    category: 'Antioksidant',
    status: 'depends',
    note: 'Çox vaxt soyadan (halal), nadir hallarda heyvan mənşəli ola bilər.',
  },
  { code: 'E320', name: 'BHA (Butilhidroksianizol)', category: 'Antioksidant', status: 'halal', note: 'Tam sintetik mənşəlidir.' },
  { code: 'E321', name: 'BHT (Butilhidroksitoluol)', category: 'Antioksidant', status: 'halal', note: 'Tam sintetik mənşəlidir.' },
  {
    code: 'E325-327',
    name: 'Laktatlar (Na/K/Ca)',
    category: 'Antioksidant',
    status: 'depends',
    note: 'Süd turşusundan alınır — mənbə bitki fermentasiyası və ya süd məhsulu ola bilər.',
  },
  { code: 'E330', name: 'Sitrik turşu', category: 'Turşuluq tənzimləyici', status: 'halal', note: 'Adətən mikrob fermentasiyası ilə alınır.' },
  { code: 'E334', name: 'Tartar turşusu', category: 'Turşuluq tənzimləyici', status: 'halal', note: 'Bitki mənşəli (üzüm).' },
  { code: 'E339-341', name: 'Fosfatlar (Na/K/Ca)', category: 'Turşuluq tənzimləyici', status: 'halal', note: 'Mineral mənşəlidir.' },
  { code: 'E407', name: 'Karragenan', category: 'Sabitləşdirici', status: 'halal', note: 'Dəniz yosunundan (bitki mənşəli).' },
  { code: 'E410', name: 'Keçiboynuzu qatranı', category: 'Sabitləşdirici', status: 'halal', note: 'Bitki mənşəli.' },
  { code: 'E412', name: 'Guar qatranı', category: 'Sabitləşdirici', status: 'halal', note: 'Bitki mənşəli.' },
  { code: 'E414', name: 'Ərəb qatranı', category: 'Sabitləşdirici', status: 'halal', note: 'Bitki mənşəli.' },
  { code: 'E415', name: 'Ksantan qatranı', category: 'Sabitləşdirici', status: 'halal', note: 'Mikrob fermentasiyası ilə alınır.' },
  { code: 'E420', name: 'Sorbitol', category: 'Şirinləşdirici', status: 'halal', note: 'Bitki mənşəlidir.' },
  { code: 'E421', name: 'Mannitol', category: 'Şirinləşdirici', status: 'halal', note: 'Bitki mənşəlidir.' },
  { code: 'E440', name: 'Pektin', category: 'Sabitləşdirici', status: 'halal', note: 'Bitki mənşəli (meyvə qabığı).' },
  {
    code: 'E442',
    name: 'Ammonium fosfatidlər',
    category: 'Emulqator',
    status: 'depends',
    note: 'Yağ turşusu hissəsi bitki və ya heyvan mənşəli ola bilər.',
  },
  {
    code: 'E470a-b',
    name: 'Yağ turşularının duzları',
    category: 'Emulqator',
    status: 'depends',
    note: 'E471 kimi mənbəyə görə dəyişir.',
  },
  {
    code: 'E473',
    name: 'Sukroza efirləri',
    category: 'Emulqator',
    status: 'depends',
    note: 'Yağ turşusu mənbəyi bitki və ya heyvan ola bilər.',
  },
  {
    code: 'E475',
    name: 'Poliqliserol efirləri',
    category: 'Emulqator',
    status: 'depends',
    note: 'Yağ turşusu mənbəyi bitki və ya heyvan ola bilər.',
  },
  {
    code: 'E476',
    name: 'PGPR (Poliqliserol polirisinoleat)',
    category: 'Emulqator',
    status: 'depends',
    note: 'Adətən bitki (kastor yağı) mənşəlidir, amma etiketdə göstərilməyə bilər.',
  },
  {
    code: 'E481',
    name: 'Natrium stearoil laktilat',
    category: 'Emulqator',
    status: 'depends',
    note: 'Yağ turşusu mənbəyi bitki və ya heyvan ola bilər.',
  },
  {
    code: 'E483',
    name: 'Stearil tartrat',
    category: 'Emulqator',
    status: 'depends',
    note: 'Yağ turşusu mənbəyi bitki və ya heyvan ola bilər.',
  },
  { code: 'E500-501', name: 'Natrium/Kalium karbonatlar', category: 'Turşuluq tənzimləyici', status: 'halal', note: 'Mineral mənşəlidir.' },
  { code: 'E503', name: 'Ammonium karbonat', category: 'Turşuluq tənzimləyici', status: 'halal', note: 'Sintetik mənşəlidir.' },
  { code: 'E504', name: 'Maqnezium karbonat', category: 'Turşuluq tənzimləyici', status: 'halal', note: 'Mineral mənşəlidir.' },
  { code: 'E526', name: 'Kalsium hidroksid', category: 'Turşuluq tənzimləyici', status: 'halal', note: 'Mineral mənşəlidir.' },
  {
    code: 'E620-621',
    name: 'Qlutamin turşusu / MSG',
    category: 'Dad gücləndirici',
    status: 'halal',
    note: 'Adətən bitki fermentasiyası ilə (nişasta, çuğundur) alınır.',
  },
  {
    code: 'E627',
    name: 'Dinatrium guanilat',
    category: 'Dad gücləndirici',
    status: 'depends',
    note: 'Balıqdan və ya fermentasiya yolu ilə alına bilər — mənbə etiketdə göstərilmir.',
  },
  { code: 'E901', name: 'Bal mumu', category: 'Parlaqlaşdırıcı', status: 'halal', note: 'Arı mumundan, halal sayılır.' },
  { code: 'E903', name: 'Karnauba mumu', category: 'Parlaqlaşdırıcı', status: 'halal', note: 'Bitki mənşəli (palma yarpağı).' },
  { code: 'E905', name: 'Mineral / parafin mum', category: 'Parlaqlaşdırıcı', status: 'halal', note: 'Neft mənşəlidir (mineral).' },
  { code: 'E927b', name: 'Karbamid', category: 'Un təkmilləşdirici', status: 'halal', note: 'Sintetik mənşəlidir.' },
  { code: 'E950', name: 'Asesulfam K', category: 'Şirinləşdirici', status: 'halal', note: 'Tam sintetik mənşəlidir.' },
  { code: 'E951', name: 'Aspartam', category: 'Şirinləşdirici', status: 'halal', note: 'Tam sintetik mənşəlidir.' },
  { code: 'E952', name: 'Siklamat', category: 'Şirinləşdirici', status: 'halal', note: 'Tam sintetik mənşəlidir.' },
  { code: 'E954', name: 'Saxarin', category: 'Şirinləşdirici', status: 'halal', note: 'Tam sintetik mənşəlidir.' },
  { code: 'E955', name: 'Sukraloz', category: 'Şirinləşdirici', status: 'halal', note: 'Tam sintetik mənşəlidir.' },
  {
    code: 'E1400-1450',
    name: 'Modifikasiya olunmuş nişastalar',
    category: 'Qatılaşdırıcı',
    status: 'halal',
    note: 'Bitki mənşəli (qarğıdalı, kartof və s.).',
  },
  {
    code: 'E1518',
    name: 'Qliseril triasetat',
    category: 'Nəmləndirici',
    status: 'depends',
    note: 'Bitki və ya heyvan mənşəli qliserindən alına bilər.',
  },
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
    note: 'Donuzdan olarsa tövsiyə edilmir, halal kəsilmiş heyvan və ya balıqdan olarsa halal.',
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
  haram: 'Tövsiyə edilmir',
  mushbooh: 'Şübhəli',
  depends: 'Mənbədən asılıdır',
};

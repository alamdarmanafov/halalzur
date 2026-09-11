import { ECodeEntry, ECodeStatus } from './types';
import { TranslationKey } from './i18n';
import { supabase, isSupabaseConfigured } from './supabase';

export const ECODE_STATUS_LABEL_KEY: Record<ECodeStatus, TranslationKey> = {
  halal: 'ecodeStatusHalal',
  haram: 'ecodeStatusHaram',
  mushbooh: 'ecodeStatusMushbooh',
  depends: 'ecodeStatusDepends',
};

/**
 * E-code (food additive) classification sourced from Halalzur's own
 * curated database (Halalzur_E_Codes_Database_v1.xlsx — built on the
 * European Commission Food Additives Database / EFSA data, with a halal
 * status column added on top). Categories follow that spreadsheet's own
 * classification: "halal", "haram", "mushbooh" (doubtful — commonly
 * flagged, opinions vary between certifiers/madhabs), and "depends" (the
 * code itself is neutral; status hinges on the raw material's source,
 * which the label alone cannot tell you — this is the spreadsheet's
 * "ŞÜBHƏLİ" + Source_Dependent=true rows).
 *
 * This is a lookup table, not an AI verdict — Halalzur never infers status
 * from ingredient text; it only reports what's in this table. Treat it as
 * a starting reference, not a substitute for an official certificate: the
 * definitive source is always the certifier's own current publication.
 *
 * E160b(i)/E160b(ii) (Annatto bixin/norbixin) are merged into a single
 * E160b entry — ingredient labels never print the sub-index, so scanned
 * text can't distinguish them anyway.
 *
 * `note` text is shown directly to end users (ECodeCard component, in the
 * E-kodlar guide screen, ingredient chip list, and tap-triggered tooltip
 * on the product screen) — write it as reader-facing explanation, not an
 * internal admin comment. Non-Azerbaijani text comes from
 * lib/eCodeTranslations.ts, keyed by the exact Azerbaijani string below;
 * a note without a matching translation entry falls back to showing this
 * Azerbaijani text untranslated (see translateECodeNote()) — not broken,
 * just untranslated, same as any note that predates its translation.
 */
export const E_CODES: ECodeEntry[] = [
  { code: "E100", name: "Curcumin", category: "Rəngləndirici", status: "halal", note: "Zərdəçal (Curcuma longa) kökündən alınan sarı-narıncı rəngləyicidir — tərkibindəki kurkumin piqmenti bitki mənşəlidir. Adətən xardal, pendir, kərə yağı, çips və içkilərdə istifadə olunur. Heyvan mənşəli tərkib hissəsi olmadığı üçün bütün sertifikat orqanları tərəfindən halal qəbul edilir." },
  { code: "E101", name: "Riboflavins", category: "Rəngləndirici / vitamin", status: "halal", note: "Vitamin B2 — sarı-narıncı rəngləyici, makaron, souslar və taxıl məhsullarında istifadə olunur. Təbiətdə süd, yumurta və ciyərdə olsa da, sənaye miqyasında demək olar həmişə bakteriya/göbələk fermentasiyası ilə (məs. Bacillus subtilis) istehsal olunur — bu üsul heyvan mənşəli deyil, halal." },
  { code: "E102", name: "Tartrazine", category: "Rəngləndirici", status: "halal", note: "Neft əsaslı xammaldan tam sintetik yolla alınan sarı azo boyadır — sərinləşdirici içkilər, şirniyyat və çipslərdə istifadə olunur. Heyvan mənşəli tərkibi yoxdur, halaldır (AB-də uşaqlarda hiperaktivlik riski ilə əlaqədar etiketdə xəbərdarlıq tələb olunur, lakin bu halallıqla bağlı deyil, qida təhlükəsizliyi məsələsidir)." },
  { code: "E104", name: "Quinoline Yellow", category: "Rəngləndirici", status: "halal", note: "Tam sintetik sarı boyadır — hisə verilmiş balıq, bəzi içki və qənnadı məmulatlarında istifadə olunur. Heyvan mənşəli tərkibi yoxdur, halaldır." },
  { code: "E110", name: "Sunset Yellow FCF", category: "Rəngləndirici", status: "halal", note: "Neft əsaslı sintetik narıncı-sarı azo boyadır — sərinləşdirici içkilər, desertlər və souslarda istifadə olunur. Halaldır." },
  { code: "E120", name: "Carminic acid / Carmine", category: "Rəngləndirici", status: "haram", note: "Koşenil (Dactylopius coccus) adlı həşəratın dişi fərdlərinin qurudulub əzilməsi ilə alınan qırmızı rəngləyicidir (digər adları: Karmin, Natural Red 4, Crimson Lake, Cochineal Extract). İçki, şirniyyat, kolbasa/sosis, yoğurt və kosmetikada (məs. dodaq boyası) istifadə olunur. Həşərat mənşəli olduğuna görə GIMDES və əksər halal sertifikat orqanları tərəfindən haram sayılır — həşəratların hökmü barədə fəqihlər arasında fərqli baxışlar olsa da, tətbiqdəki status ehtiyatlı (əksəriyyət) mövqeyi əks etdirir." },
  { code: "E122", name: "Azorubine / Carmoisine", category: "Rəngləndirici", status: "halal", note: "Tam sintetik qırmızı azo boyadır (adından fərqli olaraq koşenillə əlaqəsi yoxdur) — mürəbbə, marsipan və spirtli içkilərdə istifadə olunur. Halaldır." },
  { code: "E123", name: "Amaranth", category: "Rəngləndirici", status: "halal", note: "Tam sintetik bənövşəyi-qırmızı azo boyadır — kürü, bəzi içki və şirniyyatda istifadə olunur (xərçəng riski şübhələri ilə ABŞ-da 1976-dan qadağandır, AB-də icazəlidir). Heyvan mənşəli deyil, halaldır." },
  { code: "E124", name: "Ponceau 4R / Cochineal Red A", category: "Rəngləndirici", status: "halal", note: "Adında \"Cochineal\" olsa da, koşenil həşəratı ilə əlaqəsi yoxdur — tam sintetik azo boyadır. Desert, şorba və souslarda istifadə olunur. Halaldır." },
  { code: "E127", name: "Erythrosine", category: "Rəngləndirici", status: "halal", note: "Tərkibində yod olan sintetik çəhrayı-qırmızı boyadır — kokteyl/qlyase albalılarda və konservləşdirilmiş meyvələrdə istifadə olunur. Halaldır." },
  { code: "E129", name: "Allura Red AC", category: "Rəngləndirici", status: "halal", note: "Tam sintetik qırmızı azo boyadır — sərinləşdirici içkilər, souslar və çipslərdə geniş istifadə olunur. Halaldır." },
  { code: "E131", name: "Patent Blue V", category: "Rəngləndirici", status: "halal", note: "Tam sintetik mavi boyadır — bəzi pendir və dondurma növlərində istifadə olunur. Halaldır." },
  { code: "E132", name: "Indigotine / Indigo carmine", category: "Rəngləndirici", status: "halal", note: "Sintetik mavi boyadır (cins şalvar boyamaqda istifadə olunan indiqo ilə eyni sinifdəndir, lakin qida keyfiyyətlidir) — şirniyyat və dondurmada istifadə olunur. Halaldır." },
  { code: "E133", name: "Brilliant Blue FCF", category: "Rəngləndirici", status: "halal", note: "Tam sintetik mavi boyadır — idman içkiləri, şirniyyat və dondurmada çox rast gəlinir. Halaldır." },
  { code: "E140", name: "Chlorophylls and chlorophyllins", category: "Rəngləndirici", status: "halal", note: "Gicitkən, ot, yonca və ya ispanaq kimi yaşıl bitkilərdən çıxarılan təbii yaşıl piqmentdir. Halaldır." },
  { code: "E141", name: "Copper complexes of chlorophylls", category: "Rəngləndirici", status: "halal", note: "Xlorofilin daha istiyə davamlı formasıdır — magnezium mis ilə əvəz olunur, bitki mənşəli xammaldan alınır. Halaldır." },
  { code: "E142", name: "Green S", category: "Rəngləndirici", status: "halal", note: "Tam sintetik yaşıl boyadır — nanə sousu, püstə dondurması və konservləşdirilmiş noxudda istifadə olunur. Halaldır." },
  { code: "E150a", name: "Plain caramel", category: "Rəngləndirici", status: "halal", note: "Şəkərin sadəcə istiliklə karamelləşdirilməsindən alınan qəhvəyi rəngdir — kola, souslar və çörək-bulka məmulatlarında geniş istifadə olunur. Bitki mənşəli xammaldan (şəkər) alındığı üçün halaldır." },
  { code: "E150b", name: "Caustic sulphite caramel", category: "Rəngləndirici", status: "halal", note: "Şəkərin sulfit birləşmələri iştirakı ilə karamelləşdirilməsindən alınan rəngdir — souslar və içkilərdə istifadə olunur. Halaldır (sulfit reaksiya vasitəsidir, tərkib hissəsi kimi qalmır)." },
  { code: "E150c", name: "Ammonia caramel", category: "Rəngləndirici", status: "halal", note: "Şəkərin ammonium birləşmələri iştirakı ilə karamelləşdirilməsindən alınan tünd qəhvəyi rəngdir — souslar, konyak-tipli içkilər və çörəkçilikdə istifadə olunur. Ammonium reaksiya katalizatoru kimi işlədilir, heyvan mənşəli deyil — halaldır." },
  { code: "E150d", name: "Sulphite ammonia caramel", category: "Rəngləndirici", status: "halal", note: "Kolada ən çox rast gəlinən karamel rəngidir — həm sulfit, həm ammonium iştirakı ilə alınır. Bitki mənşəli xammaldan (şəkər), halaldır." },
  { code: "E151", name: "Brilliant Black PN", category: "Rəngləndirici", status: "halal", note: "Tam sintetik qara boyadır — bəzi sous və kürü əvəzedicilərində istifadə olunur (bəzi ölkələrdə, məs. ABŞ-da, qadağandır). Halaldır." },
  { code: "E153", name: "Vegetable carbon", category: "Rəngləndirici", status: "halal", note: "Adətən hindistan cevizi qabığı, ağac və ya torfdan hazırlanan aktivləşdirilmiş kömürdür — qara rəng üçün istifadə olunur. Bitki mənşəli xammaldan, halaldır." },
  { code: "E155", name: "Brown HT", category: "Rəngləndirici", status: "halal", note: "Tam sintetik qəhvəyi boyadır — şokolad rəngli tort və desertlərdə istifadə olunur. Halaldır." },
  { code: "E160a", name: "Carotenes", category: "Rəngləndirici", status: "halal", note: "Beta-karotendir — təbiətdə kök və palma yağında olur, sənayedə bitkidən çıxarılır və ya göbələk fermentasiyası (Blakeslea trispora) ilə istehsal olunur. Hər iki yol bitki/mikrob mənşəlidir, halaldır." },
  { code: "E160b", name: "Annatto (bixin/norbixin)", category: "Rəngləndirici", status: "halal", note: "Annatto (Bixa orellana) ağacının toxumlarından çıxarılan narıncı-qırmızı rəngdir — çedər pendiri, kərə yağı və snack məhsullarında istifadə olunur. Bitki mənşəlidir, halaldır." },
  { code: "E160c", name: "Paprika extract", category: "Rəngləndirici", status: "halal", note: "Qırmızı bibərdən (paprika) çıxarılan rəngləyicidir — snack ədviyyatı, sous və pendirdə istifadə olunur. Bitki mənşəlidir, halaldır." },
  { code: "E160d", name: "Lycopene", category: "Rəngləndirici", status: "halal", note: "Pomidordan çıxarılan qırmızı piqmentdir (göbələk fermentasiyası ilə də istehsal oluna bilər). Bitki/mikrob mənşəlidir, halaldır." },
  { code: "E160e", name: "Beta-apo-8'-carotenal", category: "Rəngləndirici", status: "halal", note: "Narıncı-qırmızı karotinoiddir — bitkidən çıxarıla və ya sintetik yolla istehsal oluna bilər, hər iki halda heyvan mənşəli deyil. Halaldır." },
  { code: "E161b", name: "Lutein", category: "Rəngləndirici", status: "halal", note: "Adətən qazan gülü (marigold) çiçəyindən çıxarılan sarı piqmentdir (yumurta sarısında da təbii olaraq var, lakin qida əlavəsi bitkidən alınır). Halaldır." },
  { code: "E161g", name: "Canthaxanthin", category: "Rəngləndirici", status: "halal", note: "Narıncı-qırmızı karotinoiddir — göbələklərdə/balıqlarda təbii olsa da, qida əlavəsi kimi kimyəvi sintez yolu ilə istehsal olunur. Halaldır." },
  { code: "E162", name: "Beetroot Red / Betanin", category: "Rəngləndirici", status: "halal", note: "Qırmızı çuğundurdan çıxarılan təbii qırmızı rəngdir. Bitki mənşəlidir, halaldır." },
  { code: "E163", name: "Anthocyanins", category: "Rəngləndirici", status: "halal", note: "Üzüm qabığı, qırmızı kələm, qara qarağat kimi bitkilərdən çıxarılan piqmentlərdir. Halaldır." },
  { code: "E170", name: "Calcium carbonate", category: "Rəngləndirici / tənzimləyici", status: "halal", note: "Təbaşir/əhəngdaşı mineralıdır — ağ rəngləyici və kalsium mənbəyi kimi istifadə olunur. Mineral olduğu üçün halaldır." },
  { code: "E171", name: "Titanium dioxide", category: "Rəngləndirici", status: "halal", note: "Mineral əsaslı ağ piqmentdir. Genotoksiklik narahatlığı ilə AB-də 2022-dən qida əlavəsi kimi qadağan edilib (bəzi başqa ölkələrdə hələ icazəlidir) — bu qida təhlükəsizliyi qərarıdır, halallıqla bağlı deyil; mineral mənşəli olduğu üçün özü halal sayılır." },
  { code: "E172", name: "Iron oxides and hydroxides", category: "Rəngləndirici", status: "halal", note: "Dəmir oksidi mineralıdır (mahiyyətcə pas) — qəhvəyi, qırmızı və qara çalarlar üçün istifadə olunur. Mineral olduğu üçün halaldır." },
  { code: "E173", name: "Aluminium", category: "Rəngləndirici", status: "halal", note: "Metallik piqmentdir — əsasən tort bəzəkləri və şirniyyatın üzərində dekorativ örtük kimi istifadə olunur. Metal olduğu üçün halaldır." },
  { code: "E174", name: "Silver", category: "Rəngləndirici", status: "halal", note: "Gümüş rəngli dekorativ örtükdür (məs. gümüş dragee, tort bəzəyi). Metal olduğu üçün halaldır." },
  { code: "E175", name: "Gold", category: "Rəngləndirici", status: "halal", note: "Qızıl vərəq şəklində dekorativ örtükdür (bəzi şokolad və içkilərdə). Metal olduğu üçün halaldır." },
  { code: "E180", name: "Litholrubine BK", category: "Rəngləndirici", status: "halal", note: "Sintetik qırmızı piqmentdir — bəzi pendir qabığının rənglənməsində istifadə olunur. Halaldır." },
  { code: "E200", name: "Sorbic acid", category: "Konservant", status: "halal", note: "Təbiətdə itburnu meyvəsində olsa da, sənayedə sintetik yolla istehsal olunur — kif və maya artımının qarşısını alır. Pendir, şərab, çörək-bulka və qurudulmuş meyvələrdə istifadə olunur. Halaldır." },
  { code: "E202", name: "Potassium sorbate", category: "Konservant", status: "halal", note: "Sorbin turşusunun kalium duzudur — eyni konservant təsiri, geniş istifadə olunur. Halaldır." },
  { code: "E210", name: "Benzoic acid", category: "Konservant", status: "halal", note: "Təbiətdə çoyunca (cranberry) kimi meyvələrdə olsa da, sənayedə sintetik yolla alınır — sərinləşdirici içki, turşu və mürəbbələrdə konservant kimi istifadə olunur. Halaldır." },
  { code: "E211", name: "Sodium benzoate", category: "Konservant", status: "halal", note: "Benzoy turşusunun natrium duzudur — sərinləşdirici içki, sous və turşularda konservant kimi istifadə olunur. Halaldır (vitamin C ilə birlikdə iz miqdarda benzol əmələ gətirməsi qida təhlükəsizliyi mövzusudur, halallıqla bağlı deyil)." },
  { code: "E212", name: "Potassium benzoate", category: "Konservant", status: "halal", note: "Benzoy turşusunun kalium duzudur, eyni istifadə sahəsi. Halaldır." },
  { code: "E213", name: "Calcium benzoate", category: "Konservant", status: "halal", note: "Benzoy turşusunun kalsium duzudur, eyni istifadə sahəsi. Halaldır." },
  { code: "E214", name: "Ethyl-p-hydroxybenzoate", category: "Konservant", status: "halal", note: "Paraben qrupundan sintetik konservantdır — qidada istifadəsi kosmetikaya nisbətən azdır. Halaldır." },
  { code: "E215", name: "Sodium ethyl p-hydroxybenzoate", category: "Konservant", status: "halal", note: "E214-ün natrium duzudur, eyni sinif konservant. Halaldır." },
  { code: "E218", name: "Methyl p-hydroxybenzoate", category: "Konservant", status: "halal", note: "Paraben qrupundan sintetik konservantdır. Halaldır." },
  { code: "E219", name: "Sodium methyl p-hydroxybenzoate", category: "Konservant", status: "halal", note: "E218-in natrium duzudur. Halaldır." },
  { code: "E220", name: "Sulphur dioxide", category: "Konservant", status: "halal", note: "Qurudulmuş meyvə, şərab və şirələrin saralmasının/mikrob artımının qarşısını alan kimyəvi qazdır. Mineral/kimyəvi mənşəli, halaldır (astma xəstələrində allergik reaksiyaya səbəb ola bilər — qida təhlükəsizliyi qeydidir)." },
  { code: "E221", name: "Sodium sulphite", category: "Konservant", status: "halal", note: "Kükürd dioksidin duz formasıdır, eyni konservasiya funksiyası. Halaldır." },
  { code: "E222", name: "Sodium hydrogen sulphite", category: "Konservant", status: "halal", note: "Sulfit qrupundan konservantdır. Halaldır." },
  { code: "E223", name: "Sodium metabisulphite", category: "Konservant", status: "halal", note: "Sulfit qrupundan konservantdır — quru meyvə və şərabda geniş istifadə olunur. Halaldır." },
  { code: "E224", name: "Potassium metabisulphite", category: "Konservant", status: "halal", note: "Sulfit qrupundan konservantdır, şərabçılıqda geniş istifadə olunur. Halaldır." },
  { code: "E226", name: "Calcium sulphite", category: "Konservant", status: "halal", note: "Sulfit qrupundan konservantdır. Halaldır." },
  { code: "E227", name: "Calcium hydrogen sulphite", category: "Konservant", status: "halal", note: "Sulfit qrupundan konservantdır. Halaldır." },
  { code: "E228", name: "Potassium hydrogen sulphite", category: "Konservant", status: "halal", note: "Sulfit qrupundan konservantdır. Halaldır." },
  { code: "E234", name: "Nisin", category: "Konservant", status: "halal", note: "Süddə təbii olaraq tapılan Lactococcus lactis bakteriyasının fermentasiyası ilə istehsal olunan antimikrobial peptiddir — pendir və konservləşdirilmiş qidalarda istifadə olunur. Bakterial fermentasiya məhsulu olduğu üçün halaldır." },
  { code: "E235", name: "Natamycin", category: "Konservant", status: "halal", note: "Streptomyces natalensis bakteriyasının fermentasiyası ilə istehsal olunan antifungal maddədir — pendir və qurudulmuş kolbasa qabığının səthinə çəkilir. Bakterial fermentasiya məhsulu, halaldır." },
  { code: "E239", name: "Hexamethylene tetramine", category: "Konservant", status: "halal", note: "Sintetik konservantdır — bəzi pendir növlərində (məs. Provolone) istifadə olunur. Halaldır." },
  { code: "E242", name: "Dimethyl dicarbonate", category: "Konservant", status: "halal", note: "İçkilərə əlavə edilən, qısa müddətdə parçalanan sintetik mikrob nəzarəti vasitəsidir. Halaldır." },
  { code: "E243", name: "Ethyl lauroyl arginate", category: "Konservant", status: "halal", note: "Arginin amin turşusundan sintez olunan antimikrobial maddədir — ət və pendir məhsullarında istifadə olunur. Halaldır." },
  { code: "E246", name: "Glycolipids", category: "Konservant", status: "depends", note: "Antimikrobial lipid-şəkər birləşmələridir — fermentasiya yolu ilə istehsal olunur, lakin substrat kimi istifadə olunan yağın mənbəyi (bitki və ya heyvan) məhsul etiketindən görünmür. Ona görə status \"mənbəyindən asılıdır\"." },
  { code: "E249", name: "Potassium nitrite", category: "Konservant", status: "halal", note: "Nitrit duzudur — kolbasa, sosis və hisə verilmiş ət məhsullarını konservləşdirmək və botulizmin qarşısını almaq üçün istifadə olunur. Özü mineral/kimyəvi maddə olduğu üçün halaldır — lakin adətən ət məhsullarında olduğundan, əsl diqqət yetirilməli məsələ nitritin özü deyil, həmin ətin halal kəsilib-kəsilməməsidir." },
  { code: "E250", name: "Sodium nitrite", category: "Konservant", status: "halal", note: "Ən çox işlədilən ət konservantıdır — kolbasa/sosisə çəhrayı rəng verir və botulizmin qarşısını alır. Özü halaldır, lakin adətən işləndiyi ət məhsulunun halal kəsim statusu ayrıca yoxlanmalıdır." },
  { code: "E251", name: "Sodium nitrate", category: "Konservant", status: "halal", note: "Ənənəvi ət duzlama üsullarında istifadə olunan nitratdır, bədəndə nitritə çevrilir. Özü halaldır, ət məhsulunun halal kəsim statusu ayrıca məsələdir." },
  { code: "E252", name: "Potassium nitrate", category: "Konservant", status: "halal", note: "Ət duzlamada istifadə olunan nitratdır (şoranın bir forması). Özü halaldır, ət məhsulunun halal kəsim statusu ayrıca məsələdir." },
  { code: "E260", name: "Acetic acid", category: "Turşuluq tənzimləyici", status: "halal", note: "Sirkənin əsas turşusudur — şəkərin spirtə, sonra sirkəyə fermentasiyası ilə (və ya sintetik yolla) alınır. Halaldır (sirkə özü, azalıq miqdarda qalıq spirt daşısa belə, İslam hüququnda ayrıca müzakirə mövzusudur, lakin E260 additivi kimi halal qəbul edilir)." },
  { code: "E261", name: "Potassium acetates", category: "Turşuluq tənzimləyici", status: "halal", note: "Sirkə turşusunun kalium duzudur. Halaldır." },
  { code: "E262", name: "Sodium acetates", category: "Turşuluq tənzimləyici", status: "halal", note: "Sirkə turşusunun natrium duzudur — çips və digər snacklərdə sirkə dadı vermək üçün istifadə olunur. Halaldır." },
  { code: "E263", name: "Calcium acetate", category: "Turşuluq tənzimləyici", status: "halal", note: "Sirkə turşusunun kalsium duzudur. Halaldır." },
  { code: "E267", name: "Buffered vinegar", category: "Turşuluq tənzimləyici", status: "halal", note: "Turşuluğu azaldılmış (bufferlənmiş) sirkədir. Halaldır." },
  { code: "E270", name: "Lactic acid", category: "Turşuluq tənzimləyici", status: "depends", note: "Süd turşusudur — adı süddən gəlsə də, sənayedə adətən şəkərin bakterial fermentasiyası ilə istehsal olunur (bitki mənşəli substrat). Nadir hallarda heyvan mənşəli substrat da istifadə oluna bilər, buna görə istehsal mənbəyi dəqiq bilinmədikcə status \"mənbəyindən asılıdır\" qalır." },
  { code: "E280", name: "Propionic acid", category: "Konservant", status: "halal", note: "İsveçrə pendirində təbii olaraq olan bakteriyanın (Propionibacterium) məhsuludur, sənayedə həm fermentasiya, həm sintetik yolla alınır — çörək və pendirdə kif əleyhinə istifadə olunur. Halaldır." },
  { code: "E281", name: "Sodium propionate", category: "Konservant", status: "halal", note: "Propion turşusunun natrium duzudur, çörəkçilikdə geniş istifadə olunur. Halaldır." },
  { code: "E282", name: "Calcium propionate", category: "Konservant", status: "halal", note: "Propion turşusunun kalsium duzudur, çörəkçilikdə geniş istifadə olunur. Halaldır." },
  { code: "E283", name: "Potassium propionate", category: "Konservant", status: "halal", note: "Propion turşusunun kalium duzudur. Halaldır." },
  { code: "E284", name: "Boric acid", category: "Digər", status: "halal", note: "Mineral turşudur — AB-də qida istifadəsi əsasən kürüylə (kavyar) məhdudlaşır. Mineral olduğu üçün halaldır (yüksək dozada toksikliyi qida təhlükəsizliyi məsələsidir)." },
  { code: "E285", name: "Sodium tetraborate", category: "Digər", status: "halal", note: "Boraks olaraq da tanınır — mineral maddədir, qida istifadəsi çox məhduddur. Halaldır." },
  { code: "E290", name: "Carbon dioxide", category: "Qablaşdırma qazı", status: "halal", note: "Qazlı içkilərin köpüklənməsi və qablaşdırmada qoruyucu qaz kimi istifadə olunan karbon qazıdır. Halaldır." },
  { code: "E296", name: "Malic acid", category: "Turşuluq tənzimləyici", status: "halal", note: "Almada təbii olaraq olan turşudur, sənayedə sintetik yolla istehsal olunur — turş dadlı şirniyyatlarda geniş istifadə olunur. Halaldır." },
  { code: "E297", name: "Fumaric acid", category: "Turşuluq tənzimləyici", status: "halal", note: "Təbiətdə bəzi bitkilərdə olan, sənayedə sintetik yolla istehsal olunan turşudur — turş şirniyyat və qabartma tozunda istifadə olunur. Halaldır." },
  { code: "E300", name: "Ascorbic acid", category: "Antioksidant", status: "halal", note: "Vitamin C — sənayedə demək olar həmişə qlükozadan (adətən qarğıdalı nişastasından) fermentasiya yolu ilə istehsal olunur. Bitki mənşəlidir, halaldır." },
  { code: "E301", name: "Sodium ascorbate", category: "Antioksidant", status: "halal", note: "C vitamininin natrium duzudur — həm antioksidant, həm ət konservasiyasında rəng saxlayıcı kimi istifadə olunur. Halaldır." },
  { code: "E302", name: "Calcium ascorbate", category: "Antioksidant", status: "halal", note: "C vitamininin kalsium duzudur. Halaldır." },
  { code: "E304", name: "Fatty acid esters of ascorbic acid", category: "Antioksidant", status: "depends", note: "C vitamininin yağ turşusu ilə birləşməsindən alınan antioksidantdır — istifadə olunan yağ bitki və ya heyvan mənşəli ola bilər, etiketdə göstərilmir. Ona görə status \"mənbəyindən asılıdır\"." },
  { code: "E306", name: "Tocopherol-rich extract", category: "Antioksidant", status: "halal", note: "Bitki yağlarından (soya, günəbaxan, buğda cücərtisi) çıxarılan təbii Vitamin E ekstraktıdır. Halaldır." },
  { code: "E307", name: "Alpha-tocopherol", category: "Antioksidant", status: "halal", note: "Vitamin E-nin ən aktiv formasıdır — bitki yağından çıxarılır və ya sintez olunur. Halaldır." },
  { code: "E308", name: "Gamma-tocopherol", category: "Antioksidant", status: "halal", note: "Vitamin E formasıdır, bitki yağından çıxarılır. Halaldır." },
  { code: "E309", name: "Delta-tocopherol", category: "Antioksidant", status: "halal", note: "Vitamin E formasıdır, bitki yağından çıxarılır. Halaldır." },
  { code: "E310", name: "Propyl gallate", category: "Antioksidant", status: "halal", note: "Bitkilərdə (məs. palıd qozası, çay) olan qallik turşusundan sintez olunan antioksidantdır — yağ və snacklərdə istifadə olunur. Halaldır." },
  { code: "E315", name: "Erythorbic acid", category: "Antioksidant", status: "halal", note: "Vitamin C-nin izomeridir, şəkərin fermentasiyası ilə istehsal olunur — ət konservasiyasında rəngi sürətlə sabitləşdirmək üçün istifadə olunur. Halaldır." },
  { code: "E316", name: "Sodium erythorbate", category: "Antioksidant", status: "halal", note: "Eritorbik turşunun natrium duzudur, eyni istifadə sahəsi. Halaldır." },
  { code: "E319", name: "TBHQ", category: "Antioksidant", status: "halal", note: "Tam sintetik (neft-kimya əsaslı) antioksidantdır — yağ, marqarin və snacklərdə oksidləşməni yavaşlatmaq üçün istifadə olunur. Heyvan mənşəli deyil, halaldır." },
  { code: "E320", name: "BHA", category: "Antioksidant", status: "halal", note: "Tam sintetik antioksidantdır — yağ, dənli məhsullar və saqqızda istifadə olunur. Halaldır." },
  { code: "E321", name: "BHT", category: "Antioksidant", status: "halal", note: "Tam sintetik antioksidantdır, BHA-ya bənzər istifadə sahəsi. Halaldır." },
  { code: "E322", name: "Lecithins", category: "Emulqator", status: "depends", note: "Emulqatordur — ən çox soyadan, həmçinin günəbaxandan çıxarılır (halal), lakin yumurta sarısından da alına bilər (heyvan mənşəli, amma haram deyil). Mənbə etiketdə göstərilmədikcə status \"mənbəyindən asılıdır\" qalır." },
  { code: "E325", name: "Sodium lactate", category: "Turşuluq tənzimləyici", status: "depends", note: "Süd turşusunun natrium duzudur — E270-də olduğu kimi, istehsalda istifadə olunan fermentasiya substratının mənbəyi bilinmədikcə status \"mənbəyindən asılıdır\" qalır." },
  { code: "E326", name: "Potassium lactate", category: "Turşuluq tənzimləyici", status: "depends", note: "Süd turşusunun kalium duzudur — E270-də olduğu kimi mənbə yoxlanmalıdır." },
  { code: "E327", name: "Calcium lactate", category: "Turşuluq tənzimləyici", status: "depends", note: "Süd turşusunun kalsium duzudur — E270-də olduğu kimi mənbə yoxlanmalıdır." },
  { code: "E330", name: "Citric acid", category: "Turşuluq tənzimləyici", status: "halal", note: "Sitrus meyvələrində təbii olan turşudur, sənayedə şəkərin Aspergillus niger göbələyi ilə fermentasiyasından istehsal olunur. Bitki/mikrob mənşəlidir, halaldır." },
  { code: "E331", name: "Sodium citrates", category: "Turşuluq tənzimləyici", status: "halal", note: "Limon turşusunun natrium duzlarıdır — əridilmiş pendirdə geniş istifadə olunur. Halaldır." },
  { code: "E332", name: "Potassium citrates", category: "Turşuluq tənzimləyici", status: "halal", note: "Limon turşusunun kalium duzlarıdır. Halaldır." },
  { code: "E333", name: "Calcium citrates", category: "Turşuluq tənzimləyici", status: "halal", note: "Limon turşusunun kalsium duzlarıdır. Halaldır." },
  { code: "E334", name: "Tartaric acid", category: "Turşuluq tənzimləyici", status: "halal", note: "Üzümdə təbii olan, şərabçılığın yan məhsulu kimi alınan turşudur — izolə edilmiş kimyəvi birləşmə olduğu üçün özü halaldır (şərabın özü ayrıca məsələdir)." },
  { code: "E335", name: "Sodium tartrates", category: "Turşuluq tənzimləyici", status: "halal", note: "Şərab turşusunun natrium duzudur. Halaldır." },
  { code: "E336", name: "Potassium tartrates", category: "Turşuluq tənzimləyici", status: "halal", note: "Şərab turşusunun kalium duzudur (kalium bitartrat — \"cream of tartar\" — qabartma tozunda geniş istifadə olunur). Halaldır." },
  { code: "E337", name: "Sodium potassium tartrate", category: "Turşuluq tənzimləyici", status: "halal", note: "Şərab turşusunun qarışıq duzudur (Rochelle duzu). Halaldır." },
  { code: "E338", name: "Phosphoric acid", category: "Turşuluq tənzimləyici", status: "halal", note: "Mineral turşudur — kola tipli içkilərə turş dad vermək üçün istifadə olunur. Halaldır." },
  { code: "E339", name: "Sodium phosphates", category: "Stabilizator", status: "halal", note: "Mineral fosfat duzlarıdır — əridilmiş pendir və emal edilmiş ət məhsullarında stabilizator kimi istifadə olunur. Halaldır." },
  { code: "E340", name: "Potassium phosphates", category: "Stabilizator", status: "halal", note: "Mineral fosfat duzlarıdır, eyni istifadə sahəsi. Halaldır." },
  { code: "E341", name: "Calcium phosphates", category: "Qabartma / stabilizator", status: "halal", note: "Kalsium fosfat mineralıdır — qabartma tozunda və kalsium əlavəsi kimi istifadə olunur. Halaldır." },
  { code: "E343", name: "Magnesium phosphates", category: "Stabilizator", status: "halal", note: "Maqnezium fosfat mineralıdır. Halaldır." },
  { code: "E350", name: "Sodium malates", category: "Turşuluq tənzimləyici", status: "halal", note: "Alma turşusunun natrium duzudur. Halaldır." },
  { code: "E351", name: "Potassium malate", category: "Turşuluq tənzimləyici", status: "halal", note: "Alma turşusunun kalium duzudur. Halaldır." },
  { code: "E352", name: "Calcium malates", category: "Turşuluq tənzimləyici", status: "halal", note: "Alma turşusunun kalsium duzudur. Halaldır." },
  { code: "E353", name: "Metatartaric acid", category: "Stabilizator", status: "halal", note: "Şərab turşusundan alınan, şərabda kristal əmələ gəlməsinin qarşısını alan maddədir. Halaldır." },
  { code: "E354", name: "Calcium tartrate", category: "Stabilizator", status: "halal", note: "Şərab turşusunun kalsium duzudur. Halaldır." },
  { code: "E355", name: "Adipic acid", category: "Turşuluq tənzimləyici", status: "halal", note: "Tam sintetik turşudur — jele desertlərdə və toz içki qarışıqlarında turş dad üçün istifadə olunur. Halaldır." },
  { code: "E356", name: "Sodium adipate", category: "Turşuluq tənzimləyici", status: "halal", note: "Adipin turşusunun natrium duzudur. Halaldır." },
  { code: "E357", name: "Potassium adipate", category: "Turşuluq tənzimləyici", status: "halal", note: "Adipin turşusunun kalium duzudur. Halaldır." },
  { code: "E363", name: "Succinic acid", category: "Turşuluq tənzimləyici", status: "halal", note: "Təbiətdə mövcud, sənayedə sintetik yolla istehsal olunan turşudur. Halaldır." },
  { code: "E380", name: "Triammonium citrate", category: "Turşuluq tənzimləyici", status: "halal", note: "Limon turşusunun ammonium duzudur. Halaldır." },
  { code: "E385", name: "Calcium disodium EDTA", category: "Stabilizator", status: "halal", note: "Sintetik xelatlaşdırıcı maddədir — konserv, mayonez və souslarda rəng/dad pozulmasının qarşısını almaq üçün istifadə olunur. Halaldır." },
  { code: "E392", name: "Extracts of rosemary", category: "Antioksidant", status: "halal", note: "Biberiyyə (rosmarin) bitkisindən çıxarılan təbii antioksidantdır. Halaldır." },
  { code: "E400", name: "Alginic acid", category: "Qatılaşdırıcı", status: "halal", note: "Qəhvəyi dəniz yosunundan çıxarılan qatılaşdırıcıdır. Halaldır." },
  { code: "E401", name: "Sodium alginate", category: "Qatılaşdırıcı", status: "halal", note: "Alqin turşusunun natrium duzudur, dəniz yosunu mənşəlidir. Halaldır." },
  { code: "E402", name: "Potassium alginate", category: "Qatılaşdırıcı", status: "halal", note: "Alqin turşusunun kalium duzudur, dəniz yosunu mənşəlidir. Halaldır." },
  { code: "E403", name: "Ammonium alginate", category: "Qatılaşdırıcı", status: "halal", note: "Alqin turşusunun ammonium duzudur, dəniz yosunu mənşəlidir. Halaldır." },
  { code: "E404", name: "Calcium alginate", category: "Qatılaşdırıcı", status: "halal", note: "Alqin turşusunun kalsium duzudur, dəniz yosunu mənşəlidir. Halaldır." },
  { code: "E405", name: "Propane-1,2-diol alginate", category: "Qatılaşdırıcı", status: "halal", note: "Alqinatın törəməsidir, dəniz yosunu mənşəlidir. Halaldır." },
  { code: "E406", name: "Agar", category: "Jelləşdirici", status: "halal", note: "Qırmızı dəniz yosunundan çıxarılan jelləşdirici maddədir — jelatinə bitki mənşəli alternativ kimi istifadə olunur. Halaldır." },
  { code: "E407", name: "Carrageenan", category: "Qatılaşdırıcı", status: "halal", note: "Qırmızı dəniz yosunundan (irland mamırı) çıxarılan qatılaşdırıcıdır — süd məhsulları və bitki südlərində geniş istifadə olunur. Halaldır." },
  { code: "E407a", name: "Processed euchema seaweed", category: "Qatılaşdırıcı", status: "halal", note: "Emal edilmiş dəniz yosunu ekstraktıdır, karrageenana bənzər istifadə sahəsi. Halaldır." },
  { code: "E410", name: "Locust bean gum", category: "Qatılaşdırıcı", status: "halal", note: "Keçiboynuzu ağacının toxumlarından alınan saqqızdır. Halaldır." },
  { code: "E412", name: "Guar gum", category: "Qatılaşdırıcı", status: "halal", note: "Quar paxlasının toxumlarından alınan saqqızdır. Halaldır." },
  { code: "E413", name: "Tragacanth", category: "Qatılaşdırıcı", status: "halal", note: "Astragalus kolunun şirəsindən alınan bitki saqqızıdır. Halaldır." },
  { code: "E414", name: "Gum arabic", category: "Qatılaşdırıcı", status: "halal", note: "Akasiya ağacının şirəsindən alınan saqqızdır. Halaldır." },
  { code: "E415", name: "Xanthan gum", category: "Qatılaşdırıcı", status: "halal", note: "Şəkərin (adətən qarğıdalı və ya soyadan) Xanthomonas campestris bakteriyası ilə fermentasiyasından istehsal olunan saqqızdır. Halaldır." },
  { code: "E416", name: "Karaya gum", category: "Qatılaşdırıcı", status: "halal", note: "Ağac şirəsindən alınan bitki saqqızıdır. Halaldır." },
  { code: "E417", name: "Tara gum", category: "Qatılaşdırıcı", status: "halal", note: "Tara ağacının toxumlarından alınan saqqızdır. Halaldır." },
  { code: "E418", name: "Gellan gum", category: "Qatılaşdırıcı", status: "halal", note: "Şəkərin Sphingomonas elodea bakteriyası ilə fermentasiyasından istehsal olunan polisaxariddir. Mikrob fermentasiya məhsuludur, halaldır." },
  { code: "E420", name: "Sorbitols", category: "Şirinləşdirici", status: "halal", note: "Qlükozadan (adətən qarğıdalı və ya buğda nişastasından) istehsal olunan şəkər spirtidir. Halaldır." },
  { code: "E421", name: "Mannitol", category: "Şirinləşdirici", status: "halal", note: "Şəkərdən sintez olunan və ya dəniz yosunundan çıxarılan şəkər spirtidir. Halaldır." },
  { code: "E422", name: "Glycerol", category: "Nəmləndirici", status: "depends", note: "Yağların hidrolizindən alınan qliserindir — şirinləşdirici, nəmləndirici və dad daşıyıcısı kimi qənnadı məmulatları, çörək-bulka və bəzi içkilərdə istifadə olunur. Bitki yağından (soya, palma, kokos), heyvan piyindən və ya neft-kimya yolu ilə sintetik şəkildə istehsal oluna bilər. Mənbə bitki/sintetik olduqda halal, heyvan piyindən olduqda isə heyvanın növü və kəsim üsulundan asılıdır — ona görə status \"mənbəyindən asılıdır\" olaraq qalır." },
  { code: "E423", name: "Modified gum arabic", category: "Qatılaşdırıcı", status: "halal", note: "Modifikasiya edilmiş akasiya saqqızıdır. Halaldır." },
  { code: "E425", name: "Konjac", category: "Qatılaşdırıcı", status: "halal", note: "Konjak bitkisinin kökündən alınan qatılaşdırıcıdır. Bitki mənşəlidir, halaldır (kiçik jele şəkilli formaları boğulma riski daşıdığına görə bəzi ölkələrdə uşaqlar üçün xəbərdarlıq tələb olunur — bu qida təhlükəsizliyi qeydidir)." },
  { code: "E426", name: "Soybean hemicellulose", category: "Qatılaşdırıcı", status: "halal", note: "Soya lifindən çıxarılan qatılaşdırıcıdır. Halaldır." },
  { code: "E427", name: "Cassia gum", category: "Qatılaşdırıcı", status: "halal", note: "Cassia toxumlarından alınan bitki saqqızıdır. Halaldır." },
  { code: "E431", name: "Polyoxyethylene stearate", category: "Emulqator", status: "depends", note: "Stearin turşusu əsaslı sintetik emulqatordur — stearin bitki yağından və ya heyvan piyindən ola bilər. Mənbə yoxlanmalıdır." },
  { code: "E432", name: "Polysorbate 20", category: "Emulqator", status: "depends", note: "Sorbitol və yağ turşusundan sintez olunan emulqatordur — yağ turşusunun mənbəyi (bitki/heyvan) etiketdə göstərilmir. Mənbə yoxlanmalıdır." },
  { code: "E433", name: "Polysorbate 80", category: "Emulqator", status: "depends", note: "Dondurma və çörəkçilikdə geniş istifadə olunan emulqatordur — yağ turşusu mənbəyi yoxlanmalıdır." },
  { code: "E434", name: "Polysorbate 40", category: "Emulqator", status: "depends", note: "Emulqatordur — yağ turşusu mənbəyi yoxlanmalıdır." },
  { code: "E435", name: "Polysorbate 60", category: "Emulqator", status: "depends", note: "Qənnadı məmulatlarında istifadə olunan emulqatordur — yağ turşusu mənbəyi yoxlanmalıdır." },
  { code: "E436", name: "Polysorbate 65", category: "Emulqator", status: "depends", note: "Emulqatordur — yağ turşusu mənbəyi yoxlanmalıdır." },
  { code: "E440", name: "Pectins", category: "Jelləşdirici", status: "halal", note: "Meyvə qabığından (adətən sitrus və ya alma tullantısından) çıxarılan jelləşdirici maddədir — mürəbbə və jeledə geniş istifadə olunur. Bitki mənşəlidir, halaldır." },
  { code: "E441", name: "Gelatin", category: "Jelləşdirici", status: "depends", note: "Heyvan sümüyü/dərisindən alınır — halal kəsilmiş heyvan və ya balıqdan olarsa halal, donuzdan olarsa tövsiyə edilmir; etiketdə mənbə göstərilmir." },
  { code: "E442", name: "Ammonium phosphatides", category: "Emulqator", status: "halal", note: "Şokoladda lesitinə ucuz alternativ kimi istifadə olunan emulqatordur — adətən rapa (kanola) yağından sintez olunur. Halaldır." },
  { code: "E444", name: "Sucrose acetate isobutyrate", category: "Stabilizator", status: "halal", note: "Şəkərdən sintez olunan, aromalı içkilərdə emulsiyanı sabit saxlayan maddədir. Halaldır." },
  { code: "E445", name: "Glycerol esters of wood rosins", category: "Stabilizator", status: "depends", note: "Şam ağacı qatranından alınan qliserin efirləridir — içki emulsiyalarında istifadə olunur, istehsal üsulu (qliserinin mənbəyi) yoxlanıla bilər." },
  { code: "E450", name: "Diphosphates", category: "Qabartma / stabilizator", status: "halal", note: "Mineral fosfat duzlarıdır — qabartma tozu və emal edilmiş ətdə istifadə olunur. Halaldır." },
  { code: "E451", name: "Triphosphates", category: "Stabilizator", status: "halal", note: "Mineral fosfat duzlarıdır. Halaldır." },
  { code: "E452", name: "Polyphosphates", category: "Stabilizator", status: "halal", note: "Mineral fosfat duzlarıdır — emal edilmiş ət və dəniz məhsullarında rütubət saxlamaq üçün istifadə olunur. Halaldır." },
  { code: "E456", name: "Potassium polyaspartate", category: "Stabilizator", status: "halal", note: "Sintetik polimerdir. Halaldır." },
  { code: "E459", name: "Beta-cyclodextrin", category: "Stabilizator", status: "halal", note: "Nişastadan istehsal olunan halqavari şəkərdir — dad/qoxu saxlayıcı kimi istifadə olunur. Bitki mənşəlidir, halaldır." },
  { code: "E460", name: "Cellulose", category: "Qatılaşdırıcı", status: "halal", note: "Bitki liflərindən (adətən ağac massası və ya pambıq) alınan sellülozadır. Halaldır." },
  { code: "E461", name: "Methyl cellulose", category: "Qatılaşdırıcı", status: "halal", note: "Sellülozanın kimyəvi törəməsidir, bitki mənşəlidir. Halaldır." },
  { code: "E462", name: "Ethyl cellulose", category: "Qatılaşdırıcı", status: "halal", note: "Sellülozanın kimyəvi törəməsidir, bitki mənşəlidir. Halaldır." },
  { code: "E463", name: "Hydroxypropyl cellulose", category: "Qatılaşdırıcı", status: "halal", note: "Sellülozanın kimyəvi törəməsidir, bitki mənşəlidir. Halaldır." },
  { code: "E464", name: "Hydroxypropyl methyl cellulose", category: "Qatılaşdırıcı", status: "halal", note: "Sellülozanın kimyəvi törəməsidir — bitki mənşəli jelatin əvəzedicisi kimi də istifadə olunur. Halaldır." },
  { code: "E465", name: "Ethyl methyl cellulose", category: "Qatılaşdırıcı", status: "halal", note: "Sellülozanın kimyəvi törəməsidir, bitki mənşəlidir. Halaldır." },
  { code: "E466", name: "Sodium carboxymethyl cellulose", category: "Qatılaşdırıcı", status: "halal", note: "Sellülozanın kimyəvi törəməsidir (CMC) — geniş istifadə olunan qatılaşdırıcıdır. Bitki mənşəlidir, halaldır." },
  { code: "E468", name: "Cross-linked sodium carboxymethyl cellulose", category: "Qatılaşdırıcı", status: "halal", note: "CMC-nin çarpaz bağlı formasıdır, bitki mənşəlidir. Halaldır." },
  { code: "E469", name: "Hydrolysed carboxymethyl cellulose", category: "Qatılaşdırıcı", status: "halal", note: "CMC-nin hidrolizə uğramış formasıdır, bitki mənşəlidir. Halaldır." },
  { code: "E470a", name: "Sodium, potassium and calcium salts of fatty acids", category: "Emulqator", status: "depends", note: "Yağ turşusu duzlarıdır — yağın mənbəyi bitki və ya heyvan ola bilər, etiketdə göstərilmir. Mənbə yoxlanmalıdır." },
  { code: "E470b", name: "Magnesium salts of fatty acids", category: "Emulqator", status: "depends", note: "Yağ turşusu duzlarıdır — mənbə yoxlanmalıdır." },
  { code: "E471", name: "Mono- and diglycerides of fatty acids", category: "Emulqator", status: "depends", note: "Yağ turşuları ilə qliserinin birləşməsindən alınan emulqatordur — çörək, marqarin, dondurma, şokolad və hazır qənnadı məmulatlarında geniş istifadə olunur. Tərkibindəki yağ turşusu bitki yağından (palma, soya, günəbaxan) və ya heyvan piyindən (adətən mal-qara və ya donuz) ola bilər. Mənbə etiketdə göstərilmədiyi üçün əksər sertifikat orqanları bunu \"mənbəyindən asılıdır\" kimi qeyd edir — istehsalçı bitki mənşəli və ya halal kəsilmiş heyvandan olduğunu təsdiqləməyincə ehtiyatlı yanaşılmalıdır." },
  { code: "E472a", name: "Acetic acid esters of mono- and diglycerides", category: "Emulqator", status: "depends", note: "E471-in sirkə turşusu ilə birləşməsindən alınan törəməsidir — eyni səbəbdən (yağ mənbəyi bilinmir) status \"mənbəyindən asılıdır\"." },
  { code: "E472b", name: "Lactic acid esters of mono- and diglycerides", category: "Emulqator", status: "depends", note: "E471-in süd turşusu ilə birləşməsindən alınan törəməsidir — yağ mənbəyi yoxlanmalıdır." },
  { code: "E472c", name: "Citric acid esters of mono- and diglycerides", category: "Emulqator", status: "depends", note: "E471-in limon turşusu ilə birləşməsindən alınan törəməsidir — yağ mənbəyi yoxlanmalıdır." },
  { code: "E472d", name: "Tartaric acid esters of mono- and diglycerides", category: "Emulqator", status: "depends", note: "E471-in şərab turşusu ilə birləşməsindən alınan törəməsidir — yağ mənbəyi yoxlanmalıdır." },
  { code: "E472e", name: "DATEM", category: "Emulqator", status: "depends", note: "Çörəkçilikdə xəmiri gücləndirmək üçün istifadə olunan E471 törəməsidir — yağ mənbəyi yoxlanmalıdır." },
  { code: "E472f", name: "Acetic and tartaric acid esters", category: "Emulqator", status: "depends", note: "E471-in qarışıq turşu efirləridir — yağ mənbəyi yoxlanmalıdır." },
  { code: "E473", name: "Sucrose esters of fatty acids", category: "Emulqator", status: "depends", note: "Saxaroza və yağ turşusunun birləşməsindən alınan emulqatordur — yağ turşusu mənbəyi yoxlanmalıdır." },
  { code: "E474", name: "Sucroglycerides", category: "Emulqator", status: "depends", note: "Saxaroza və qliseridlərin birləşməsindən alınan emulqatordur — yağ mənbəyi yoxlanmalıdır." },
  { code: "E475", name: "Polyglycerol esters of fatty acids", category: "Emulqator", status: "depends", note: "Poliqliserol və yağ turşusunun birləşməsindən alınan emulqatordur — yağ mənbəyi yoxlanmalıdır." },
  { code: "E476", name: "Polyglycerol polyricinoleate", category: "Emulqator", status: "halal", note: "Şokoladda geniş istifadə olunan emulqatordur — qliserin və kastor (rıcinus) yağından sintez olunur. Bitki mənşəlidir, halaldır." },
  { code: "E477", name: "Propane-1,2-diol esters of fatty acids", category: "Emulqator", status: "depends", note: "Yağ turşusu efirləridir — yağ mənbəyi yoxlanmalıdır." },
  { code: "E479b", name: "Thermally oxidized soybean oil + mono/diglycerides", category: "Emulqator", status: "halal", note: "Soya yağı əsaslı emulqatordur — mənbəsi açıq şəkildə bitkidir. Halaldır." },
  { code: "E481", name: "Sodium stearoyl-2-lactylate", category: "Emulqator", status: "depends", note: "Xəmir yaxşılaşdırıcısıdır — stearin turşusunun mənbəyi (bitki/heyvan) yoxlanmalıdır." },
  { code: "E482", name: "Calcium stearoyl-2-lactylate", category: "Emulqator", status: "depends", note: "Xəmir yaxşılaşdırıcısıdır — stearin turşusunun mənbəyi yoxlanmalıdır." },
  { code: "E483", name: "Stearyl tartrate", category: "Emulqator", status: "depends", note: "Stearin turşusunun şərab turşusu efiridir — stearin mənbəyi yoxlanmalıdır." },
  { code: "E491", name: "Sorbitan monostearate", category: "Emulqator", status: "depends", note: "Sorbitol və stearin turşusunun birləşməsindən alınan emulqatordur — stearin mənbəyi yoxlanmalıdır." },
  { code: "E492", name: "Sorbitan tristearate", category: "Emulqator", status: "depends", note: "Sorbitan emulqatorudur — stearin mənbəyi yoxlanmalıdır." },
  { code: "E493", name: "Sorbitan monolaurate", category: "Emulqator", status: "depends", note: "Sorbitan emulqatorudur — yağ turşusu mənbəyi yoxlanmalıdır." },
  { code: "E494", name: "Sorbitan monooleate", category: "Emulqator", status: "depends", note: "Sorbitan emulqatorudur — yağ turşusu mənbəyi yoxlanmalıdır." },
  { code: "E495", name: "Sorbitan monopalmitate", category: "Emulqator", status: "depends", note: "Sorbitan emulqatorudur — palmitin turşusu mənbəyi yoxlanmalıdır." },
  { code: "E499", name: "Stigmasterol-rich plant sterols", category: "Stabilizator", status: "halal", note: "Adından da göründüyü kimi bitki sterollarıdır. Halaldır." },
  { code: "E500", name: "Sodium carbonates", category: "Turşuluq tənzimləyici", status: "halal", note: "Adi soda (natrium karbonat) mineralıdır — çörəkçilik və turşuluq tənzimləməsində istifadə olunur. Halaldır." },
  { code: "E501", name: "Potassium carbonate", category: "Turşuluq tənzimləyici", status: "halal", note: "Mineral karbonat duzudur. Halaldır." },
  { code: "E503", name: "Ammonium carbonates", category: "Qabartma agenti", status: "halal", note: "Ənənəvi qabartma agentidir (\"hartshorn\") — bəzi peçenyelərdə istifadə olunur. Mineral/kimyəvi mənşəlidir, halaldır." },
  { code: "E504", name: "Magnesium carbonates", category: "Turşuluq tənzimləyici", status: "halal", note: "Mineral karbonat duzudur. Halaldır." },
  { code: "E507", name: "Hydrochloric acid", category: "Turşuluq tənzimləyici", status: "halal", note: "Mineral turşudur, emal prosesində istifadə olunur. Halaldır." },
  { code: "E508", name: "Potassium chloride", category: "Mineral duz", status: "halal", note: "Kalium xlorid — süfrə duzunun natrium miqdarını azaltmaq üçün əvəzedici kimi istifadə olunur. Mineral, halaldır." },
  { code: "E509", name: "Calcium chloride", category: "Mineral duz", status: "halal", note: "Mineral duzdur — pendirçilikdə və turşulaşdırılmış tərəvəzdə bərklik verən kimi istifadə olunur. Halaldır." },
  { code: "E511", name: "Magnesium chloride", category: "Mineral duz", status: "halal", note: "Mineral duzdur (bəzi soya südündən düyü/tofu hazırlanmasında istifadə olunur — \"nigari\"). Halaldır." },
  { code: "E512", name: "Stannous chloride", category: "Stabilizator", status: "halal", note: "Mineral qalay duzudur — konserv meyvə-tərəvəzdə rəng saxlayıcı kimi istifadə olunur. Halaldır." },
  { code: "E513", name: "Sulphuric acid", category: "Turşuluq tənzimləyici", status: "halal", note: "Mineral turşudur, emal prosesində istifadə olunur. Halaldır." },
  { code: "E514", name: "Sodium sulphates", category: "Stabilizator", status: "halal", note: "Mineral sulfat duzlarıdır. Halaldır." },
  { code: "E515", name: "Potassium sulphates", category: "Stabilizator", status: "halal", note: "Mineral sulfat duzlarıdır. Halaldır." },
  { code: "E516", name: "Calcium sulphate", category: "Stabilizator", status: "halal", note: "Gips mineralı — tofu istehsalında laxtalandırıcı, çörəkçilikdə mineral əlavə kimi istifadə olunur. Halaldır." },
  { code: "E517", name: "Ammonium sulphate", category: "Stabilizator", status: "halal", note: "Mineral duzdur, çörəkçilikdə maya qidası kimi istifadə olunur. Halaldır." },
  { code: "E520", name: "Aluminium sulphate", category: "Stabilizator", status: "halal", note: "Mineral duzdur, turşulaşdırılmış tərəvəzdə bərkidici kimi istifadə olunur. Halaldır." },
  { code: "E521", name: "Aluminium sodium sulphate", category: "Qabartma agenti", status: "halal", note: "Mineral duzdur, qabartma tozunda istifadə olunur. Halaldır." },
  { code: "E522", name: "Aluminium potassium sulphate", category: "Qabartma agenti", status: "halal", note: "Şap (alum) olaraq da tanınır — mineral duzdur, qabartma tozunda istifadə olunur. Halaldır." },
  { code: "E523", name: "Aluminium ammonium sulphate", category: "Qabartma agenti", status: "halal", note: "Mineral duzdur, qabartma tozunda istifadə olunur. Halaldır." },
  { code: "E524", name: "Sodium hydroxide", category: "Turşuluq tənzimləyici", status: "halal", note: "Kaustik soda — mineral kimyəvi maddədir, pretsel/bagel bişirilməsi kimi proseslərdə istifadə olunur. Halaldır." },
  { code: "E525", name: "Potassium hydroxide", category: "Turşuluq tənzimləyici", status: "halal", note: "Mineral kimyəvi maddədir, zeytun emalında istifadə olunur. Halaldır." },
  { code: "E526", name: "Calcium hydroxide", category: "Turşuluq tənzimləyici", status: "halal", note: "Sönmüş əhəng — mineral maddədir, mısır tortilla hazırlanmasında (nixtamalizasiya) istifadə olunur. Halaldır." },
  { code: "E527", name: "Ammonium hydroxide", category: "Turşuluq tənzimləyici", status: "halal", note: "Mineral kimyəvi maddədir, emal prosesində istifadə olunur. Halaldır." },
  { code: "E528", name: "Magnesium hydroxide", category: "Turşuluq tənzimləyici", status: "halal", note: "Mineral maddədir. Halaldır." },
  { code: "E529", name: "Calcium oxide", category: "Turşuluq tənzimləyici", status: "halal", note: "Sönməmiş əhəng — mineral maddədir. Halaldır." },
  { code: "E530", name: "Magnesium oxide", category: "Turşuluq tənzimləyici", status: "halal", note: "Mineral maddədir. Halaldır." },
  { code: "E534", name: "Iron(III) meso-tartrate", category: "Mineral duz", status: "halal", note: "Dəmir tartrat mineralıdır. Halaldır." },
  { code: "E535", name: "Sodium ferrocyanide", category: "Yapışmanın qarşısını alan", status: "halal", note: "Duzun topalanmasının qarşısını alan mineral maddədir — çox az miqdarda istifadə olunur. Halaldır." },
  { code: "E536", name: "Potassium ferrocyanide", category: "Yapışmanın qarşısını alan", status: "halal", note: "Duz və şərabda topalanma/çöküntünün qarşısını alan mineral maddədir. Halaldır." },
  { code: "E538", name: "Calcium ferrocyanide", category: "Yapışmanın qarşısını alan", status: "halal", note: "Mineral maddədir, topalanmanın qarşısını alır. Halaldır." },
  { code: "E541", name: "Sodium aluminium phosphate acidic", category: "Qabartma agenti", status: "halal", note: "Mineral fosfat duzudur, qabartma tozunda istifadə olunur. Halaldır." },
  { code: "E551", name: "Silicon dioxide", category: "Yapışmanın qarşısını alan", status: "halal", note: "Silisium mineralı (qum əsaslı) — toz halında qidaların (məs. duz, ədviyyat) axıcı qalmasını təmin edir. Halaldır." },
  { code: "E552", name: "Calcium silicate", category: "Yapışmanın qarşısını alan", status: "halal", note: "Mineral silikatdır, topalanmanın qarşısını alır. Halaldır." },
  { code: "E553a", name: "Magnesium silicate", category: "Yapışmanın qarşısını alan", status: "halal", note: "Mineral silikatdır, topalanmanın qarşısını alır. Halaldır." },
  { code: "E553b", name: "Talc", category: "Yapışmanın qarşısını alan", status: "halal", note: "Talk mineralıdır (kosmetikada da istifadə olunur) — düyü kimi məhsulların cilalanmasında istifadə oluna bilər. Halaldır." },
  { code: "E554", name: "Sodium aluminium silicate", category: "Yapışmanın qarşısını alan", status: "halal", note: "Mineral silikatdır. Halaldır." },
  { code: "E555", name: "Potassium aluminium silicate", category: "Yapışmanın qarşısını alan", status: "halal", note: "Mineral silikatdır. Halaldır." },
  { code: "E556", name: "Calcium aluminium silicate", category: "Yapışmanın qarşısını alan", status: "halal", note: "Mineral silikatdır. Halaldır." },
  { code: "E558", name: "Bentonite", category: "Yapışmanın qarşısını alan", status: "halal", note: "Gil mineralıdır, şərabın durulaşdırılmasında da istifadə olunur. Halaldır." },
  { code: "E559", name: "Aluminium silicate / Kaolin", category: "Yapışmanın qarşısını alan", status: "halal", note: "Kaolin gil mineralıdır. Halaldır." },
  { code: "E570", name: "Fatty acids", category: "Emulqator", status: "depends", note: "Xalis yağ turşularıdır — bitki yağından və ya heyvan piyindən ola bilər, mənbə yoxlanmalıdır." },
  { code: "E574", name: "Gluconic acid", category: "Turşuluq tənzimləyici", status: "halal", note: "Qlükozanın fermentasiyasından alınan turşudur. Bitki mənşəlidir, halaldır." },
  { code: "E575", name: "Glucono-delta-lactone", category: "Turşuluq tənzimləyici", status: "halal", note: "Qlükon turşusunun laktonudur — tofu laxtalandırılmasında, kolbasa istehsalında yavaş turşulaşdırıcı kimi istifadə olunur. Halaldır." },
  { code: "E576", name: "Sodium gluconate", category: "Turşuluq tənzimləyici", status: "halal", note: "Qlükon turşusunun natrium duzudur. Halaldır." },
  { code: "E577", name: "Potassium gluconate", category: "Turşuluq tənzimləyici", status: "halal", note: "Qlükon turşusunun kalium duzudur. Halaldır." },
  { code: "E578", name: "Calcium gluconate", category: "Mineral duz", status: "halal", note: "Qlükon turşusunun kalsium duzudur, kalsium əlavəsi kimi də istifadə olunur. Halaldır." },
  { code: "E579", name: "Ferrous gluconate", category: "Mineral duz", status: "halal", note: "Qlükon turşusunun dəmir duzudur — bəzi zeytunları qaraltmaq üçün istifadə olunur. Halaldır." },
  { code: "E585", name: "Ferrous lactate", category: "Mineral duz", status: "depends", note: "Süd turşusunun dəmir duzudur — süd turşusunun (E270-də olduğu kimi) fermentasiya mənbəyi yoxlanmalıdır." },
  { code: "E586", name: "4-Hexylresorcinol", category: "Konservant", status: "halal", note: "Sintetik konservantdır — dəniz məhsullarının (qarides) qaralmasının qarşısını almaq üçün istifadə olunur. Halaldır." },
  { code: "E620", name: "Glutamic acid", category: "Dad artırıcı", status: "halal", note: "Təbiətdə zülallarda geniş yayılmış amin turşusudur, sənayedə şəkərin bakterial fermentasiyası ilə istehsal olunur. Bitki mənşəlidir, halaldır." },
  { code: "E621", name: "Monosodium glutamate", category: "Dad artırıcı", status: "halal", note: "MSG — qlutamin turşusunun natrium duzudur, sənayedə şəkər/nişastanın bakterial fermentasiyası ilə istehsal olunur. Bitki mənşəlidir, halaldır." },
  { code: "E622", name: "Monopotassium glutamate", category: "Dad artırıcı", status: "halal", note: "Qlutamat duzudur, MSG-yə bənzər. Halaldır." },
  { code: "E623", name: "Calcium diglutamate", category: "Dad artırıcı", status: "halal", note: "Qlutamat duzudur. Halaldır." },
  { code: "E624", name: "Monoammonium glutamate", category: "Dad artırıcı", status: "halal", note: "Qlutamat duzudur. Halaldır." },
  { code: "E625", name: "Magnesium diglutamate", category: "Dad artırıcı", status: "halal", note: "Qlutamat duzudur. Halaldır." },
  { code: "E626", name: "Guanylic acid", category: "Dad artırıcı", status: "halal", note: "Dad artırıcı nukleotiddir — bakterial fermentasiya ilə də istehsal oluna bilər. Halaldır." },
  { code: "E627", name: "Disodium guanylate", category: "Dad artırıcı", status: "depends", note: "Guanilat duzudur — bəzən bakterial fermentasiya, bəzən balıq/heyvan mənşəli xammaldan alınır. Mənbə yoxlanmalıdır." },
  { code: "E628", name: "Dipotassium guanylate", category: "Dad artırıcı", status: "depends", note: "Guanilat duzudur — mənbə (fermentasiya/heyvan) yoxlanmalıdır." },
  { code: "E629", name: "Calcium guanylate", category: "Dad artırıcı", status: "depends", note: "Guanilat duzudur — mənbə yoxlanmalıdır." },
  { code: "E630", name: "Inosinic acid", category: "Dad artırıcı", status: "depends", note: "Dad artırıcı nukleotiddir — ənənəvi olaraq balıq/ət ekstraktından, sənayedə isə çox vaxt bakterial fermentasiyadan alınır. Mənbə yoxlanmalıdır." },
  { code: "E631", name: "Disodium inosinate", category: "Dad artırıcı", status: "depends", note: "İnozin turşusunun natrium duzudur — balıq/heyvan mənşəli və ya bakterial fermentasiya məhsulu ola bilər. Mənbə yoxlanmalıdır." },
  { code: "E632", name: "Dipotassium inosinate", category: "Dad artırıcı", status: "depends", note: "İnozin turşusunun kalium duzudur — balıq/heyvan mənşəli ola bilər. Mənbə yoxlanmalıdır." },
  { code: "E633", name: "Calcium inosinate", category: "Dad artırıcı", status: "depends", note: "İnozin turşusunun kalsium duzudur — balıq/heyvan mənşəli ola bilər. Mənbə yoxlanmalıdır." },
  { code: "E634", name: "Calcium 5'-ribonucleotides", category: "Dad artırıcı", status: "depends", note: "Ribonukleotid qarışığıdır (guanilat+inozinat) — mənbə yoxlanmalıdır." },
  { code: "E635", name: "Disodium 5'-ribonucleotides", category: "Dad artırıcı", status: "depends", note: "Ribonukleotid qarışığıdır — dad artırıcı kimi chips, souslar və instant şorbalarda geniş istifadə olunur. Mənbə yoxlanmalıdır." },
  { code: "E640", name: "Glycine and its sodium salt", category: "Dad artırıcı", status: "depends", note: "Ən sadə amin turşusudur — kimyəvi sintez və ya fermentasiya ilə istehsal oluna bilər, istehsal mənbəyi yoxlanmalıdır." },
  { code: "E641", name: "L-leucine", category: "Dad artırıcı", status: "halal", note: "Bakterial fermentasiya ilə istehsal olunan amin turşusudur. Halaldır." },
  { code: "E650", name: "Zinc acetate", category: "Dad artırıcı", status: "halal", note: "Mineral duzdur, çeynəmə saqqızında dad artırıcı kimi istifadə olunur. Halaldır." },
  { code: "E900", name: "Dimethyl polysiloxane", category: "Köpükəleyhinə", status: "halal", note: "Silikon əsaslı sintetik maddədir — qida qızardılmasında köpük əmələ gəlməsini azaldır. Halaldır." },
  { code: "E901", name: "Beeswax", category: "Şüşələndirici", status: "halal", note: "Arı mumu — meyvə, şokolad dragee və saqqızın üzərinə parlaqlıq vermək üçün istifadə olunur. Arı məhsulu heyvan mənşəli sayılmır (fəqihlərin əksəriyyəti arının özünü yeməyi haram, lakin mumunu halal sayır). Halaldır." },
  { code: "E902", name: "Candelilla wax", category: "Şüşələndirici", status: "halal", note: "Candelilla kolunun səthindən alınan bitki mumu. Halaldır." },
  { code: "E903", name: "Carnauba wax", category: "Şüşələndirici", status: "halal", note: "Karnauba palmasının yarpaqlarından alınan bitki mumu — şirniyyat və meyvələrin parlaqlaşdırılmasında istifadə olunur. Halaldır." },
  { code: "E904", name: "Shellac", category: "Şüşələndirici", status: "depends", note: "Lak böcəyinin (Kerria lacca) ifraz etdiyi qatrandan alınır — şirniyyat və meyvələrin (məs. alma) parlaqlaşdırılmasında istifadə olunur. Həşərat ifrazı olduğu üçün bəzi sertifikat orqanları haram, bəziləri isə (bal kimi) həşəratın özü deyil, ifrazı olduğu üçün icazəli sayır — status mənbə/certifikator baxışından asılıdır." },
  { code: "E905", name: "Microcrystalline wax", category: "Şüşələndirici", status: "halal", note: "Neft əsaslı mineral mumdur. Halaldır." },
  { code: "E907", name: "Hydrogenated poly-1-decene", category: "Şüşələndirici", status: "halal", note: "Tam sintetik mumdur. Halaldır." },
  { code: "E912", name: "Montan acid esters", category: "Şüşələndirici", status: "halal", note: "Linyit kömüründən alınan mineral mum efirləridir. Halaldır." },
  { code: "E914", name: "Oxidised polyethylene wax", category: "Şüşələndirici", status: "halal", note: "Tam sintetik (neft əsaslı) mumdur. Halaldır." },
  { code: "E920", name: "L-cysteine", category: "Xəmir yaxşılaşdırıcı", status: "depends", note: "Xəmiri yumşaldan amin turşusudur — tarixən insan saçından/quş lələklərindən, bəzən donuz tükündən alınıb; müasir istehsalda bakterial fermentasiya da geniş yayılıb. Mənbə (fermentasiya, quş tükü, donuz tükü) etiketdə göstərilmədiyi üçün status \"mənbəyindən asılıdır\"." },
  { code: "E926", name: "Chlorine dioxide", category: "Digər", status: "halal", note: "Un ağardılmasında istifadə olunan kimyəvi emal agentidir. Halaldır." },
  { code: "E927b", name: "Carbamide", category: "Xəmir yaxşılaşdırıcı", status: "halal", note: "Karbamid (sidik cövhəri) — sənayedə tam sintetik yolla istehsal olunur, çeynəmə saqqızında istifadə olunur. Halaldır." },
  { code: "E938", name: "Argon", category: "Qablaşdırma qazı", status: "halal", note: "İnert qazdır, qablaşdırmada oksidləşmənin qarşısını almaq üçün istifadə olunur. Halaldır." },
  { code: "E939", name: "Helium", category: "Qablaşdırma qazı", status: "halal", note: "İnert qazdır. Halaldır." },
  { code: "E941", name: "Nitrogen", category: "Qablaşdırma qazı", status: "halal", note: "Havanın əsas tərkib hissəsidir, qablaşdırmada qoruyucu qaz kimi istifadə olunur. Halaldır." },
  { code: "E942", name: "Nitrous oxide", category: "Qablaşdırma qazı", status: "halal", note: "Krem/köpük sprey qablarında təzyiq qazı kimi istifadə olunur. Halaldır." },
  { code: "E943a", name: "Butane", category: "Qablaşdırma qazı", status: "halal", note: "Sprey qablarda təzyiq qazı kimi istifadə olunur. Halaldır." },
  { code: "E943b", name: "Isobutane", category: "Qablaşdırma qazı", status: "halal", note: "Sprey qablarda təzyiq qazı kimi istifadə olunur. Halaldır." },
  { code: "E944", name: "Propane", category: "Qablaşdırma qazı", status: "halal", note: "Sprey qablarda təzyiq qazı kimi istifadə olunur. Halaldır." },
  { code: "E948", name: "Oxygen", category: "Qablaşdırma qazı", status: "halal", note: "Bəzi qablaşdırma tətbiqlərində istifadə olunur. Halaldır." },
  { code: "E949", name: "Hydrogen", category: "Qablaşdırma qazı", status: "halal", note: "Qablaşdırma qazı kimi istifadə olunur. Halaldır." },
  { code: "E950", name: "Acesulfame K", category: "Şirinləşdirici", status: "halal", note: "Tam sintetik, kalorisiz şirinləşdiricidir — sərinləşdirici içki və şəkərsiz məhsullarda geniş istifadə olunur. Halaldır." },
  { code: "E951", name: "Aspartame", category: "Şirinləşdirici", status: "halal", note: "İki amin turşusunun (fenilalanin + aspartik turşu) birləşməsindən sintez olunan kalorisiz şirinləşdiricidir. Halaldır (fenilketonuriyalılar üçün xəbərdarlıq tələb olunur — bu tibbi, halallıqla bağlı olmayan qeyddir)." },
  { code: "E952", name: "Cyclamic acid and salts", category: "Şirinləşdirici", status: "halal", note: "Tam sintetik şirinləşdiricidir (ABŞ-da qadağandır, AB-də icazəlidir). Halaldır." },
  { code: "E953", name: "Isomalt", category: "Şirinləşdirici", status: "halal", note: "Şəkərdən istehsal olunan şəkər spirtidir. Halaldır." },
  { code: "E954", name: "Saccharin and salts", category: "Şirinləşdirici", status: "halal", note: "Tam sintetik, kalorisiz şirinləşdiricidir — ən qədim süni şirinləşdiricilərdən biridir. Halaldır." },
  { code: "E955", name: "Sucralose", category: "Şirinləşdirici", status: "halal", note: "Şəkərin kimyəvi modifikasiyasından alınan kalorisiz şirinləşdiricidir. Halaldır." },
  { code: "E957", name: "Thaumatin", category: "Şirinləşdirici", status: "depends", note: "Qərbi Afrikadan olan katemfe bitkisinin meyvəsindən çıxarılan zülal əsaslı şirinləşdiricidir — bitki mənşəli olsa da, hazırlanma/emal prosesi (məs. fermentasiya ilə istehsal olunan formalar) yoxlanıla bilər." },
  { code: "E959", name: "Neohesperidine DC", category: "Şirinləşdirici", status: "halal", note: "Sitrus qabığından sintez olunan şirinləşdiricidir. Bitki mənşəlidir, halaldır." },
  { code: "E960a", name: "Steviol glycosides from Stevia", category: "Şirinləşdirici", status: "halal", note: "Stevia bitkisinin yarpaqlarından çıxarılan təbii şirinləşdiricidir. Halaldır." },
  { code: "E960c", name: "Enzymatically produced steviol glycosides", category: "Şirinləşdirici", status: "depends", note: "Stevia qlikozidlərinin enzimlə modifikasiya edilmiş formasıdır — istifadə olunan enzimin mənbəyi (mikrob/heyvan) yoxlanıla bilər." },
  { code: "E960d", name: "Glucosylated steviol glycosides", category: "Şirinləşdirici", status: "depends", note: "Stevia qlikozidlərinin qlükozillə modifikasiya edilmiş formasıdır — istehsal üsulu yoxlanmalıdır." },
  { code: "E961", name: "Neotame", category: "Şirinləşdirici", status: "halal", note: "Aspartama bənzər, ondan qat-qat güclü tam sintetik şirinləşdiricidir. Halaldır." },
  { code: "E962", name: "Aspartame-acesulfame salt", category: "Şirinləşdirici", status: "halal", note: "Aspartam və asesulfam K-nın birləşmiş duzudur. Halaldır." },
  { code: "E964", name: "Polyglycitol syrup", category: "Şirinləşdirici", status: "halal", note: "Nişastadan istehsal olunan şəkər spirti siropudur. Halaldır." },
  { code: "E965", name: "Maltitols", category: "Şirinləşdirici", status: "halal", note: "Nişastadan istehsal olunan şəkər spirtidir — şəkərsiz şokoladda geniş istifadə olunur. Halaldır." },
  { code: "E966", name: "Lactitol", category: "Şirinləşdirici", status: "halal", note: "Laktozadan istehsal olunan şəkər spirtidir. Halaldır." },
  { code: "E967", name: "Xylitol", category: "Şirinləşdirici", status: "halal", note: "Bitki lifindən (məs. tozağacı, qarğıdalı sapağı) istehsal olunan şəkər spirtidir — diş çürüməsinə qarşı saqqızlarda geniş istifadə olunur. Halaldır." },
  { code: "E968", name: "Erythritol", category: "Şirinləşdirici", status: "halal", note: "Meyvələrdə təbii olan, sənayedə şəkərin göbələk fermentasiyası ilə istehsal olunan şəkər spirtidir. Halaldır." },
  { code: "E969", name: "Advantame", category: "Şirinləşdirici", status: "halal", note: "Aspartam əsaslı, çox güclü tam sintetik şirinləşdiricidir. Halaldır." },
  { code: "E999", name: "Quillaia extract", category: "Köpükləndirici", status: "halal", note: "Kvillaya ağacının qabığından çıxarılan köpükləndiricidir — bəzi içkilərdə istifadə olunur. Bitki mənşəlidir, halaldır." },
];

/**
 * Admin-added codes not in the hardcoded E_CODES table above (see
 * custom_ecodes in supabase/schema.sql) — populated by loadCustomECodes()
 * and merged into every lookup below. Mutated in place (push, not
 * reassignment) so every module that imported this array sees updates
 * without needing its own reload logic.
 */
export const EXTRA_ECODES: ECodeEntry[] = [];

export async function loadCustomECodes(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const { data, error } = await supabase
    .from('custom_ecodes')
    .select('code, name, category, status, note');
  if (error || !data) return;
  EXTRA_ECODES.length = 0;
  EXTRA_ECODES.push(
    ...data.map((row) => ({
      code: row.code as string,
      name: row.name as string,
      category: (row.category as string) || 'Digər',
      status: row.status as ECodeStatus,
      note: (row.note as string) || '',
    }))
  );
}

// A custom_ecodes row sharing a code with a built-in entry is an admin's
// edit of that entry (see the admin panel's "E-kodlar" section — "Redaktə
// et" on a built-in code creates exactly this kind of row), so it must
// replace the built-in one here, not just sit alongside it as a duplicate.
function allECodes(): ECodeEntry[] {
  if (!EXTRA_ECODES.length) return E_CODES;
  const overriddenCodes = new Set(EXTRA_ECODES.map((e) => e.code.toUpperCase()));
  const notOverridden = E_CODES.filter((e) => !overriddenCodes.has(e.code.toUpperCase()));
  return [...notOverridden, ...EXTRA_ECODES];
}

export function findECode(query: string): ECodeEntry | undefined {
  const q = query.trim().toUpperCase().replace(/\s+/g, '');
  return allECodes().find((e) => e.code.toUpperCase().replace(/\s+/g, '') === q);
}

export function searchECodes(query: string): ECodeEntry[] {
  const q = query.trim().toLowerCase();
  const list = allECodes();
  if (!q) return list;
  return list.filter(
    (e) =>
      e.code.toLowerCase().includes(q) ||
      e.name.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q)
  );
}

/**
 * Pulls every "E123" / "E123a" style token out of free-form ingredient
 * text. Tries an exact code match first (E472a must not resolve to
 * E472b just because they share a 4-character prefix), and only falls
 * back to the old prefix match for a 4-digit code missing its exact
 * variant in the table.
 */
export function extractECodesFromText(text: string): ECodeEntry[] {
  const found = new Map<string, ECodeEntry>();
  const list = allECodes();

  // "E123" / "E123a" style tokens — exact match first, then the old
  // 4-character-prefix fallback for a variant missing from the table.
  const codeMatches = text.match(/E\s?-?\s?\d{3,4}[a-h]?/gi) ?? [];
  for (const raw of codeMatches) {
    const normalized = raw.toUpperCase().replace(/[\s-]/g, '');
    const exact = list.find((e) => e.code.toUpperCase() === normalized);
    const entry = exact ?? list.find((e) => e.code.toUpperCase().startsWith(normalized.slice(0, 4)));
    if (entry) found.set(entry.code, entry);
  }

  // Ingredient names spelled out in full instead of as an E-code (e.g. a
  // label that says "Gelatin" or "Lecithin" with no "E441"/"E322" next to
  // it) — whole-word match, skipping short names too likely to false-hit
  // ("Talc" would; but < 5 chars is rare among these anyway).
  for (const entry of list) {
    for (const namePart of entry.name.split(/[/,]/).map((s) => s.trim())) {
      if (namePart.length < 5) continue;
      const escaped = namePart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(`\\b${escaped}\\b`, 'i').test(text)) {
        found.set(entry.code, entry);
        break;
      }
    }
  }

  return Array.from(found.values());
}

export const eCodeStatusLabel: Record<ECodeStatus, string> = {
  halal: 'Halal',
  haram: 'Tövsiyə edilmir',
  mushbooh: 'Şübhəli',
  depends: 'Mənbədən asılıdır',
};

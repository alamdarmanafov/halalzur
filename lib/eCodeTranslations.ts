import { Language } from './i18n';

/**
 * TR/EN/RU translations for lib/eCodes.ts's `category` and `note` fields
 * (both Azerbaijani-only there — 307 entries, most sharing one of only
 * ~23 categories and ~223 distinct notes). Kept as a separate lookup
 * dictionary, keyed by the Azerbaijani text, rather than rewriting
 * E_CODES itself: E_CODES is a large, already-verified 307-entry table,
 * and this way a typo here can't touch its actual halal/haram data.
 *
 * Scope: only E-codes (chemistry/food-additive facts, standardized
 * internationally) get this treatment. Actual scanned PRODUCT content —
 * product names, brand, ingredient lists — is deliberately NOT
 * auto-translated (see lib/i18n.ts's header comment and lib/
 * ingredientGlossary.ts's own comment on that same risk): a product's
 * real-world label is whatever language it's actually printed in, and a
 * translation mistake there is a much bigger problem than for a
 * standardized chemical name.
 *
 * Falls back to the original Azerbaijani text for AZ, and for any
 * category/note not found here (e.g. an admin-added custom_ecodes row,
 * which is typed in Azerbaijani only) — never shows a blank.
 */

type Translated = Partial<Record<Exclude<Language, 'az'>, string>>;

const CATEGORY_TRANSLATIONS: Record<string, Translated> = {
  'Antioksidant': { tr: 'Antioksidan', en: 'Antioxidant', ru: 'Антиоксидант' },
  'Dad artırıcı': { tr: 'Tat arttırıcı', en: 'Flavor enhancer', ru: 'Усилитель вкуса' },
  'Digər': { tr: 'Diğer', en: 'Other', ru: 'Другое' },
  'Emulqator': { tr: 'Emülgatör', en: 'Emulsifier', ru: 'Эмульгатор' },
  'Jelləşdirici': { tr: 'Jelleştirici', en: 'Gelling agent', ru: 'Желирующий агент' },
  'Konservant': { tr: 'Koruyucu', en: 'Preservative', ru: 'Консервант' },
  'Köpükləndirici': { tr: 'Köpürtücü', en: 'Foaming agent', ru: 'Пенообразователь' },
  'Köpükəleyhinə': { tr: 'Köpük önleyici', en: 'Anti-foaming agent', ru: 'Пеногаситель' },
  'Mineral duz': { tr: 'Mineral tuz', en: 'Mineral salt', ru: 'Минеральная соль' },
  'Nəmləndirici': { tr: 'Nemlendirici', en: 'Humectant', ru: 'Увлажнитель' },
  'Qabartma / stabilizator': { tr: 'Kabartma / stabilizatör', en: 'Raising agent / stabilizer', ru: 'Разрыхлитель / стабилизатор' },
  'Qabartma agenti': { tr: 'Kabartma ajanı', en: 'Raising agent', ru: 'Разрыхлитель' },
  'Qablaşdırma qazı': { tr: 'Paketleme gazı', en: 'Packaging gas', ru: 'Упаковочный газ' },
  'Qatılaşdırıcı': { tr: 'Kıvam arttırıcı', en: 'Thickener', ru: 'Загуститель' },
  'Rəngləndirici': { tr: 'Renklendirici', en: 'Colorant', ru: 'Краситель' },
  'Rəngləndirici / tənzimləyici': { tr: 'Renklendirici / düzenleyici', en: 'Colorant / regulator', ru: 'Краситель / регулятор' },
  'Rəngləndirici / vitamin': { tr: 'Renklendirici / vitamin', en: 'Colorant / vitamin', ru: 'Краситель / витамин' },
  'Stabilizator': { tr: 'Stabilizatör', en: 'Stabilizer', ru: 'Стабилизатор' },
  'Turşuluq tənzimləyici': { tr: 'Asitlik düzenleyici', en: 'Acidity regulator', ru: 'Регулятор кислотности' },
  'Xəmir yaxşılaşdırıcı': { tr: 'Hamur iyileştirici', en: 'Flour treatment agent', ru: 'Улучшитель муки' },
  'Yapışmanın qarşısını alan': { tr: 'Yapışmayı önleyici', en: 'Anti-caking agent', ru: 'Антислёживающий агент' },
  'Şirinləşdirici': { tr: 'Tatlandırıcı', en: 'Sweetener', ru: 'Подсластитель' },
  'Şüşələndirici': { tr: 'Parlatıcı', en: 'Glazing agent', ru: 'Глазирователь' },
};

const NOTE_TRANSLATIONS: Record<string, Translated> = {
  'Zərdəçal (Curcuma longa) kökündən alınan sarı-narıncı rəngləyicidir — tərkibindəki kurkumin piqmenti bitki mənşəlidir. Adətən xardal, pendir, kərə yağı, çips və içkilərdə istifadə olunur. Heyvan mənşəli tərkib hissəsi olmadığı üçün bütün sertifikat orqanları tərəfindən halal qəbul edilir.': {
    tr: 'Zerdeçal (Curcuma longa) kökünden elde edilen sarı-turuncu renklendiricidir — içeriğindeki kurkumin pigmenti bitkisel kaynaklıdır. Genellikle hardal, peynir, tereyağı, cips ve içeceklerde kullanılır. Hayvansal içerik taşımadığı için tüm sertifika kuruluşları tarafından helal kabul edilir.',
    en: 'A yellow-orange colorant from turmeric (Curcuma longa) root — the curcumin pigment in it is plant-derived. Commonly used in mustard, cheese, butter, chips, and drinks. Since it contains no animal-derived material, it is accepted as halal by every certification body.',
    ru: 'Жёлто-оранжевый краситель из корня куркумы (Curcuma longa) — пигмент куркумин растительного происхождения. Обычно используется в горчице, сыре, сливочном масле, чипсах и напитках. Не содержит компонентов животного происхождения, поэтому признаётся халяльным всеми сертифицирующими органами.',
  },
  'Vitamin B2 — sarı-narıncı rəngləyici, makaron, souslar və taxıl məhsullarında istifadə olunur. Təbiətdə süd, yumurta və ciyərdə olsa da, sənaye miqyasında demək olar həmişə bakteriya/göbələk fermentasiyası ilə (məs. Bacillus subtilis) istehsal olunur — bu üsul heyvan mənşəli deyil, halal.': {
    tr: 'Vitamin B2 — sarı-turuncu renklendirici, makarna, soslar ve tahıl ürünlerinde kullanılır. Doğada süt, yumurta ve karaciğerde bulunsa da, endüstriyel ölçekte neredeyse her zaman bakteri/mantar fermantasyonuyla (örn. Bacillus subtilis) üretilir — bu yöntem hayvansal değildir, helaldir.',
    en: 'Vitamin B2 — a yellow-orange colorant used in pasta, sauces, and cereal products. Although naturally found in milk, eggs, and liver, on an industrial scale it is almost always produced by bacterial/fungal fermentation (e.g. Bacillus subtilis) — this route is not animal-derived, and is halal.',
    ru: 'Витамин B2 — жёлто-оранжевый краситель, используется в макаронах, соусах и зерновых продуктах. Хотя в природе содержится в молоке, яйцах и печени, в промышленных масштабах почти всегда производится путём бактериальной/грибковой ферментации (напр. Bacillus subtilis) — этот способ не связан с животным происхождением, халяль.',
  },
  'Neft əsaslı xammaldan tam sintetik yolla alınan sarı azo boyadır — sərinləşdirici içkilər, şirniyyat və çipslərdə istifadə olunur. Heyvan mənşəli tərkibi yoxdur, halaldır (AB-də uşaqlarda hiperaktivlik riski ilə əlaqədar etiketdə xəbərdarlıq tələb olunur, lakin bu halallıqla bağlı deyil, qida təhlükəsizliyi məsələsidir).': {
    tr: 'Petrol kökenli hammaddeden tamamen sentetik yolla elde edilen sarı azo boyadır — soğuk içecekler, şekerleme ve cipslerde kullanılır. Hayvansal içeriği yoktur, helaldir (AB\'de çocuklarda hiperaktivite riskiyle ilgili etikette uyarı zorunludur, ancak bu helal-haramla değil, gıda güvenliğiyle ilgilidir).',
    en: 'A fully synthetic yellow azo dye made from petroleum-based raw material — used in soft drinks, sweets, and chips. Contains no animal-derived material, halal (the EU requires a label warning about a possible hyperactivity link in children, which is a food-safety matter, not a halal one).',
    ru: 'Полностью синтетический жёлтый азокраситель, получаемый из нефтяного сырья — используется в прохладительных напитках, кондитерских изделиях и чипсах. Не содержит компонентов животного происхождения, халяль (в ЕС требуется предупреждающая маркировка о риске гиперактивности у детей, но это вопрос безопасности пищи, а не халяльности).',
  },
  'Tam sintetik sarı boyadır — hisə verilmiş balıq, bəzi içki və qənnadı məmulatlarında istifadə olunur. Heyvan mənşəli tərkibi yoxdur, halaldır.': {
    tr: 'Tamamen sentetik sarı boyadır — füme balık, bazı içecek ve şekerleme ürünlerinde kullanılır. Hayvansal içeriği yoktur, helaldir.',
    en: 'A fully synthetic yellow dye — used in smoked fish, some drinks, and confectionery. Contains no animal-derived material, halal.',
    ru: 'Полностью синтетический жёлтый краситель — используется в копчёной рыбе, некоторых напитках и кондитерских изделиях. Не содержит компонентов животного происхождения, халяль.',
  },
  'Neft əsaslı sintetik narıncı-sarı azo boyadır — sərinləşdirici içkilər, desertlər və souslarda istifadə olunur. Halaldır.': {
    tr: 'Petrol kökenli sentetik turuncu-sarı azo boyadır — soğuk içecekler, tatlılar ve soslarda kullanılır. Helaldir.',
    en: 'A petroleum-based synthetic orange-yellow azo dye — used in soft drinks, desserts, and sauces. Halal.',
    ru: 'Синтетический оранжево-жёлтый азокраситель на нефтяной основе — используется в прохладительных напитках, десертах и соусах. Халяль.',
  },
  'Koşenil (Dactylopius coccus) adlı həşəratın dişi fərdlərinin qurudulub əzilməsi ilə alınan qırmızı rəngləyicidir (digər adları: Karmin, Natural Red 4, Crimson Lake, Cochineal Extract). İçki, şirniyyat, kolbasa/sosis, yoğurt və kosmetikada (məs. dodaq boyası) istifadə olunur. Həşərat mənşəli olduğuna görə GIMDES və əksər halal sertifikat orqanları tərəfindən haram sayılır — həşəratların hökmü barədə fəqihlər arasında fərqli baxışlar olsa da, tətbiqdəki status ehtiyatlı (əksəriyyət) mövqeyi əks etdirir.': {
    tr: 'Koşnil (Dactylopius coccus) adlı böceğin dişilerinin kurutulup ezilmesiyle elde edilen kırmızı renklendiricidir (diğer adları: Karmin, Natural Red 4, Crimson Lake, Cochineal Extract). İçecek, şekerleme, sucuk/sosis, yoğurt ve kozmetikte (örn. ruj) kullanılır. Böcek kökenli olduğu için GIMDES ve çoğu helal sertifika kuruluşu tarafından haram sayılır — böceklerin hükmü konusunda fakihler arasında farklı görüşler olsa da, uygulamadaki durum ihtiyatlı (çoğunluk) görüşü yansıtır.',
    en: 'A red colorant made from dried, crushed female cochineal insects (Dactylopius coccus) — also called Carmine, Natural Red 4, Crimson Lake, or Cochineal Extract. Used in drinks, confectionery, sausages, yogurt, and cosmetics (e.g. lipstick). Because it is insect-derived, GIMDES and most halal certification bodies classify it as haram — scholars differ on the ruling for insects, but the app\'s status reflects the cautious (majority) position.',
    ru: 'Красный краситель, получаемый из высушенных и измельчённых самок насекомого кошениль (Dactylopius coccus) — другие названия: кармин, Natural Red 4, Crimson Lake, Cochineal Extract. Используется в напитках, кондитерских изделиях, колбасе/сосисках, йогурте и косметике (напр. помада). Поскольку имеет насекомое происхождение, GIMDES и большинство халяльных сертифицирующих органов признают его харамным — среди факихов есть разные мнения о статусе насекомых, но статус в приложении отражает осторожную (мажоритарную) позицию.',
  },
  'Tam sintetik qırmızı azo boyadır (adından fərqli olaraq koşenillə əlaqəsi yoxdur) — mürəbbə, marsipan və spirtli içkilərdə istifadə olunur. Halaldır.': {
    tr: 'Tamamen sentetik kırmızı azo boyadır (adının aksine koşnille ilgisi yoktur) — reçel, marsipan ve alkollü içeceklerde kullanılır. Helaldir.',
    en: 'A fully synthetic red azo dye (despite the name, unrelated to cochineal) — used in jam, marzipan, and alcoholic drinks. Halal.',
    ru: 'Полностью синтетический красный азокраситель (несмотря на схожее название, не связан с кошенилью) — используется в джемах, марципане и алкогольных напитках. Халяль.',
  },
  'Tam sintetik bənövşəyi-qırmızı azo boyadır — kürü, bəzi içki və şirniyyatda istifadə olunur (xərçəng riski şübhələri ilə ABŞ-da 1976-dan qadağandır, AB-də icazəlidir). Heyvan mənşəli deyil, halaldır.': {
    tr: 'Tamamen sentetik mor-kırmızı azo boyadır — havyar, bazı içecek ve şekerlemede kullanılır (kanser riski şüphesiyle ABD\'de 1976\'dan beri yasaktır, AB\'de izinlidir). Hayvansal değildir, helaldir.',
    en: 'A fully synthetic purple-red azo dye — used in caviar, some drinks, and confectionery (banned in the US since 1976 over cancer-risk concerns, still permitted in the EU). Not animal-derived, halal.',
    ru: 'Полностью синтетический фиолетово-красный азокраситель — используется в икре, некоторых напитках и кондитерских изделиях (запрещён в США с 1976 года из-за подозрений в канцерогенности, в ЕС разрешён). Не животного происхождения, халяль.',
  },
  'Adında "Cochineal" olsa da, koşenil həşəratı ilə əlaqəsi yoxdur — tam sintetik azo boyadır. Desert, şorba və souslarda istifadə olunur. Halaldır.': {
    tr: 'Adında "Cochineal" geçse de koşnil böceğiyle ilgisi yoktur — tamamen sentetik azo boyadır. Tatlı, çorba ve soslarda kullanılır. Helaldir.',
    en: 'Despite "Cochineal" in the name, it has no connection to the cochineal insect — a fully synthetic azo dye. Used in desserts, soups, and sauces. Halal.',
    ru: 'Несмотря на слово "Cochineal" в названии, не связан с насекомым кошениль — полностью синтетический азокраситель. Используется в десертах, супах и соусах. Халяль.',
  },
  'Tərkibində yod olan sintetik çəhrayı-qırmızı boyadır — kokteyl/qlyase albalılarda və konservləşdirilmiş meyvələrdə istifadə olunur. Halaldır.': {
    tr: 'İçeriğinde iyot bulunan sentetik pembe-kırmızı boyadır — kokteyl/glase kirazlarda ve konserve meyvelerde kullanılır. Helaldir.',
    en: 'A synthetic iodine-containing pink-red dye — used in cocktail/glacé cherries and canned fruit. Halal.',
    ru: 'Синтетический розово-красный краситель, содержащий йод — используется в коктейльных/глазированных вишнях и консервированных фруктах. Халяль.',
  },
  'Tam sintetik qırmızı azo boyadır — sərinləşdirici içkilər, souslar və çipslərdə geniş istifadə olunur. Halaldır.': {
    tr: 'Tamamen sentetik kırmızı azo boyadır — soğuk içecekler, soslar ve cipslerde yaygın olarak kullanılır. Helaldir.',
    en: 'A fully synthetic red azo dye — widely used in soft drinks, sauces, and chips. Halal.',
    ru: 'Полностью синтетический красный азокраситель — широко используется в прохладительных напитках, соусах и чипсах. Халяль.',
  },
  'Tam sintetik mavi boyadır — bəzi pendir və dondurma növlərində istifadə olunur. Halaldır.': {
    tr: 'Tamamen sentetik mavi boyadır — bazı peynir ve dondurma çeşitlerinde kullanılır. Helaldir.',
    en: 'A fully synthetic blue dye — used in some cheese and ice cream varieties. Halal.',
    ru: 'Полностью синтетический синий краситель — используется в некоторых сортах сыра и мороженого. Халяль.',
  },
  'Sintetik mavi boyadır (cins şalvar boyamaqda istifadə olunan indiqo ilə eyni sinifdəndir, lakin qida keyfiyyətlidir) — şirniyyat və dondurmada istifadə olunur. Halaldır.': {
    tr: 'Sentetik mavi boyadır (kot pantolon boyamada kullanılan indigo ile aynı sınıftandır, ancak gıda kalitesindedir) — şekerleme ve dondurmada kullanılır. Helaldir.',
    en: 'A synthetic blue dye (same class as the indigo used to dye jeans, but food-grade) — used in confectionery and ice cream. Halal.',
    ru: 'Синтетический синий краситель (того же класса, что индиго для окраски джинсов, но пищевого качества) — используется в кондитерских изделиях и мороженом. Халяль.',
  },
  'Tam sintetik mavi boyadır — idman içkiləri, şirniyyat və dondurmada çox rast gəlinir. Halaldır.': {
    tr: 'Tamamen sentetik mavi boyadır — spor içecekleri, şekerleme ve dondurmada sıkça rastlanır. Helaldir.',
    en: 'A fully synthetic blue dye — very common in sports drinks, confectionery, and ice cream. Halal.',
    ru: 'Полностью синтетический синий краситель — часто встречается в спортивных напитках, кондитерских изделиях и мороженом. Халяль.',
  },
  'Gicitkən, ot, yonca və ya ispanaq kimi yaşıl bitkilərdən çıxarılan təbii yaşıl piqmentdir. Halaldır.': {
    tr: 'Isırgan otu, çim, yonca veya ıspanak gibi yeşil bitkilerden elde edilen doğal yeşil pigmenttir. Helaldir.',
    en: 'A natural green pigment extracted from green plants such as nettle, grass, alfalfa, or spinach. Halal.',
    ru: 'Природный зелёный пигмент, извлекаемый из зелёных растений — крапивы, травы, люцерны или шпината. Халяль.',
  },
  'Xlorofilin daha istiyə davamlı formasıdır — magnezium mis ilə əvəz olunur, bitki mənşəli xammaldan alınır. Halaldır.': {
    tr: 'Klorofilin daha ısıya dayanıklı formudur — magnezyum bakırla değiştirilir, bitkisel hammaddeden elde edilir. Helaldir.',
    en: 'A more heat-stable form of chlorophyll — its magnesium is replaced with copper, made from plant-based raw material. Halal.',
    ru: 'Более термостойкая форма хлорофилла — магний заменён на медь, получен из растительного сырья. Халяль.',
  },
  'Tam sintetik yaşıl boyadır — nanə sousu, püstə dondurması və konservləşdirilmiş noxudda istifadə olunur. Halaldır.': {
    tr: 'Tamamen sentetik yeşil boyadır — nane sosu, fıstık dondurması ve konserve bezelyede kullanılır. Helaldir.',
    en: 'A fully synthetic green dye — used in mint sauce, pistachio ice cream, and canned peas. Halal.',
    ru: 'Полностью синтетический зелёный краситель — используется в мятном соусе, фисташковом мороженом и консервированном горошке. Халяль.',
  },
  'Şəkərin sadəcə istiliklə karamelləşdirilməsindən alınan qəhvəyi rəngdir — kola, souslar və çörək-bulka məmulatlarında geniş istifadə olunur. Bitki mənşəli xammaldan (şəkər) alındığı üçün halaldır.': {
    tr: 'Şekerin sadece ısıyla karamelize edilmesinden elde edilen kahverengi renktir — kola, soslar ve unlu mamullerde yaygın olarak kullanılır. Bitkisel hammaddeden (şeker) elde edildiği için helaldir.',
    en: 'A brown color made simply by heat-caramelizing sugar — widely used in cola, sauces, and baked goods. Made from plant-based raw material (sugar), halal.',
    ru: 'Коричневый цвет, получаемый простой термической карамелизацией сахара — широко используется в коле, соусах и хлебобулочных изделиях. Получен из растительного сырья (сахара), халяль.',
  },
  'Şəkərin sulfit birləşmələri iştirakı ilə karamelləşdirilməsindən alınan rəngdir — souslar və içkilərdə istifadə olunur. Halaldır (sulfit reaksiya vasitəsidir, tərkib hissəsi kimi qalmır).': {
    tr: 'Şekerin sülfit bileşikleri eşliğinde karamelize edilmesinden elde edilen renktir — soslar ve içeceklerde kullanılır. Helaldir (sülfit reaksiyon aracıdır, bileşen olarak kalmaz).',
    en: 'A color made by caramelizing sugar in the presence of sulfite compounds — used in sauces and drinks. Halal (the sulfite is a reaction aid, not a remaining ingredient).',
    ru: 'Цвет, получаемый карамелизацией сахара в присутствии сульфитных соединений — используется в соусах и напитках. Халяль (сульфит — вспомогательное вещество реакции, не остаётся в составе).',
  },
  'Şəkərin ammonium birləşmələri iştirakı ilə karamelləşdirilməsindən alınan tünd qəhvəyi rəngdir — souslar, konyak-tipli içkilər və çörəkçilikdə istifadə olunur. Ammonium reaksiya katalizatoru kimi işlədilir, heyvan mənşəli deyil — halaldır.': {
    tr: 'Şekerin amonyum bileşikleri eşliğinde karamelize edilmesinden elde edilen koyu kahverengi renktir — soslar, konyak tipi içecekler ve fırıncılıkta kullanılır. Amonyum reaksiyon katalizörü olarak kullanılır, hayvansal değildir — helaldir.',
    en: 'A dark brown color made by caramelizing sugar in the presence of ammonium compounds — used in sauces, brandy-type drinks, and baking. Ammonium is used as a reaction catalyst, not animal-derived — halal.',
    ru: 'Тёмно-коричневый цвет, получаемый карамелизацией сахара в присутствии аммониевых соединений — используется в соусах, напитках типа коньяка и выпечке. Аммоний служит катализатором реакции, не животного происхождения — халяль.',
  },
  'Kolada ən çox rast gəlinən karamel rəngidir — həm sulfit, həm ammonium iştirakı ilə alınır. Bitki mənşəli xammaldan (şəkər), halaldır.': {
    tr: 'Kolada en sık rastlanan karamel rengidir — hem sülfit hem amonyum eşliğinde elde edilir. Bitkisel hammaddeden (şeker), helaldir.',
    en: 'The most common caramel color in cola — made using both sulfite and ammonium. From plant-based raw material (sugar), halal.',
    ru: 'Самый распространённый карамельный краситель в коле — получают с участием сульфита и аммония. Из растительного сырья (сахара), халяль.',
  },
  'Tam sintetik qara boyadır — bəzi sous və kürü əvəzedicilərində istifadə olunur (bəzi ölkələrdə, məs. ABŞ-da, qadağandır). Halaldır.': {
    tr: 'Tamamen sentetik siyah boyadır — bazı soslar ve havyar taklitlerinde kullanılır (ABD gibi bazı ülkelerde yasaktır). Helaldir.',
    en: 'A fully synthetic black dye — used in some sauces and caviar substitutes (banned in some countries, e.g. the US). Halal.',
    ru: 'Полностью синтетический чёрный краситель — используется в некоторых соусах и заменителях икры (запрещён в некоторых странах, напр. в США). Халяль.',
  },
  'Adətən hindistan cevizi qabığı, ağac və ya torfdan hazırlanan aktivləşdirilmiş kömürdür — qara rəng üçün istifadə olunur. Bitki mənşəli xammaldan, halaldır.': {
    tr: 'Genellikle hindistan cevizi kabuğu, odun veya turbadan hazırlanan aktif kömürdür — siyah renk için kullanılır. Bitkisel hammaddeden, helaldir.',
    en: 'Activated carbon usually made from coconut shell, wood, or peat — used for black color. From plant-based raw material, halal.',
    ru: 'Активированный уголь, обычно изготавливаемый из скорлупы кокоса, древесины или торфа — используется для чёрного цвета. Из растительного сырья, халяль.',
  },
  'Tam sintetik qəhvəyi boyadır — şokolad rəngli tort və desertlərdə istifadə olunur. Halaldır.': {
    tr: 'Tamamen sentetik kahverengi boyadır — çikolata renkli pasta ve tatlılarda kullanılır. Helaldir.',
    en: 'A fully synthetic brown dye — used in chocolate-colored cakes and desserts. Halal.',
    ru: 'Полностью синтетический коричневый краситель — используется в тортах и десертах шоколадного цвета. Халяль.',
  },
  'Beta-karotendir — təbiətdə kök və palma yağında olur, sənayedə bitkidən çıxarılır və ya göbələk fermentasiyası (Blakeslea trispora) ilə istehsal olunur. Hər iki yol bitki/mikrob mənşəlidir, halaldır.': {
    tr: 'Beta-karotendir — doğada havuçta ve palm yağında bulunur, endüstride bitkiden elde edilir ya da mantar fermantasyonuyla (Blakeslea trispora) üretilir. Her iki yol da bitkisel/mikrobiyal kaynaklıdır, helaldir.',
    en: 'Beta-carotene — naturally found in carrots and palm oil; industrially extracted from plants or produced by fungal fermentation (Blakeslea trispora). Both routes are plant/microbial, halal.',
    ru: 'Бета-каротин — в природе содержится в моркови и пальмовом масле, в промышленности извлекается из растений или производится грибковой ферментацией (Blakeslea trispora). Оба пути растительного/микробного происхождения, халяль.',
  },
  'Annatto (Bixa orellana) ağacının toxumlarından çıxarılan narıncı-qırmızı rəngdir — çedər pendiri, kərə yağı və snack məhsullarında istifadə olunur. Bitki mənşəlidir, halaldır.': {
    tr: 'Annatto (Bixa orellana) ağacının tohumlarından elde edilen turuncu-kırmızı renktir — cheddar peyniri, tereyağı ve atıştırmalık ürünlerde kullanılır. Bitkisel kaynaklıdır, helaldir.',
    en: 'An orange-red color extracted from the seeds of the annatto tree (Bixa orellana) — used in cheddar cheese, butter, and snack products. Plant-derived, halal.',
    ru: 'Оранжево-красный краситель, извлекаемый из семян дерева аннато (Bixa orellana) — используется в сыре чеддер, сливочном масле и снеках. Растительного происхождения, халяль.',
  },
  'Qırmızı bibərdən (paprika) çıxarılan rəngləyicidir — snack ədviyyatı, sous və pendirdə istifadə olunur. Bitki mənşəlidir, halaldır.': {
    tr: 'Kırmızı biberden (paprika) elde edilen renklendiricidir — atıştırmalık baharatı, sos ve peynirde kullanılır. Bitkisel kaynaklıdır, helaldir.',
    en: 'A colorant extracted from red pepper (paprika) — used in snack seasoning, sauce, and cheese. Plant-derived, halal.',
    ru: 'Краситель, извлекаемый из красного перца (паприки) — используется в приправах для снеков, соусах и сыре. Растительного происхождения, халяль.',
  },
  'Pomidordan çıxarılan qırmızı piqmentdir (göbələk fermentasiyası ilə də istehsal oluna bilər). Bitki/mikrob mənşəlidir, halaldır.': {
    tr: 'Domatesten elde edilen kırmızı pigmenttir (mantar fermantasyonuyla da üretilebilir). Bitkisel/mikrobiyal kaynaklıdır, helaldir.',
    en: 'A red pigment extracted from tomatoes (can also be produced by fungal fermentation). Plant/microbial, halal.',
    ru: 'Красный пигмент, извлекаемый из томатов (также может производиться грибковой ферментацией). Растительного/микробного происхождения, халяль.',
  },
  'Narıncı-qırmızı karotinoiddir — bitkidən çıxarıla və ya sintetik yolla istehsal oluna bilər, hər iki halda heyvan mənşəli deyil. Halaldır.': {
    tr: 'Turuncu-kırmızı karotenoiddir — bitkiden elde edilebilir ya da sentetik yolla üretilebilir, her iki durumda da hayvansal değildir. Helaldir.',
    en: 'An orange-red carotenoid — either plant-extracted or synthetically produced; either way it is not animal-derived. Halal.',
    ru: 'Оранжево-красный каротиноид — может быть извлечён из растений или произведён синтетическим путём, в обоих случаях не животного происхождения. Халяль.',
  },
  'Adətən qazan gülü (marigold) çiçəyindən çıxarılan sarı piqmentdir (yumurta sarısında da təbii olaraq var, lakin qida əlavəsi bitkidən alınır). Halaldır.': {
    tr: 'Genellikle kadife çiçeğinden (marigold) elde edilen sarı pigmenttir (yumurta sarısında da doğal olarak bulunur, ancak gıda katkısı bitkiden elde edilir). Helaldir.',
    en: 'A yellow pigment usually extracted from marigold flowers (also naturally present in egg yolk, but the food-additive form is plant-extracted). Halal.',
    ru: 'Жёлтый пигмент, обычно извлекаемый из цветков бархатцев (естественно содержится и в яичном желтке, но пищевая добавка получается из растения). Халяль.',
  },
  'Narıncı-qırmızı karotinoiddir — göbələklərdə/balıqlarda təbii olsa da, qida əlavəsi kimi kimyəvi sintez yolu ilə istehsal olunur. Halaldır.': {
    tr: 'Turuncu-kırmızı karotenoiddir — mantar/balıklarda doğal olarak bulunsa da, gıda katkısı olarak kimyasal sentezle üretilir. Helaldir.',
    en: 'An orange-red carotenoid — naturally found in mushrooms/fish, but as a food additive it is chemically synthesized. Halal.',
    ru: 'Оранжево-красный каротиноид — естественно содержится в грибах/рыбе, но как пищевая добавка производится путём химического синтеза. Халяль.',
  },
  'Qırmızı çuğundurdan çıxarılan təbii qırmızı rəngdir. Bitki mənşəlidir, halaldır.': {
    tr: 'Kırmızı pancardan elde edilen doğal kırmızı renktir. Bitkisel kaynaklıdır, helaldir.',
    en: 'A natural red color extracted from red beetroot. Plant-derived, halal.',
    ru: 'Натуральный красный краситель, извлекаемый из красной свёклы. Растительного происхождения, халяль.',
  },
  'Üzüm qabığı, qırmızı kələm, qara qarağat kimi bitkilərdən çıxarılan piqmentlərdir. Halaldır.': {
    tr: 'Üzüm kabuğu, kırmızı lahana, siyah frenk üzümü gibi bitkilerden elde edilen pigmentlerdir. Helaldir.',
    en: 'Pigments extracted from plants such as grape skin, red cabbage, and blackcurrant. Halal.',
    ru: 'Пигменты, извлекаемые из растений — кожуры винограда, красной капусты, чёрной смородины. Халяль.',
  },
  'Təbaşir/əhəngdaşı mineralıdır — ağ rəngləyici və kalsium mənbəyi kimi istifadə olunur. Mineral olduğu üçün halaldır.': {
    tr: 'Tebeşir/kireçtaşı mineralidir — beyaz renklendirici ve kalsiyum kaynağı olarak kullanılır. Mineral olduğu için helaldir.',
    en: 'A chalk/limestone mineral — used as a white colorant and calcium source. Being a mineral, it is halal.',
    ru: 'Минерал мел/известняк — используется как белый краситель и источник кальция. Как минерал, халяль.',
  },
  'Mineral əsaslı ağ piqmentdir. Genotoksiklik narahatlığı ilə AB-də 2022-dən qida əlavəsi kimi qadağan edilib (bəzi başqa ölkələrdə hələ icazəlidir) — bu qida təhlükəsizliyi qərarıdır, halallıqla bağlı deyil; mineral mənşəli olduğu üçün özü halal sayılır.': {
    tr: 'Mineral kökenli beyaz pigmenttir. Genotoksisite endişesiyle AB\'de 2022\'den beri gıda katkısı olarak yasaklıdır (bazı diğer ülkelerde hâlâ izinlidir) — bu gıda güvenliği kararıdır, helal-haramla ilgili değildir; mineral kökenli olduğu için kendisi helal sayılır.',
    en: 'A mineral-based white pigment. Banned as a food additive in the EU since 2022 over genotoxicity concerns (still permitted in some other countries) — this is a food-safety decision, not a halal one; being mineral-derived, it is itself considered halal.',
    ru: 'Белый пигмент минерального происхождения. С 2022 года запрещён как пищевая добавка в ЕС из-за опасений генотоксичности (в некоторых других странах всё ещё разрешён) — это решение по безопасности пищи, не связанное с халяльностью; сам по себе, как минерал, считается халяльным.',
  },
  'Dəmir oksidi mineralıdır (mahiyyətcə pas) — qəhvəyi, qırmızı və qara çalarlar üçün istifadə olunur. Mineral olduğu üçün halaldır.': {
    tr: 'Demir oksit mineralidir (esasen pastır) — kahverengi, kırmızı ve siyah tonlar için kullanılır. Mineral olduğu için helaldir.',
    en: 'An iron oxide mineral (essentially rust) — used for brown, red, and black shades. Being a mineral, it is halal.',
    ru: 'Минерал оксида железа (по сути ржавчина) — используется для коричневых, красных и чёрных оттенков. Как минерал, халяль.',
  },
  'Metallik piqmentdir — əsasən tort bəzəkləri və şirniyyatın üzərində dekorativ örtük kimi istifadə olunur. Metal olduğu üçün halaldır.': {
    tr: 'Metalik pigmenttir — genellikle pasta süslemeleri ve şekerlemelerin üzerinde dekoratif kaplama olarak kullanılır. Metal olduğu için helaldir.',
    en: 'A metallic pigment — mainly used as a decorative coating on cake decorations and confectionery. Being a metal, it is halal.',
    ru: 'Металлический пигмент — в основном используется как декоративное покрытие для украшения тортов и кондитерских изделий. Как металл, халяль.',
  },
  'Gümüş rəngli dekorativ örtükdür (məs. gümüş dragee, tort bəzəyi). Metal olduğu üçün halaldır.': {
    tr: 'Gümüş renkli dekoratif kaplamadır (örn. gümüş draje, pasta süslemesi). Metal olduğu için helaldir.',
    en: 'A silver-colored decorative coating (e.g. silver dragées, cake decoration). Being a metal, it is halal.',
    ru: 'Декоративное покрытие серебристого цвета (напр. серебряное драже, украшение тортов). Как металл, халяль.',
  },
  'Qızıl vərəq şəklində dekorativ örtükdür (bəzi şokolad və içkilərdə). Metal olduğu üçün halaldır.': {
    tr: 'Altın varak şeklinde dekoratif kaplamadır (bazı çikolata ve içeceklerde). Metal olduğu için helaldir.',
    en: 'A decorative coating in the form of gold leaf (in some chocolate and drinks). Being a metal, it is halal.',
    ru: 'Декоративное покрытие в виде сусального золота (в некоторых видах шоколада и напитков). Как металл, халяль.',
  },
  'Sintetik qırmızı piqmentdir — bəzi pendir qabığının rənglənməsində istifadə olunur. Halaldır.': {
    tr: 'Sentetik kırmızı pigmenttir — bazı peynir kabuklarının renklendirilmesinde kullanılır. Helaldir.',
    en: 'A synthetic red pigment — used to color some cheese rinds. Halal.',
    ru: 'Синтетический красный пигмент — используется для окрашивания корки некоторых сыров. Халяль.',
  },
  'Təbiətdə itburnu meyvəsində olsa da, sənayedə sintetik yolla istehsal olunur — kif və maya artımının qarşısını alır. Pendir, şərab, çörək-bulka və qurudulmuş meyvələrdə istifadə olunur. Halaldır.': {
    tr: 'Doğada üvez meyvesinde bulunsa da, endüstride sentetik yolla üretilir — küf ve maya üremesini engeller. Peynir, şarap, unlu mamuller ve kuru meyvelerde kullanılır. Helaldir.',
    en: 'Naturally found in rowan berries, but industrially produced synthetically — inhibits mold and yeast growth. Used in cheese, wine, baked goods, and dried fruit. Halal.',
    ru: 'В природе содержится в ягодах рябины, но в промышленности производится синтетическим путём — подавляет рост плесени и дрожжей. Используется в сыре, вине, выпечке и сухофруктах. Халяль.',
  },
  'Sorbin turşusunun kalium duzudur — eyni konservant təsiri, geniş istifadə olunur. Halaldır.': {
    tr: 'Sorbik asidin potasyum tuzudur — aynı koruyucu etki, yaygın olarak kullanılır. Helaldir.',
    en: 'The potassium salt of sorbic acid — same preservative effect, widely used. Halal.',
    ru: 'Калиевая соль сорбиновой кислоты — тот же консервирующий эффект, широко используется. Халяль.',
  },
  'Təbiətdə çoyunca (cranberry) kimi meyvələrdə olsa da, sənayedə sintetik yolla alınır — sərinləşdirici içki, turşu və mürəbbələrdə konservant kimi istifadə olunur. Halaldır.': {
    tr: 'Doğada kızılcık gibi meyvelerde bulunsa da, endüstride sentetik yolla elde edilir — soğuk içecek, turşu ve reçellerde koruyucu olarak kullanılır. Helaldir.',
    en: 'Naturally found in fruits like cranberries, but industrially made synthetically — used as a preservative in soft drinks, pickles, and jams. Halal.',
    ru: 'В природе содержится в таких ягодах, как клюква, но в промышленности получается синтетическим путём — используется как консервант в прохладительных напитках, маринадах и джемах. Халяль.',
  },
  'Benzoy turşusunun natrium duzudur — sərinləşdirici içki, sous və turşularda konservant kimi istifadə olunur. Halaldır (vitamin C ilə birlikdə iz miqdarda benzol əmələ gətirməsi qida təhlükəsizliyi mövzusudur, halallıqla bağlı deyil).': {
    tr: 'Benzoik asidin sodyum tuzudur — soğuk içecek, sos ve turşularda koruyucu olarak kullanılır. Helaldir (C vitaminiyle birlikte eser miktarda benzen oluşturması gıda güvenliği konusudur, helal-haramla ilgili değildir).',
    en: 'The sodium salt of benzoic acid — used as a preservative in soft drinks, sauces, and pickles. Halal (its trace-level benzene formation together with vitamin C is a food-safety matter, not a halal one).',
    ru: 'Натриевая соль бензойной кислоты — используется как консервант в прохладительных напитках, соусах и маринадах. Халяль (образование следовых количеств бензола вместе с витамином C — вопрос безопасности пищи, не халяльности).',
  },
  'Benzoy turşusunun kalium duzudur, eyni istifadə sahəsi. Halaldır.': {
    tr: 'Benzoik asidin potasyum tuzudur, aynı kullanım alanı. Helaldir.',
    en: 'The potassium salt of benzoic acid, same use. Halal.',
    ru: 'Калиевая соль бензойной кислоты, та же сфера применения. Халяль.',
  },
  'Benzoy turşusunun kalsium duzudur, eyni istifadə sahəsi. Halaldır.': {
    tr: 'Benzoik asidin kalsiyum tuzudur, aynı kullanım alanı. Helaldir.',
    en: 'The calcium salt of benzoic acid, same use. Halal.',
    ru: 'Кальциевая соль бензойной кислоты, та же сфера применения. Халяль.',
  },
  'Paraben qrupundan sintetik konservantdır — qidada istifadəsi kosmetikaya nisbətən azdır. Halaldır.': {
    tr: 'Paraben grubundan sentetik koruyucudur — gıdada kullanımı kozmetiğe göre azdır. Helaldir.',
    en: 'A synthetic preservative from the paraben group — used less in food than in cosmetics. Halal.',
    ru: 'Синтетический консервант группы парабенов — в пищевых продуктах используется реже, чем в косметике. Халяль.',
  },
  'E214-ün natrium duzudur, eyni sinif konservant. Halaldır.': {
    tr: 'E214\'ün sodyum tuzudur, aynı sınıf koruyucu. Helaldir.',
    en: 'The sodium salt of E214, same class of preservative. Halal.',
    ru: 'Натриевая соль E214, консервант того же класса. Халяль.',
  },
  'Paraben qrupundan sintetik konservantdır. Halaldır.': {
    tr: 'Paraben grubundan sentetik koruyucudur. Helaldir.',
    en: 'A synthetic preservative from the paraben group. Halal.',
    ru: 'Синтетический консервант группы парабенов. Халяль.',
  },
  'E218-in natrium duzudur. Halaldır.': {
    tr: 'E218\'in sodyum tuzudur. Helaldir.',
    en: 'The sodium salt of E218. Halal.',
    ru: 'Натриевая соль E218. Халяль.',
  },
  'Qurudulmuş meyvə, şərab və şirələrin saralmasının/mikrob artımının qarşısını alan kimyəvi qazdır. Mineral/kimyəvi mənşəli, halaldır (astma xəstələrində allergik reaksiyaya səbəb ola bilər — qida təhlükəsizliyi qeydidir).': {
    tr: 'Kuru meyve, şarap ve meyve sularının sararmasını/mikrop üremesini önleyen kimyasal gazdır. Mineral/kimyasal kaynaklıdır, helaldir (astım hastalarında alerjik reaksiyona neden olabilir — gıda güvenliği notudur).',
    en: 'A chemical gas that prevents browning/microbial growth in dried fruit, wine, and juices. Mineral/chemical in origin, halal (can trigger an allergic reaction in asthmatics — a food-safety note).',
    ru: 'Химический газ, предотвращающий потемнение/рост микробов в сухофруктах, вине и соках. Минерального/химического происхождения, халяль (может вызывать аллергическую реакцию у астматиков — примечание по безопасности пищи).',
  },
  'Kükürd dioksidin duz formasıdır, eyni konservasiya funksiyası. Halaldır.': {
    tr: 'Kükürt dioksitin tuz formudur, aynı koruma işlevi. Helaldir.',
    en: 'A salt form of sulfur dioxide, same preservative function. Halal.',
    ru: 'Солевая форма диоксида серы, та же консервирующая функция. Халяль.',
  },
  'Sulfit qrupundan konservantdır. Halaldır.': {
    tr: 'Sülfit grubundan koruyucudur. Helaldir.',
    en: 'A preservative from the sulfite group. Halal.',
    ru: 'Консервант группы сульфитов. Халяль.',
  },
  'Sulfit qrupundan konservantdır — quru meyvə və şərabda geniş istifadə olunur. Halaldır.': {
    tr: 'Sülfit grubundan koruyucudur — kuru meyve ve şarapta yaygın olarak kullanılır. Helaldir.',
    en: 'A preservative from the sulfite group — widely used in dried fruit and wine. Halal.',
    ru: 'Консервант группы сульфитов — широко используется в сухофруктах и вине. Халяль.',
  },
  'Sulfit qrupundan konservantdır, şərabçılıqda geniş istifadə olunur. Halaldır.': {
    tr: 'Sülfit grubundan koruyucudur, şarapçılıkta yaygın olarak kullanılır. Helaldir.',
    en: 'A preservative from the sulfite group, widely used in winemaking. Halal.',
    ru: 'Консервант группы сульфитов, широко используется в виноделии. Халяль.',
  },
  'Süddə təbii olaraq tapılan Lactococcus lactis bakteriyasının fermentasiyası ilə istehsal olunan antimikrobial peptiddir — pendir və konservləşdirilmiş qidalarda istifadə olunur. Bakterial fermentasiya məhsulu olduğu üçün halaldır.': {
    tr: 'Sütte doğal olarak bulunan Lactococcus lactis bakterisinin fermantasyonuyla üretilen antimikrobiyal peptittir — peynir ve konserve gıdalarda kullanılır. Bakteriyel fermantasyon ürünü olduğu için helaldir.',
    en: 'An antimicrobial peptide produced by fermenting Lactococcus lactis, a bacterium naturally found in milk — used in cheese and canned foods. Being a bacterial fermentation product, it is halal.',
    ru: 'Антимикробный пептид, производимый ферментацией бактерии Lactococcus lactis, естественно содержащейся в молоке — используется в сыре и консервированных продуктах. Как продукт бактериальной ферментации, халяль.',
  },
  'Streptomyces natalensis bakteriyasının fermentasiyası ilə istehsal olunan antifungal maddədir — pendir və qurudulmuş kolbasa qabığının səthinə çəkilir. Bakterial fermentasiya məhsulu, halaldır.': {
    tr: 'Streptomyces natalensis bakterisinin fermantasyonuyla üretilen antifungal maddedir — peynir ve kuru sucuk kabuğunun yüzeyine uygulanır. Bakteriyel fermantasyon ürünüdür, helaldir.',
    en: 'An antifungal agent produced by fermenting the bacterium Streptomyces natalensis — applied to the surface of cheese and dried sausage casings. A bacterial fermentation product, halal.',
    ru: 'Противогрибковое вещество, производимое ферментацией бактерии Streptomyces natalensis — наносится на поверхность сыра и оболочки сухих колбас. Продукт бактериальной ферментации, халяль.',
  },
  'Sintetik konservantdır — bəzi pendir növlərində (məs. Provolone) istifadə olunur. Halaldır.': {
    tr: 'Sentetik koruyucudur — bazı peynir çeşitlerinde (örn. Provolone) kullanılır. Helaldir.',
    en: 'A synthetic preservative — used in some cheese varieties (e.g. Provolone). Halal.',
    ru: 'Синтетический консервант — используется в некоторых видах сыра (напр. Проволоне). Халяль.',
  },
  'İçkilərə əlavə edilən, qısa müddətdə parçalanan sintetik mikrob nəzarəti vasitəsidir. Halaldır.': {
    tr: 'İçeceklere eklenen, kısa sürede parçalanan sentetik mikrop kontrol maddesidir. Helaldir.',
    en: 'A synthetic microbial-control agent added to drinks that breaks down quickly. Halal.',
    ru: 'Синтетическое средство микробиологического контроля, добавляемое в напитки, быстро разлагается. Халяль.',
  },
  'Arginin amin turşusundan sintez olunan antimikrobial maddədir — ət və pendir məhsullarında istifadə olunur. Halaldır.': {
    tr: 'Arginin amino asidinden sentezlenen antimikrobiyal maddedir — et ve peynir ürünlerinde kullanılır. Helaldir.',
    en: 'An antimicrobial agent synthesized from the amino acid arginine — used in meat and cheese products. Halal.',
    ru: 'Противомикробное вещество, синтезируемое из аминокислоты аргинина — используется в мясных и сырных продуктах. Халяль.',
  },
  'Antimikrobial lipid-şəkər birləşmələridir — fermentasiya yolu ilə istehsal olunur, lakin substrat kimi istifadə olunan yağın mənbəyi (bitki və ya heyvan) məhsul etiketindən görünmür. Ona görə status "mənbəyindən asılıdır".': {
    tr: 'Antimikrobiyal lipid-şeker bileşikleridir — fermantasyon yoluyla üretilir, ancak substrat olarak kullanılan yağın kaynağı (bitkisel veya hayvansal) ürün etiketinden görünmez. Bu yüzden durum "kaynağa bağlıdır".',
    en: 'Antimicrobial lipid-sugar compounds — produced by fermentation, but the source of the fat used as substrate (plant or animal) isn\'t shown on the label. So the status stays "depends on source".',
    ru: 'Противомикробные липидо-сахарные соединения — производятся путём ферментации, но источник используемого в качестве субстрата жира (растительный или животный) не указан на этикетке. Поэтому статус "зависит от источника".',
  },
  'Nitrit duzudur — kolbasa, sosis və hisə verilmiş ət məhsullarını konservləşdirmək və botulizmin qarşısını almaq üçün istifadə olunur. Özü mineral/kimyəvi maddə olduğu üçün halaldır — lakin adətən ət məhsullarında olduğundan, əsl diqqət yetirilməli məsələ nitritin özü deyil, həmin ətin halal kəsilib-kəsilməməsidir.': {
    tr: 'Nitrit tuzudur — sucuk, sosis ve füme et ürünlerini korumak ve botulizmi önlemek için kullanılır. Kendisi mineral/kimyasal madde olduğu için helaldir — ancak genellikle et ürünlerinde bulunduğundan, asıl dikkat edilmesi gereken nitritin kendisi değil, o etin helal kesilip kesilmediğidir.',
    en: 'A nitrite salt — used to preserve sausages and smoked meat products and prevent botulism. Being a mineral/chemical substance itself, it is halal — but since it typically appears in meat products, what actually needs checking is not the nitrite but whether that meat was halal-slaughtered.',
    ru: 'Нитритная соль — используется для консервации колбас, сосисок и копчёных мясных изделий и предотвращения ботулизма. Сам по себе, как минеральное/химическое вещество, халяль — но поскольку обычно присутствует в мясных продуктах, важнее проверить не сам нитрит, а был ли забой этого мяса халяльным.',
  },
  'Ən çox işlədilən ət konservantıdır — kolbasa/sosisə çəhrayı rəng verir və botulizmin qarşısını alır. Özü halaldır, lakin adətən işləndiyi ət məhsulunun halal kəsim statusu ayrıca yoxlanmalıdır.': {
    tr: 'En yaygın kullanılan et koruyucusudur — sucuk/sosise pembe renk verir ve botulizmi önler. Kendisi helaldir, ancak genellikle kullanıldığı et ürününün helal kesim durumu ayrıca kontrol edilmelidir.',
    en: 'The most commonly used meat preservative — gives sausages their pink color and prevents botulism. It is itself halal, but the halal-slaughter status of the meat product it\'s typically used in should be checked separately.',
    ru: 'Наиболее широко используемый консервант для мяса — придаёт колбасам розовый цвет и предотвращает ботулизм. Сам по себе халяль, но статус халяльного забоя мясного продукта, в котором он обычно используется, следует проверять отдельно.',
  },
  'Ənənəvi ət duzlama üsullarında istifadə olunan nitratdır, bədəndə nitritə çevrilir. Özü halaldır, ət məhsulunun halal kəsim statusu ayrıca məsələdir.': {
    tr: 'Geleneksel et tuzlama yöntemlerinde kullanılan nitrattır, vücutta nitrite dönüşür. Kendisi helaldir, et ürününün helal kesim durumu ayrı bir konudur.',
    en: 'A nitrate used in traditional meat-curing methods, converts to nitrite in the body. Itself halal; the meat product\'s halal-slaughter status is a separate matter.',
    ru: 'Нитрат, используемый в традиционных методах засолки мяса, в организме превращается в нитрит. Сам по себе халяль; статус халяльного забоя мясного продукта — отдельный вопрос.',
  },
  'Ət duzlamada istifadə olunan nitratdır (şoranın bir forması). Özü halaldır, ət məhsulunun halal kəsim statusu ayrıca məsələdir.': {
    tr: 'Et tuzlamada kullanılan nitrattır (güherçilenin bir formu). Kendisi helaldir, et ürününün helal kesim durumu ayrı bir konudur.',
    en: 'A nitrate used in meat curing (a form of saltpeter). Itself halal; the meat product\'s halal-slaughter status is a separate matter.',
    ru: 'Нитрат, используемый при засолке мяса (форма селитры). Сам по себе халяль; статус халяльного забоя мясного продукта — отдельный вопрос.',
  },
  'Sirkənin əsas turşusudur — şəkərin spirtə, sonra sirkəyə fermentasiyası ilə (və ya sintetik yolla) alınır. Halaldır (sirkə özü, azalıq miqdarda qalıq spirt daşısa belə, İslam hüququnda ayrıca müzakirə mövzusudur, lakin E260 additivi kimi halal qəbul edilir).': {
    tr: 'Sirkenin ana asidiedir — şekerin alkole, sonra sirkeye fermantasyonuyla (ya da sentetik yolla) elde edilir. Helaldir (sirkenin kendisi, az miktarda kalıntı alkol taşısa da, İslam hukukunda ayrı bir tartışma konusudur, ancak E260 katkı maddesi olarak helal kabul edilir).',
    en: 'The main acid in vinegar — made by fermenting sugar into alcohol and then into vinegar (or synthetically). Halal (vinegar itself, even carrying a trace residual alcohol, is a separate topic in Islamic jurisprudence, but as the E260 additive it is accepted as halal).',
    ru: 'Основная кислота уксуса — получается ферментацией сахара сначала в спирт, затем в уксус (или синтетически). Халяль (сам уксус, даже с следовым остаточным спиртом, является отдельной темой в исламском праве, но как добавка E260 признаётся халяльным).',
  },
  'Sirkə turşusunun kalium duzudur. Halaldır.': {
    tr: 'Asetik asidin potasyum tuzudur. Helaldir.',
    en: 'The potassium salt of acetic acid. Halal.',
    ru: 'Калиевая соль уксусной кислоты. Халяль.',
  },
  'Sirkə turşusunun natrium duzudur — çips və digər snacklərdə sirkə dadı vermək üçün istifadə olunur. Halaldır.': {
    tr: 'Asetik asidin sodyum tuzudur — cips ve diğer atıştırmalıklara sirke tadı vermek için kullanılır. Helaldir.',
    en: 'The sodium salt of acetic acid — used to give chips and other snacks a vinegar flavor. Halal.',
    ru: 'Натриевая соль уксусной кислоты — используется для придания вкуса уксуса чипсам и другим снекам. Халяль.',
  },
  'Sirkə turşusunun kalsium duzudur. Halaldır.': {
    tr: 'Asetik asidin kalsiyum tuzudur. Helaldir.',
    en: 'The calcium salt of acetic acid. Halal.',
    ru: 'Кальциевая соль уксусной кислоты. Халяль.',
  },
  'Turşuluğu azaldılmış (bufferlənmiş) sirkədir. Halaldır.': {
    tr: 'Asitliği azaltılmış (tamponlanmış) sirkedir. Helaldir.',
    en: 'Vinegar with reduced (buffered) acidity. Halal.',
    ru: 'Уксус с пониженной (буферизованной) кислотностью. Халяль.',
  },
  'Süd turşusudur — adı süddən gəlsə də, sənayedə adətən şəkərin bakterial fermentasiyası ilə istehsal olunur (bitki mənşəli substrat). Nadir hallarda heyvan mənşəli substrat da istifadə oluna bilər, buna görə istehsal mənbəyi dəqiq bilinmədikcə status "mənbəyindən asılıdır" qalır.': {
    tr: 'Laktik asittir — adı sütten gelse de, endüstride genellikle şekerin bakteriyel fermantasyonuyla üretilir (bitkisel substrat). Nadiren hayvansal substrat da kullanılabilir, bu yüzden üretim kaynağı kesin bilinmedikçe durum "kaynağa bağlıdır" olarak kalır.',
    en: 'Lactic acid — despite the name coming from "milk," it is industrially produced by bacterial fermentation of sugar (a plant-based substrate). An animal-derived substrate is occasionally used too, so the status stays "depends on source" unless the production source is confirmed.',
    ru: 'Молочная кислота — несмотря на название от "молока", в промышленности обычно производится бактериальной ферментацией сахара (растительный субстрат). В редких случаях используется и субстрат животного происхождения, поэтому статус остаётся "зависит от источника", пока источник производства не подтверждён.',
  },
  'İsveçrə pendirində təbii olaraq olan bakteriyanın (Propionibacterium) məhsuludur, sənayedə həm fermentasiya, həm sintetik yolla alınır — çörək və pendirdə kif əleyhinə istifadə olunur. Halaldır.': {
    tr: 'İsviçre peynirinde doğal olarak bulunan bakterinin (Propionibacterium) ürünüdür, endüstride hem fermantasyon hem sentetik yolla elde edilir — ekmek ve peynirde küfe karşı kullanılır. Helaldir.',
    en: 'A product of the bacterium (Propionibacterium) naturally found in Swiss cheese, made industrially by both fermentation and synthesis — used against mold in bread and cheese. Halal.',
    ru: 'Продукт бактерии (Propionibacterium), естественно содержащейся в швейцарском сыре, в промышленности получают как ферментацией, так и синтезом — используется против плесени в хлебе и сыре. Халяль.',
  },
  'Propion turşusunun natrium duzudur, çörəkçilikdə geniş istifadə olunur. Halaldır.': {
    tr: 'Propiyonik asidin sodyum tuzudur, fırıncılıkta yaygın olarak kullanılır. Helaldir.',
    en: 'The sodium salt of propionic acid, widely used in baking. Halal.',
    ru: 'Натриевая соль пропионовой кислоты, широко используется в выпечке. Халяль.',
  },
  'Propion turşusunun kalsium duzudur, çörəkçilikdə geniş istifadə olunur. Halaldır.': {
    tr: 'Propiyonik asidin kalsiyum tuzudur, fırıncılıkta yaygın olarak kullanılır. Helaldir.',
    en: 'The calcium salt of propionic acid, widely used in baking. Halal.',
    ru: 'Кальциевая соль пропионовой кислоты, широко используется в выпечке. Халяль.',
  },
  'Propion turşusunun kalium duzudur. Halaldır.': {
    tr: 'Propiyonik asidin potasyum tuzudur. Helaldir.',
    en: 'The potassium salt of propionic acid. Halal.',
    ru: 'Калиевая соль пропионовой кислоты. Халяль.',
  },
  'Mineral turşudur — AB-də qida istifadəsi əsasən kürüylə (kavyar) məhdudlaşır. Mineral olduğu üçün halaldır (yüksək dozada toksikliyi qida təhlükəsizliyi məsələsidir).': {
    tr: 'Mineral asittir — AB\'de gıda kullanımı büyük ölçüde havyarla sınırlıdır. Mineral olduğu için helaldir (yüksek dozda toksisitesi gıda güvenliği konusudur).',
    en: 'A mineral acid — its EU food use is mostly limited to caviar. Being a mineral, it is halal (high-dose toxicity is a food-safety matter).',
    ru: 'Минеральная кислота — в ЕС применение в пище в основном ограничено икрой. Как минерал, халяль (токсичность в высоких дозах — вопрос безопасности пищи).',
  },
  'Boraks olaraq da tanınır — mineral maddədir, qida istifadəsi çox məhduddur. Halaldır.': {
    tr: 'Boraks olarak da bilinir — mineral maddedir, gıda kullanımı oldukça sınırlıdır. Helaldir.',
    en: 'Also known as borax — a mineral substance with very limited food use. Halal.',
    ru: 'Также известен как бура — минеральное вещество, применение в пище очень ограничено. Халяль.',
  },
  'Qazlı içkilərin köpüklənməsi və qablaşdırmada qoruyucu qaz kimi istifadə olunan karbon qazıdır. Halaldır.': {
    tr: 'Gazlı içeceklerin köpürmesi ve ambalajlamada koruyucu gaz olarak kullanılan karbondioksittir. Helaldir.',
    en: 'Carbon dioxide used for carbonating fizzy drinks and as a protective packaging gas. Halal.',
    ru: 'Углекислый газ, используемый для газирования напитков и как защитный упаковочный газ. Халяль.',
  },
  'Almada təbii olaraq olan turşudur, sənayedə sintetik yolla istehsal olunur — turş dadlı şirniyyatlarda geniş istifadə olunur. Halaldır.': {
    tr: 'Elmada doğal olarak bulunan asittir, endüstride sentetik yolla üretilir — ekşi tatlı şekerlemelerde yaygın olarak kullanılır. Helaldir.',
    en: 'An acid naturally found in apples, industrially made synthetically — widely used in sour-flavored sweets. Halal.',
    ru: 'Кислота, естественно содержащаяся в яблоках, в промышленности производится синтетически — широко используется в кислых сладостях. Халяль.',
  },
  'Təbiətdə bəzi bitkilərdə olan, sənayedə sintetik yolla istehsal olunan turşudur — turş şirniyyat və qabartma tozunda istifadə olunur. Halaldır.': {
    tr: 'Doğada bazı bitkilerde bulunan, endüstride sentetik yolla üretilen asittir — ekşi şekerlemede ve kabartma tozunda kullanılır. Helaldir.',
    en: 'An acid found naturally in some plants, industrially made synthetically — used in sour candy and baking powder. Halal.',
    ru: 'Кислота, естественно содержащаяся в некоторых растениях, в промышленности производится синтетически — используется в кислых конфетах и разрыхлителе. Халяль.',
  },
  'Vitamin C — sənayedə demək olar həmişə qlükozadan (adətən qarğıdalı nişastasından) fermentasiya yolu ilə istehsal olunur. Bitki mənşəlidir, halaldır.': {
    tr: 'Vitamin C — endüstride neredeyse her zaman glukozdan (genellikle mısır nişastasından) fermantasyon yoluyla üretilir. Bitkisel kaynaklıdır, helaldir.',
    en: 'Vitamin C — industrially almost always produced by fermenting glucose (usually from corn starch). Plant-derived, halal.',
    ru: 'Витамин C — в промышленности почти всегда производится ферментацией глюкозы (обычно из кукурузного крахмала). Растительного происхождения, халяль.',
  },
  'C vitamininin natrium duzudur — həm antioksidant, həm ət konservasiyasında rəng saxlayıcı kimi istifadə olunur. Halaldır.': {
    tr: 'C vitamininin sodyum tuzudur — hem antioksidan hem et konservesinde renk koruyucu olarak kullanılır. Helaldir.',
    en: 'The sodium salt of vitamin C — used both as an antioxidant and as a color-retention aid in meat preservation. Halal.',
    ru: 'Натриевая соль витамина C — используется и как антиоксидант, и для сохранения цвета в консервации мяса. Халяль.',
  },
  'C vitamininin kalsium duzudur. Halaldır.': {
    tr: 'C vitamininin kalsiyum tuzudur. Helaldir.',
    en: 'The calcium salt of vitamin C. Halal.',
    ru: 'Кальциевая соль витамина C. Халяль.',
  },
  'C vitamininin yağ turşusu ilə birləşməsindən alınan antioksidantdır — istifadə olunan yağ bitki və ya heyvan mənşəli ola bilər, etiketdə göstərilmir. Ona görə status "mənbəyindən asılıdır".': {
    tr: 'C vitamininin yağ asidiyle birleşmesinden elde edilen antioksidandır — kullanılan yağ bitkisel ya da hayvansal olabilir, etikette gösterilmez. Bu yüzden durum "kaynağa bağlıdır".',
    en: 'An antioxidant made by combining vitamin C with a fatty acid — the fat used may be plant or animal-derived and isn\'t shown on the label. So the status stays "depends on source".',
    ru: 'Антиоксидант, получаемый соединением витамина C с жирной кислотой — используемый жир может быть растительного или животного происхождения, на этикетке не указывается. Поэтому статус "зависит от источника".',
  },
  'Bitki yağlarından (soya, günəbaxan, buğda cücərtisi) çıxarılan təbii Vitamin E ekstraktıdır. Halaldır.': {
    tr: 'Bitkisel yağlardan (soya, ayçiçeği, buğday tohumu) elde edilen doğal Vitamin E ekstraktıdır. Helaldir.',
    en: 'A natural Vitamin E extract from vegetable oils (soy, sunflower, wheat germ). Halal.',
    ru: 'Натуральный экстракт витамина E из растительных масел (соевого, подсолнечного, зародышей пшеницы). Халяль.',
  },
  'Vitamin E-nin ən aktiv formasıdır — bitki yağından çıxarılır və ya sintez olunur. Halaldır.': {
    tr: 'Vitamin E\'nin en aktif formudur — bitkisel yağdan elde edilir ya da sentezlenir. Helaldir.',
    en: 'The most active form of Vitamin E — extracted from vegetable oil or synthesized. Halal.',
    ru: 'Наиболее активная форма витамина E — извлекается из растительного масла или синтезируется. Халяль.',
  },
  'Vitamin E formasıdır, bitki yağından çıxarılır. Halaldır.': {
    tr: 'Vitamin E formudur, bitkisel yağdan elde edilir. Helaldir.',
    en: 'A form of Vitamin E, extracted from vegetable oil. Halal.',
    ru: 'Форма витамина E, извлекается из растительного масла. Халяль.',
  },
  'Bitkilərdə (məs. palıd qozası, çay) olan qallik turşusundan sintez olunan antioksidantdır — yağ və snacklərdə istifadə olunur. Halaldır.': {
    tr: 'Bitkilerde (örn. mazı, çay) bulunan galik asitten sentezlenen antioksidandır — yağ ve atıştırmalıklarda kullanılır. Helaldir.',
    en: 'An antioxidant synthesized from gallic acid found in plants (e.g. oak galls, tea) — used in oils and snacks. Halal.',
    ru: 'Антиоксидант, синтезируемый из галловой кислоты, содержащейся в растениях (напр. дубовых орешках, чае) — используется в маслах и снеках. Халяль.',
  },
  'Vitamin C-nin izomeridir, şəkərin fermentasiyası ilə istehsal olunur — ət konservasiyasında rəngi sürətlə sabitləşdirmək üçün istifadə olunur. Halaldır.': {
    tr: 'Vitamin C\'nin izomeridir, şekerin fermantasyonuyla üretilir — et konservesinde rengi hızla sabitlemek için kullanılır. Helaldir.',
    en: 'An isomer of Vitamin C, made by fermenting sugar — used to quickly stabilize color in meat preservation. Halal.',
    ru: 'Изомер витамина C, производится ферментацией сахара — используется для быстрой стабилизации цвета при консервации мяса. Халяль.',
  },
  'Eritorbik turşunun natrium duzudur, eyni istifadə sahəsi. Halaldır.': {
    tr: 'Eritorbik asidin sodyum tuzudur, aynı kullanım alanı. Helaldir.',
    en: 'The sodium salt of erythorbic acid, same use. Halal.',
    ru: 'Натриевая соль эритробиновой кислоты, та же сфера применения. Халяль.',
  },
  'Tam sintetik (neft-kimya əsaslı) antioksidantdır — yağ, marqarin və snacklərdə oksidləşməni yavaşlatmaq üçün istifadə olunur. Heyvan mənşəli deyil, halaldır.': {
    tr: 'Tamamen sentetik (petrokimya kökenli) antioksidandır — yağ, margarin ve atıştırmalıklarda oksidasyonu yavaşlatmak için kullanılır. Hayvansal değildir, helaldir.',
    en: 'A fully synthetic (petrochemical-based) antioxidant — used to slow oxidation in oils, margarine, and snacks. Not animal-derived, halal.',
    ru: 'Полностью синтетический (нефтехимический) антиоксидант — используется для замедления окисления в маслах, маргарине и снеках. Не животного происхождения, халяль.',
  },
  'Tam sintetik antioksidantdır — yağ, dənli məhsullar və saqqızda istifadə olunur. Halaldır.': {
    tr: 'Tamamen sentetik antioksidandır — yağ, tahıl ürünleri ve sakızda kullanılır. Helaldir.',
    en: 'A fully synthetic antioxidant — used in oils, cereal products, and chewing gum. Halal.',
    ru: 'Полностью синтетический антиоксидант — используется в маслах, зерновых продуктах и жевательной резинке. Халяль.',
  },
  'Tam sintetik antioksidantdır, BHA-ya bənzər istifadə sahəsi. Halaldır.': {
    tr: 'Tamamen sentetik antioksidandır, BHA\'ya benzer kullanım alanı. Helaldir.',
    en: 'A fully synthetic antioxidant, similar use to BHA. Halal.',
    ru: 'Полностью синтетический антиоксидант, сфера применения схожа с БГА. Халяль.',
  },
  'Emulqatordur — ən çox soyadan, həmçinin günəbaxandan çıxarılır (halal), lakin yumurta sarısından da alına bilər (heyvan mənşəli, amma haram deyil). Mənbə etiketdə göstərilmədikcə status "mənbəyindən asılıdır" qalır.': {
    tr: 'Emülgatördür — en çok soyadan, ayrıca ayçiçeğinden elde edilir (helal), ancak yumurta sarısından da alınabilir (hayvansal ama haram değil). Kaynak etikette gösterilmedikçe durum "kaynağa bağlıdır" olarak kalır.',
    en: 'An emulsifier — most often extracted from soy, also sunflower (halal), but can also come from egg yolk (animal-derived, though not haram). Unless the source is shown on the label, the status stays "depends on source".',
    ru: 'Эмульгатор — чаще всего извлекается из сои, также подсолнечника (халяль), но может быть получен и из яичного желтка (животного происхождения, но не харам). Пока источник не указан на этикетке, статус остаётся "зависит от источника".',
  },
  'Süd turşusunun natrium duzudur — E270-də olduğu kimi, istehsalda istifadə olunan fermentasiya substratının mənbəyi bilinmədikcə status "mənbəyindən asılıdır" qalır.': {
    tr: 'Laktik asidin sodyum tuzudur — E270\'te olduğu gibi, üretimde kullanılan fermantasyon substratının kaynağı bilinmedikçe durum "kaynağa bağlıdır" olarak kalır.',
    en: 'The sodium salt of lactic acid — as with E270, unless the fermentation substrate\'s source is known, the status stays "depends on source".',
    ru: 'Натриевая соль молочной кислоты — как и с E270, пока источник ферментационного субстрата не известен, статус остаётся "зависит от источника".',
  },
  'Süd turşusunun kalium duzudur — E270-də olduğu kimi mənbə yoxlanmalıdır.': {
    tr: 'Laktik asidin potasyum tuzudur — E270\'te olduğu gibi kaynak kontrol edilmelidir.',
    en: 'The potassium salt of lactic acid — as with E270, the source should be checked.',
    ru: 'Калиевая соль молочной кислоты — как и с E270, источник следует проверить.',
  },
  'Süd turşusunun kalsium duzudur — E270-də olduğu kimi mənbə yoxlanmalıdır.': {
    tr: 'Laktik asidin kalsiyum tuzudur — E270\'te olduğu gibi kaynak kontrol edilmelidir.',
    en: 'The calcium salt of lactic acid — as with E270, the source should be checked.',
    ru: 'Кальциевая соль молочной кислоты — как и с E270, источник следует проверить.',
  },
  'Sitrus meyvələrində təbii olan turşudur, sənayedə şəkərin Aspergillus niger göbələyi ilə fermentasiyasından istehsal olunur. Bitki/mikrob mənşəlidir, halaldır.': {
    tr: 'Narenciye meyvelerinde doğal olarak bulunan asittir, endüstride şekerin Aspergillus niger mantarıyla fermantasyonundan üretilir. Bitkisel/mikrobiyal kaynaklıdır, helaldir.',
    en: 'An acid naturally found in citrus fruits, industrially produced by fermenting sugar with the mold Aspergillus niger. Plant/microbial, halal.',
    ru: 'Кислота, естественно содержащаяся в цитрусовых, в промышленности производится ферментацией сахара плесневым грибом Aspergillus niger. Растительного/микробного происхождения, халяль.',
  },
  'Limon turşusunun natrium duzlarıdır — əridilmiş pendirdə geniş istifadə olunur. Halaldır.': {
    tr: 'Sitrik asidin sodyum tuzlarıdır — eritme peynirinde yaygın olarak kullanılır. Helaldir.',
    en: 'Sodium salts of citric acid — widely used in processed cheese. Halal.',
    ru: 'Натриевые соли лимонной кислоты — широко используются в плавленом сыре. Халяль.',
  },
  'Limon turşusunun kalium duzlarıdır. Halaldır.': {
    tr: 'Sitrik asidin potasyum tuzlarıdır. Helaldir.',
    en: 'Potassium salts of citric acid. Halal.',
    ru: 'Калиевые соли лимонной кислоты. Халяль.',
  },
  'Limon turşusunun kalsium duzlarıdır. Halaldır.': {
    tr: 'Sitrik asidin kalsiyum tuzlarıdır. Helaldir.',
    en: 'Calcium salts of citric acid. Halal.',
    ru: 'Кальциевые соли лимонной кислоты. Халяль.',
  },
  'Üzümdə təbii olan, şərabçılığın yan məhsulu kimi alınan turşudur — izolə edilmiş kimyəvi birləşmə olduğu üçün özü halaldır (şərabın özü ayrıca məsələdir).': {
    tr: 'Üzümde doğal olarak bulunan, şarapçılığın yan ürünü olarak elde edilen asittir — izole edilmiş kimyasal bileşik olduğu için kendisi helaldir (şarabın kendisi ayrı bir konudur).',
    en: 'An acid naturally found in grapes, obtained as a winemaking byproduct — being an isolated chemical compound, it is itself halal (wine itself is a separate matter).',
    ru: 'Кислота, естественно содержащаяся в винограде, получаемая как побочный продукт виноделия — будучи выделенным химическим соединением, сама по себе халяль (само вино — отдельный вопрос).',
  },
  'Şərab turşusunun natrium duzudur. Halaldır.': {
    tr: 'Şarap asidinin sodyum tuzudur. Helaldir.',
    en: 'The sodium salt of tartaric acid. Halal.',
    ru: 'Натриевая соль винной кислоты. Халяль.',
  },
  'Şərab turşusunun kalium duzudur (kalium bitartrat — "cream of tartar" — qabartma tozunda geniş istifadə olunur). Halaldır.': {
    tr: 'Şarap asidinin potasyum tuzudur (potasyum bitartrat — "cream of tartar" — kabartma tozunda yaygın olarak kullanılır). Helaldir.',
    en: 'The potassium salt of tartaric acid (potassium bitartrate — "cream of tartar" — widely used in baking powder). Halal.',
    ru: 'Калиевая соль винной кислоты (гидротартрат калия — винный камень — широко используется в разрыхлителе). Халяль.',
  },
  'Şərab turşusunun qarışıq duzudur (Rochelle duzu). Halaldır.': {
    tr: 'Şarap asidinin karışık tuzudur (Rochelle tuzu). Helaldir.',
    en: 'A mixed salt of tartaric acid (Rochelle salt). Halal.',
    ru: 'Смешанная соль винной кислоты (сегнетова соль). Халяль.',
  },
  'Mineral turşudur — kola tipli içkilərə turş dad vermək üçün istifadə olunur. Halaldır.': {
    tr: 'Mineral asittir — kola tipi içeceklere ekşi tat vermek için kullanılır. Helaldir.',
    en: 'A mineral acid — used to give cola-type drinks a tart taste. Halal.',
    ru: 'Минеральная кислота — используется для придания кислого вкуса напиткам типа колы. Халяль.',
  },
  'Mineral fosfat duzlarıdır — əridilmiş pendir və emal edilmiş ət məhsullarında stabilizator kimi istifadə olunur. Halaldır.': {
    tr: 'Mineral fosfat tuzlarıdır — eritme peyniri ve işlenmiş et ürünlerinde stabilizatör olarak kullanılır. Helaldir.',
    en: 'Mineral phosphate salts — used as stabilizers in processed cheese and processed meat products. Halal.',
    ru: 'Минеральные фосфатные соли — используются как стабилизаторы в плавленом сыре и переработанных мясных продуктах. Халяль.',
  },
  'Mineral fosfat duzlarıdır, eyni istifadə sahəsi. Halaldır.': {
    tr: 'Mineral fosfat tuzlarıdır, aynı kullanım alanı. Helaldir.',
    en: 'Mineral phosphate salts, same use. Halal.',
    ru: 'Минеральные фосфатные соли, та же сфера применения. Халяль.',
  },
  'Kalsium fosfat mineralıdır — qabartma tozunda və kalsium əlavəsi kimi istifadə olunur. Halaldır.': {
    tr: 'Kalsiyum fosfat mineralidir — kabartma tozunda ve kalsiyum takviyesi olarak kullanılır. Helaldir.',
    en: 'A calcium phosphate mineral — used in baking powder and as a calcium supplement. Halal.',
    ru: 'Минерал фосфата кальция — используется в разрыхлителе и как добавка кальция. Халяль.',
  },
  'Maqnezium fosfat mineralıdır. Halaldır.': {
    tr: 'Magnezyum fosfat mineralidir. Helaldir.',
    en: 'A magnesium phosphate mineral. Halal.',
    ru: 'Минерал фосфата магния. Халяль.',
  },
  'Alma turşusunun natrium duzudur. Halaldır.': {
    tr: 'Malik asidin sodyum tuzudur. Helaldir.',
    en: 'The sodium salt of malic acid. Halal.',
    ru: 'Натриевая соль яблочной кислоты. Халяль.',
  },
  'Alma turşusunun kalium duzudur. Halaldır.': {
    tr: 'Malik asidin potasyum tuzudur. Helaldir.',
    en: 'The potassium salt of malic acid. Halal.',
    ru: 'Калиевая соль яблочной кислоты. Халяль.',
  },
  'Alma turşusunun kalsium duzudur. Halaldır.': {
    tr: 'Malik asidin kalsiyum tuzudur. Helaldir.',
    en: 'The calcium salt of malic acid. Halal.',
    ru: 'Кальциевая соль яблочной кислоты. Халяль.',
  },
  'Şərab turşusundan alınan, şərabda kristal əmələ gəlməsinin qarşısını alan maddədir. Halaldır.': {
    tr: 'Şarap asidinden elde edilen, şarapta kristal oluşumunu önleyen maddedir. Helaldir.',
    en: 'A substance made from tartaric acid that prevents crystal formation in wine. Halal.',
    ru: 'Вещество, получаемое из винной кислоты, предотвращает образование кристаллов в вине. Халяль.',
  },
  'Şərab turşusunun kalsium duzudur. Halaldır.': {
    tr: 'Şarap asidinin kalsiyum tuzudur. Helaldir.',
    en: 'The calcium salt of tartaric acid. Halal.',
    ru: 'Кальциевая соль винной кислоты. Халяль.',
  },
  'Tam sintetik turşudur — jele desertlərdə və toz içki qarışıqlarında turş dad üçün istifadə olunur. Halaldır.': {
    tr: 'Tamamen sentetik asittir — jöle tatlılarda ve toz içecek karışımlarında ekşi tat için kullanılır. Helaldir.',
    en: 'A fully synthetic acid — used for a tart taste in gelatin desserts and powdered drink mixes. Halal.',
    ru: 'Полностью синтетическая кислота — используется для кислого вкуса в желейных десертах и порошковых напитках. Халяль.',
  },
  'Adipin turşusunun natrium duzudur. Halaldır.': {
    tr: 'Adipik asidin sodyum tuzudur. Helaldir.',
    en: 'The sodium salt of adipic acid. Halal.',
    ru: 'Натриевая соль адипиновой кислоты. Халяль.',
  },
  'Adipin turşusunun kalium duzudur. Halaldır.': {
    tr: 'Adipik asidin potasyum tuzudur. Helaldir.',
    en: 'The potassium salt of adipic acid. Halal.',
    ru: 'Калиевая соль адипиновой кислоты. Халяль.',
  },
  'Təbiətdə mövcud, sənayedə sintetik yolla istehsal olunan turşudur. Halaldır.': {
    tr: 'Doğada bulunan, endüstride sentetik yolla üretilen asittir. Helaldir.',
    en: 'An acid that occurs naturally, industrially made synthetically. Halal.',
    ru: 'Кислота, встречающаяся в природе, в промышленности производится синтетически. Халяль.',
  },
  'Limon turşusunun ammonium duzudur. Halaldır.': {
    tr: 'Sitrik asidin amonyum tuzudur. Helaldir.',
    en: 'The ammonium salt of citric acid. Halal.',
    ru: 'Аммониевая соль лимонной кислоты. Халяль.',
  },
  'Sintetik xelatlaşdırıcı maddədir — konserv, mayonez və souslarda rəng/dad pozulmasının qarşısını almaq üçün istifadə olunur. Halaldır.': {
    tr: 'Sentetik şelatlayıcı maddedir — konserve, mayonez ve soslarda renk/tat bozulmasını önlemek için kullanılır. Helaldir.',
    en: 'A synthetic chelating agent — used to prevent discoloration/off-flavors in canned food, mayonnaise, and sauces. Halal.',
    ru: 'Синтетическое хелатирующее вещество — используется для предотвращения изменения цвета/вкуса в консервах, майонезе и соусах. Халяль.',
  },
  'Biberiyyə (rosmarin) bitkisindən çıxarılan təbii antioksidantdır. Halaldır.': {
    tr: 'Biberiye (rosmarin) bitkisinden elde edilen doğal antioksidandır. Helaldir.',
    en: 'A natural antioxidant extracted from the rosemary plant. Halal.',
    ru: 'Натуральный антиоксидант, извлекаемый из розмарина. Халяль.',
  },
  'Qəhvəyi dəniz yosunundan çıxarılan qatılaşdırıcıdır. Halaldır.': {
    tr: 'Kahverengi deniz yosunundan elde edilen kıvam arttırıcıdır. Helaldir.',
    en: 'A thickener extracted from brown seaweed. Halal.',
    ru: 'Загуститель, извлекаемый из бурых водорослей. Халяль.',
  },
  'Alqin turşusunun natrium duzudur, dəniz yosunu mənşəlidir. Halaldır.': {
    tr: 'Aljinik asidin sodyum tuzudur, deniz yosunu kaynaklıdır. Helaldir.',
    en: 'The sodium salt of alginic acid, seaweed-derived. Halal.',
    ru: 'Натриевая соль альгиновой кислоты, из морских водорослей. Халяль.',
  },
  'Alqin turşusunun kalium duzudur, dəniz yosunu mənşəlidir. Halaldır.': {
    tr: 'Aljinik asidin potasyum tuzudur, deniz yosunu kaynaklıdır. Helaldir.',
    en: 'The potassium salt of alginic acid, seaweed-derived. Halal.',
    ru: 'Калиевая соль альгиновой кислоты, из морских водорослей. Халяль.',
  },
  'Alqin turşusunun ammonium duzudur, dəniz yosunu mənşəlidir. Halaldır.': {
    tr: 'Aljinik asidin amonyum tuzudur, deniz yosunu kaynaklıdır. Helaldir.',
    en: 'The ammonium salt of alginic acid, seaweed-derived. Halal.',
    ru: 'Аммониевая соль альгиновой кислоты, из морских водорослей. Халяль.',
  },
  'Alqin turşusunun kalsium duzudur, dəniz yosunu mənşəlidir. Halaldır.': {
    tr: 'Aljinik asidin kalsiyum tuzudur, deniz yosunu kaynaklıdır. Helaldir.',
    en: 'The calcium salt of alginic acid, seaweed-derived. Halal.',
    ru: 'Кальциевая соль альгиновой кислоты, из морских водорослей. Халяль.',
  },
  'Alqinatın törəməsidir, dəniz yosunu mənşəlidir. Halaldır.': {
    tr: 'Aljinatın türevidir, deniz yosunu kaynaklıdır. Helaldir.',
    en: 'A derivative of alginate, seaweed-derived. Halal.',
    ru: 'Производное альгината, из морских водорослей. Халяль.',
  },
  'Qırmızı dəniz yosunundan çıxarılan jelləşdirici maddədir — jelatinə bitki mənşəli alternativ kimi istifadə olunur. Halaldır.': {
    tr: 'Kırmızı deniz yosunundan elde edilen jelleştirici maddedir — jelatine bitkisel bir alternatif olarak kullanılır. Helaldir.',
    en: 'A gelling agent extracted from red seaweed — used as a plant-based alternative to gelatin. Halal.',
    ru: 'Желирующее вещество, извлекаемое из красных водорослей — используется как растительная альтернатива желатину. Халяль.',
  },
  'Qırmızı dəniz yosunundan (irland mamırı) çıxarılan qatılaşdırıcıdır — süd məhsulları və bitki südlərində geniş istifadə olunur. Halaldır.': {
    tr: 'Kırmızı deniz yosunundan (İrlanda yosunu) elde edilen kıvam arttırıcıdır — süt ürünleri ve bitkisel sütlerde yaygın olarak kullanılır. Helaldir.',
    en: 'A thickener extracted from red seaweed (Irish moss) — widely used in dairy products and plant-based milks. Halal.',
    ru: 'Загуститель, извлекаемый из красных водорослей (ирландский мох) — широко используется в молочных продуктах и растительном молоке. Халяль.',
  },
  'Emal edilmiş dəniz yosunu ekstraktıdır, karrageenana bənzər istifadə sahəsi. Halaldır.': {
    tr: 'İşlenmiş deniz yosunu ekstraktıdır, karragenana benzer kullanım alanı. Helaldir.',
    en: 'A processed seaweed extract, similar use to carrageenan. Halal.',
    ru: 'Экстракт обработанных водорослей, сфера применения схожа с каррагинаном. Халяль.',
  },
  'Keçiboynuzu ağacının toxumlarından alınan saqqızdır. Halaldır.': {
    tr: 'Keçiboynuzu ağacının tohumlarından elde edilen sakızdır. Helaldir.',
    en: 'A gum obtained from carob tree seeds. Halal.',
    ru: 'Камедь, получаемая из семян рожкового дерева. Халяль.',
  },
  'Quar paxlasının toxumlarından alınan saqqızdır. Halaldır.': {
    tr: 'Guar fasulyesinin tohumlarından elde edilen sakızdır. Helaldir.',
    en: 'A gum obtained from guar bean seeds. Halal.',
    ru: 'Камедь, получаемая из семян гуаровых бобов. Халяль.',
  },
  'Astragalus kolunun şirəsindən alınan bitki saqqızıdır. Halaldır.': {
    tr: 'Astragalus çalısının özsuyundan elde edilen bitkisel sakızdır. Helaldir.',
    en: 'A plant gum obtained from the sap of the Astragalus shrub. Halal.',
    ru: 'Растительная камедь, получаемая из сока кустарника астрагала. Халяль.',
  },
  'Akasiya ağacının şirəsindən alınan saqqızdır. Halaldır.': {
    tr: 'Akasya ağacının özsuyundan elde edilen sakızdır. Helaldir.',
    en: 'A gum obtained from acacia tree sap. Halal.',
    ru: 'Камедь, получаемая из сока акации. Халяль.',
  },
  'Şəkərin (adətən qarğıdalı və ya soyadan) Xanthomonas campestris bakteriyası ilə fermentasiyasından istehsal olunan saqqızdır. Halaldır.': {
    tr: 'Şekerin (genellikle mısır veya soyadan) Xanthomonas campestris bakterisiyle fermantasyonundan üretilen sakızdır. Helaldir.',
    en: 'A gum produced by fermenting sugar (usually from corn or soy) with the bacterium Xanthomonas campestris. Halal.',
    ru: 'Камедь, производимая ферментацией сахара (обычно из кукурузы или сои) бактерией Xanthomonas campestris. Халяль.',
  },
  'Ağac şirəsindən alınan bitki saqqızıdır. Halaldır.': {
    tr: 'Ağaç özsuyundan elde edilen bitkisel sakızdır. Helaldir.',
    en: 'A plant gum obtained from tree sap. Halal.',
    ru: 'Растительная камедь, получаемая из древесного сока. Халяль.',
  },
  'Tara ağacının toxumlarından alınan saqqızdır. Halaldır.': {
    tr: 'Tara ağacının tohumlarından elde edilen sakızdır. Helaldir.',
    en: 'A gum obtained from tara tree seeds. Halal.',
    ru: 'Камедь, получаемая из семян дерева тара. Халяль.',
  },
  'Şəkərin Sphingomonas elodea bakteriyası ilə fermentasiyasından istehsal olunan polisaxariddir. Mikrob fermentasiya məhsuludur, halaldır.': {
    tr: 'Şekerin Sphingomonas elodea bakterisiyle fermantasyonundan üretilen polisakkarittir. Mikrobiyal fermantasyon ürünüdür, helaldir.',
    en: 'A polysaccharide produced by fermenting sugar with the bacterium Sphingomonas elodea. A microbial fermentation product, halal.',
    ru: 'Полисахарид, производимый ферментацией сахара бактерией Sphingomonas elodea. Продукт микробной ферментации, халяль.',
  },
  'Qlükozadan (adətən qarğıdalı və ya buğda nişastasından) istehsal olunan şəkər spirtidir. Halaldır.': {
    tr: 'Glukozdan (genellikle mısır veya buğday nişastasından) üretilen şeker alkolüdür. Helaldir.',
    en: 'A sugar alcohol produced from glucose (usually corn or wheat starch). Halal.',
    ru: 'Сахарный спирт, производимый из глюкозы (обычно кукурузного или пшеничного крахмала). Халяль.',
  },
  'Şəkərdən sintez olunan və ya dəniz yosunundan çıxarılan şəkər spirtidir. Halaldır.': {
    tr: 'Şekerden sentezlenen ya da deniz yosunundan elde edilen şeker alkolüdür. Helaldir.',
    en: 'A sugar alcohol either synthesized from sugar or extracted from seaweed. Halal.',
    ru: 'Сахарный спирт, синтезируемый из сахара или извлекаемый из водорослей. Халяль.',
  },
  'Yağların hidrolizindən alınan qliserindir — şirinləşdirici, nəmləndirici və dad daşıyıcısı kimi qənnadı məmulatları, çörək-bulka və bəzi içkilərdə istifadə olunur. Bitki yağından (soya, palma, kokos), heyvan piyindən və ya neft-kimya yolu ilə sintetik şəkildə istehsal oluna bilər. Mənbə bitki/sintetik olduqda halal, heyvan piyindən olduqda isə heyvanın növü və kəsim üsulundan asılıdır — ona görə status "mənbəyindən asılıdır" olaraq qalır.': {
    tr: 'Yağların hidrolizinden elde edilen gliserindir — tatlandırıcı, nemlendirici ve tat taşıyıcı olarak şekerleme, unlu mamuller ve bazı içeceklerde kullanılır. Bitkisel yağdan (soya, palm, hindistan cevizi), hayvansal yağdan ya da petrokimya yoluyla sentetik olarak üretilebilir. Kaynak bitkisel/sentetik olduğunda helal, hayvansal yağdan olduğundaysa hayvanın türüne ve kesim yöntemine bağlıdır — bu yüzden durum "kaynağa bağlıdır" olarak kalır.',
    en: 'Glycerol obtained from fat hydrolysis — used as a sweetener, humectant, and flavor carrier in confectionery, baked goods, and some drinks. Can be industrially produced from plant oil (soy, palm, coconut), animal fat, or synthetically via petrochemistry. Halal when plant/synthetic; when from animal fat, it depends on the species and slaughter method — so the status stays "depends on source".',
    ru: 'Глицерин, получаемый гидролизом жиров — используется как подсластитель, увлажнитель и носитель вкуса в кондитерских изделиях, выпечке и некоторых напитках. Может производиться из растительного масла (соевого, пальмового, кокосового), животного жира или синтетически нефтехимическим путём. Халяль при растительном/синтетическом источнике; при животном жире зависит от вида животного и способа забоя — поэтому статус остаётся "зависит от источника".',
  },
  'Modifikasiya edilmiş akasiya saqqızıdır. Halaldır.': {
    tr: 'Modifiye edilmiş akasya sakızıdır. Helaldir.',
    en: 'A modified acacia gum. Halal.',
    ru: 'Модифицированная камедь акации. Халяль.',
  },
  'Konjak bitkisinin kökündən alınan qatılaşdırıcıdır. Bitki mənşəlidir, halaldır (kiçik jele şəkilli formaları boğulma riski daşıdığına görə bəzi ölkələrdə uşaqlar üçün xəbərdarlıq tələb olunur — bu qida təhlükəsizliyi qeydidir).': {
    tr: 'Konjak bitkisinin kökünden elde edilen kıvam arttırıcıdır. Bitkisel kaynaklıdır, helaldir (küçük jöle şeklindeki formları boğulma riski taşıdığından bazı ülkelerde çocuklar için uyarı zorunludur — bu gıda güvenliği notudur).',
    en: 'A thickener from the root of the konjac plant. Plant-derived, halal (its small jelly-candy forms carry a choking risk, requiring a child-safety warning in some countries — a food-safety note).',
    ru: 'Загуститель из корня растения конжак. Растительного происхождения, халяль (его формы в виде мелких желейных конфет несут риск удушья, поэтому в некоторых странах требуется предупреждение для детей — примечание по безопасности пищи).',
  },
  'Soya lifindən çıxarılan qatılaşdırıcıdır. Halaldır.': {
    tr: 'Soya lifinden elde edilen kıvam arttırıcıdır. Helaldir.',
    en: 'A thickener extracted from soybean fiber. Halal.',
    ru: 'Загуститель, извлекаемый из соевого волокна. Халяль.',
  },
  'Cassia toxumlarından alınan bitki saqqızıdır. Halaldır.': {
    tr: 'Cassia tohumlarından elde edilen bitkisel sakızdır. Helaldir.',
    en: 'A plant gum obtained from cassia seeds. Halal.',
    ru: 'Растительная камедь, получаемая из семян кассии. Халяль.',
  },
  'Stearin turşusu əsaslı sintetik emulqatordur — stearin bitki yağından və ya heyvan piyindən ola bilər. Mənbə yoxlanmalıdır.': {
    tr: 'Stearik asit bazlı sentetik emülgatördür — stearin bitkisel yağdan ya da hayvansal yağdan olabilir. Kaynak kontrol edilmelidir.',
    en: 'A synthetic emulsifier based on stearic acid — the stearin may come from plant oil or animal fat. The source should be checked.',
    ru: 'Синтетический эмульгатор на основе стеариновой кислоты — стеарин может быть из растительного масла или животного жира. Источник следует проверить.',
  },
  'Sorbitol və yağ turşusundan sintez olunan emulqatordur — yağ turşusunun mənbəyi (bitki/heyvan) etiketdə göstərilmir. Mənbə yoxlanmalıdır.': {
    tr: 'Sorbitol ve yağ asidinden sentezlenen emülgatördür — yağ asidinin kaynağı (bitkisel/hayvansal) etikette gösterilmez. Kaynak kontrol edilmelidir.',
    en: 'An emulsifier synthesized from sorbitol and a fatty acid — the fatty acid\'s source (plant/animal) isn\'t shown on the label. The source should be checked.',
    ru: 'Эмульгатор, синтезируемый из сорбита и жирной кислоты — источник жирной кислоты (растительный/животный) не указан на этикетке. Источник следует проверить.',
  },
  'Dondurma və çörəkçilikdə geniş istifadə olunan emulqatordur — yağ turşusu mənbəyi yoxlanmalıdır.': {
    tr: 'Dondurma ve fırıncılıkta yaygın olarak kullanılan emülgatördür — yağ asidi kaynağı kontrol edilmelidir.',
    en: 'An emulsifier widely used in ice cream and baking — the fatty acid source should be checked.',
    ru: 'Эмульгатор, широко используемый в мороженом и выпечке — источник жирной кислоты следует проверить.',
  },
  'Emulqatordur — yağ turşusu mənbəyi yoxlanmalıdır.': {
    tr: 'Emülgatördür — yağ asidi kaynağı kontrol edilmelidir.',
    en: 'An emulsifier — the fatty acid source should be checked.',
    ru: 'Эмульгатор — источник жирной кислоты следует проверить.',
  },
  'Qənnadı məmulatlarında istifadə olunan emulqatordur — yağ turşusu mənbəyi yoxlanmalıdır.': {
    tr: 'Şekerleme ürünlerinde kullanılan emülgatördür — yağ asidi kaynağı kontrol edilmelidir.',
    en: 'An emulsifier used in confectionery — the fatty acid source should be checked.',
    ru: 'Эмульгатор, используемый в кондитерских изделиях — источник жирной кислоты следует проверить.',
  },
  'Meyvə qabığından (adətən sitrus və ya alma tullantısından) çıxarılan jelləşdirici maddədir — mürəbbə və jeledə geniş istifadə olunur. Bitki mənşəlidir, halaldır.': {
    tr: 'Meyve kabuğundan (genellikle narenciye veya elma posasından) elde edilen jelleştirici maddedir — reçel ve jölede yaygın olarak kullanılır. Bitkisel kaynaklıdır, helaldir.',
    en: 'A gelling agent extracted from fruit peel (usually citrus or apple pomace) — widely used in jam and jelly. Plant-derived, halal.',
    ru: 'Желирующее вещество, извлекаемое из кожуры фруктов (обычно цитрусовых или яблочного жома) — широко используется в джемах и желе. Растительного происхождения, халяль.',
  },
  'Heyvan sümüyü/dərisindən alınır — halal kəsilmiş heyvan və ya balıqdan olarsa halal, donuzdan olarsa tövsiyə edilmir; etiketdə mənbə göstərilmir.': {
    tr: 'Hayvan kemiği/derisinden elde edilir — helal kesilmiş hayvandan ya da balıktan ise helal, domuzdan ise tavsiye edilmez; etikette kaynak gösterilmez.',
    en: 'Extracted from animal bone/skin — halal if from a halal-slaughtered animal or fish, not recommended if from pig; the source isn\'t shown on the label.',
    ru: 'Получают из костей/кожи животных — халяль, если из халяльно забитого животного или рыбы, не рекомендуется, если из свиньи; источник на этикетке не указывается.',
  },
  'Şokoladda lesitinə ucuz alternativ kimi istifadə olunan emulqatordur — adətən rapa (kanola) yağından sintez olunur. Halaldır.': {
    tr: 'Çikolatada lesitine ucuz bir alternatif olarak kullanılan emülgatördür — genellikle kanola yağından sentezlenir. Helaldir.',
    en: 'An emulsifier used in chocolate as a cheaper alternative to lecithin — usually synthesized from rapeseed (canola) oil. Halal.',
    ru: 'Эмульгатор, используемый в шоколаде как более дешёвая альтернатива лецитину — обычно синтезируется из рапсового (канолового) масла. Халяль.',
  },
  'Şəkərdən sintez olunan, aromalı içkilərdə emulsiyanı sabit saxlayan maddədir. Halaldır.': {
    tr: 'Şekerden sentezlenen, aromalı içeceklerde emülsiyonu sabit tutan maddedir. Helaldir.',
    en: 'A substance synthesized from sugar that keeps the emulsion stable in flavored drinks. Halal.',
    ru: 'Вещество, синтезируемое из сахара, стабилизирует эмульсию в ароматизированных напитках. Халяль.',
  },
  'Şam ağacı qatranından alınan qliserin efirləridir — içki emulsiyalarında istifadə olunur, istehsal üsulu (qliserinin mənbəyi) yoxlanıla bilər.': {
    tr: 'Çam ağacı reçinesinden elde edilen gliserin esterleridir — içecek emülsiyonlarında kullanılır, üretim yöntemi (gliserinin kaynağı) kontrol edilebilir.',
    en: 'Glycerol esters made from pine tree resin — used in beverage emulsions; the production method (glycerol\'s source) can be checked.',
    ru: 'Эфиры глицерина, получаемые из смолы сосны — используются в эмульсиях напитков, способ производства (источник глицерина) можно проверить.',
  },
  'Mineral fosfat duzlarıdır — qabartma tozu və emal edilmiş ətdə istifadə olunur. Halaldır.': {
    tr: 'Mineral fosfat tuzlarıdır — kabartma tozu ve işlenmiş ette kullanılır. Helaldir.',
    en: 'Mineral phosphate salts — used in baking powder and processed meat. Halal.',
    ru: 'Минеральные фосфатные соли — используются в разрыхлителе и переработанном мясе. Халяль.',
  },
  'Mineral fosfat duzlarıdır. Halaldır.': {
    tr: 'Mineral fosfat tuzlarıdır. Helaldir.',
    en: 'Mineral phosphate salts. Halal.',
    ru: 'Минеральные фосфатные соли. Халяль.',
  },
  'Mineral fosfat duzlarıdır — emal edilmiş ət və dəniz məhsullarında rütubət saxlamaq üçün istifadə olunur. Halaldır.': {
    tr: 'Mineral fosfat tuzlarıdır — işlenmiş et ve deniz ürünlerinde nem tutmak için kullanılır. Helaldir.',
    en: 'Mineral phosphate salts — used to retain moisture in processed meat and seafood. Halal.',
    ru: 'Минеральные фосфатные соли — используются для удержания влаги в переработанном мясе и морепродуктах. Халяль.',
  },
  'Sintetik polimerdir. Halaldır.': {
    tr: 'Sentetik polimerdir. Helaldir.',
    en: 'A synthetic polymer. Halal.',
    ru: 'Синтетический полимер. Халяль.',
  },
  'Nişastadan istehsal olunan halqavari şəkərdir — dad/qoxu saxlayıcı kimi istifadə olunur. Bitki mənşəlidir, halaldır.': {
    tr: 'Nişastadan üretilen halkasal şekerdir — tat/koku koruyucu olarak kullanılır. Bitkisel kaynaklıdır, helaldir.',
    en: 'A ring-shaped sugar produced from starch — used to retain flavor/aroma. Plant-derived, halal.',
    ru: 'Кольцевидный сахар, производимый из крахмала — используется для сохранения вкуса/аромата. Растительного происхождения, халяль.',
  },
  'Bitki liflərindən (adətən ağac massası və ya pambıq) alınan sellülozadır. Halaldır.': {
    tr: 'Bitki liflerinden (genellikle ağaç hamuru veya pamuk) elde edilen selülozdur. Helaldir.',
    en: 'Cellulose obtained from plant fiber (usually wood pulp or cotton). Halal.',
    ru: 'Целлюлоза, получаемая из растительного волокна (обычно древесной массы или хлопка). Халяль.',
  },
  'Sellülozanın kimyəvi törəməsidir, bitki mənşəlidir. Halaldır.': {
    tr: 'Selülozun kimyasal türevidir, bitkisel kaynaklıdır. Helaldir.',
    en: 'A chemical derivative of cellulose, plant-derived. Halal.',
    ru: 'Химическое производное целлюлозы, растительного происхождения. Халяль.',
  },
  'Sellülozanın kimyəvi törəməsidir — bitki mənşəli jelatin əvəzedicisi kimi də istifadə olunur. Halaldır.': {
    tr: 'Selülozun kimyasal türevidir — bitkisel kaynaklı jelatin ikamesi olarak da kullanılır. Helaldir.',
    en: 'A chemical derivative of cellulose — also used as a plant-based gelatin substitute. Halal.',
    ru: 'Химическое производное целлюлозы — также используется как растительный заменитель желатина. Халяль.',
  },
  'Sellülozanın kimyəvi törəməsidir (CMC) — geniş istifadə olunan qatılaşdırıcıdır. Bitki mənşəlidir, halaldır.': {
    tr: 'Selülozun kimyasal türevidir (CMC) — yaygın kullanılan bir kıvam arttırıcıdır. Bitkisel kaynaklıdır, helaldir.',
    en: 'A chemical derivative of cellulose (CMC) — a widely used thickener. Plant-derived, halal.',
    ru: 'Химическое производное целлюлозы (КМЦ) — широко используемый загуститель. Растительного происхождения, халяль.',
  },
  'CMC-nin çarpaz bağlı formasıdır, bitki mənşəlidir. Halaldır.': {
    tr: 'CMC\'nin çapraz bağlı formudur, bitkisel kaynaklıdır. Helaldir.',
    en: 'A cross-linked form of CMC, plant-derived. Halal.',
    ru: 'Сшитая форма КМЦ, растительного происхождения. Халяль.',
  },
  'CMC-nin hidrolizə uğramış formasıdır, bitki mənşəlidir. Halaldır.': {
    tr: 'CMC\'nin hidrolize uğramış formudur, bitkisel kaynaklıdır. Helaldir.',
    en: 'A hydrolyzed form of CMC, plant-derived. Halal.',
    ru: 'Гидролизованная форма КМЦ, растительного происхождения. Халяль.',
  },
  'Yağ turşusu duzlarıdır — yağın mənbəyi bitki və ya heyvan ola bilər, etiketdə göstərilmir. Mənbə yoxlanmalıdır.': {
    tr: 'Yağ asidi tuzlarıdır — yağın kaynağı bitkisel ya da hayvansal olabilir, etikette gösterilmez. Kaynak kontrol edilmelidir.',
    en: 'Fatty acid salts — the fat\'s source may be plant or animal and isn\'t shown on the label. The source should be checked.',
    ru: 'Соли жирных кислот — источник жира может быть растительным или животным, не указан на этикетке. Источник следует проверить.',
  },
  'Yağ turşusu duzlarıdır — mənbə yoxlanmalıdır.': {
    tr: 'Yağ asidi tuzlarıdır — kaynak kontrol edilmelidir.',
    en: 'Fatty acid salts — the source should be checked.',
    ru: 'Соли жирных кислот — источник следует проверить.',
  },
  'Yağ turşuları ilə qliserinin birləşməsindən alınan emulqatordur — çörək, marqarin, dondurma, şokolad və hazır qənnadı məmulatlarında geniş istifadə olunur. Tərkibindəki yağ turşusu bitki yağından (palma, soya, günəbaxan) və ya heyvan piyindən (adətən mal-qara və ya donuz) ola bilər. Mənbə etiketdə göstərilmədiyi üçün əksər sertifikat orqanları bunu "mənbəyindən asılıdır" kimi qeyd edir — istehsalçı bitki mənşəli və ya halal kəsilmiş heyvandan olduğunu təsdiqləməyincə ehtiyatlı yanaşılmalıdır.': {
    tr: 'Yağ asitleriyle gliserinin birleşmesinden elde edilen emülgatördür — ekmek, margarin, dondurma, çikolata ve hazır şekerleme ürünlerinde yaygın olarak kullanılır. İçerdiği yağ asidi bitkisel yağdan (palm, soya, ayçiçeği) ya da hayvansal yağdan (genellikle sığır veya domuz) olabilir. Kaynak etikette gösterilmediğinden çoğu sertifika kuruluşu bunu "kaynağa bağlıdır" olarak belirtir — üretici bitkisel kaynaklı ya da helal kesilmiş hayvandan olduğunu doğrulamadıkça ihtiyatlı yaklaşılmalıdır.',
    en: 'An emulsifier made by combining fatty acids with glycerol — widely used in bread, margarine, ice cream, chocolate, and packaged confectionery. The fatty acid in it may come from plant oil (palm, soy, sunflower) or animal fat (usually beef or pork). Since the source isn\'t shown on the label, most certification bodies mark it "depends on source" — treat it with caution unless the manufacturer confirms a plant origin or halal-slaughtered animal source.',
    ru: 'Эмульгатор, получаемый соединением жирных кислот с глицерином — широко используется в хлебе, маргарине, мороженом, шоколаде и готовых кондитерских изделиях. Содержащаяся жирная кислота может быть из растительного масла (пальмового, соевого, подсолнечного) или животного жира (обычно говяжьего или свиного). Поскольку источник не указан на этикетке, большинство сертифицирующих органов отмечают это как "зависит от источника" — следует относиться с осторожностью, пока производитель не подтвердит растительное происхождение или халяльный забой животного.',
  },
  'E471-in sirkə turşusu ilə birləşməsindən alınan törəməsidir — eyni səbəbdən (yağ mənbəyi bilinmir) status "mənbəyindən asılıdır".': {
    tr: 'E471\'in asetik asitle birleşmesinden elde edilen türevidir — aynı nedenle (yağ kaynağı bilinmiyor) durum "kaynağa bağlıdır".',
    en: 'A derivative of E471 combined with acetic acid — for the same reason (unknown fat source), the status is "depends on source".',
    ru: 'Производное E471 в соединении с уксусной кислотой — по той же причине (неизвестен источник жира) статус "зависит от источника".',
  },
  'E471-in süd turşusu ilə birləşməsindən alınan törəməsidir — yağ mənbəyi yoxlanmalıdır.': {
    tr: 'E471\'in laktik asitle birleşmesinden elde edilen türevidir — yağ kaynağı kontrol edilmelidir.',
    en: 'A derivative of E471 combined with lactic acid — the fat source should be checked.',
    ru: 'Производное E471 в соединении с молочной кислотой — источник жира следует проверить.',
  },
  'E471-in limon turşusu ilə birləşməsindən alınan törəməsidir — yağ mənbəyi yoxlanmalıdır.': {
    tr: 'E471\'in sitrik asitle birleşmesinden elde edilen türevidir — yağ kaynağı kontrol edilmelidir.',
    en: 'A derivative of E471 combined with citric acid — the fat source should be checked.',
    ru: 'Производное E471 в соединении с лимонной кислотой — источник жира следует проверить.',
  },
  'E471-in şərab turşusu ilə birləşməsindən alınan törəməsidir — yağ mənbəyi yoxlanmalıdır.': {
    tr: 'E471\'in şarap asidiyle birleşmesinden elde edilen türevidir — yağ kaynağı kontrol edilmelidir.',
    en: 'A derivative of E471 combined with tartaric acid — the fat source should be checked.',
    ru: 'Производное E471 в соединении с винной кислотой — источник жира следует проверить.',
  },
  'Çörəkçilikdə xəmiri gücləndirmək üçün istifadə olunan E471 törəməsidir — yağ mənbəyi yoxlanmalıdır.': {
    tr: 'Fırıncılıkta hamuru güçlendirmek için kullanılan E471 türevidir — yağ kaynağı kontrol edilmelidir.',
    en: 'A derivative of E471 used to strengthen dough in baking — the fat source should be checked.',
    ru: 'Производное E471, используемое для укрепления теста в выпечке — источник жира следует проверить.',
  },
  'E471-in qarışıq turşu efirləridir — yağ mənbəyi yoxlanmalıdır.': {
    tr: 'E471\'in karışık asit esterleridir — yağ kaynağı kontrol edilmelidir.',
    en: 'Mixed acid esters of E471 — the fat source should be checked.',
    ru: 'Смешанные эфиры кислот E471 — источник жира следует проверить.',
  },
  'Saxaroza və yağ turşusunun birləşməsindən alınan emulqatordur — yağ turşusu mənbəyi yoxlanmalıdır.': {
    tr: 'Sakaroz ve yağ asidinin birleşmesinden elde edilen emülgatördür — yağ asidi kaynağı kontrol edilmelidir.',
    en: 'An emulsifier made by combining sucrose with a fatty acid — the fatty acid source should be checked.',
    ru: 'Эмульгатор, получаемый соединением сахарозы с жирной кислотой — источник жирной кислоты следует проверить.',
  },
  'Saxaroza və qliseridlərin birləşməsindən alınan emulqatordur — yağ mənbəyi yoxlanmalıdır.': {
    tr: 'Sakaroz ve gliseridlerin birleşmesinden elde edilen emülgatördür — yağ kaynağı kontrol edilmelidir.',
    en: 'An emulsifier made by combining sucrose with glycerides — the fat source should be checked.',
    ru: 'Эмульгатор, получаемый соединением сахарозы с глицеридами — источник жира следует проверить.',
  },
  'Poliqliserol və yağ turşusunun birləşməsindən alınan emulqatordur — yağ mənbəyi yoxlanmalıdır.': {
    tr: 'Poligliserol ve yağ asidinin birleşmesinden elde edilen emülgatördür — yağ kaynağı kontrol edilmelidir.',
    en: 'An emulsifier made by combining polyglycerol with a fatty acid — the fat source should be checked.',
    ru: 'Эмульгатор, получаемый соединением полиглицерина с жирной кислотой — источник жира следует проверить.',
  },
  'Şokoladda geniş istifadə olunan emulqatordur — qliserin və kastor (rıcinus) yağından sintez olunur. Bitki mənşəlidir, halaldır.': {
    tr: 'Çikolatada yaygın kullanılan emülgatördür — gliserin ve hint yağından (rıcinus) sentezlenir. Bitkisel kaynaklıdır, helaldir.',
    en: 'An emulsifier widely used in chocolate — synthesized from glycerol and castor oil. Plant-derived, halal.',
    ru: 'Эмульгатор, широко используемый в шоколаде — синтезируется из глицерина и касторового масла. Растительного происхождения, халяль.',
  },
  'Yağ turşusu efirləridir — yağ mənbəyi yoxlanmalıdır.': {
    tr: 'Yağ asidi esterleridir — yağ kaynağı kontrol edilmelidir.',
    en: 'Fatty acid esters — the fat source should be checked.',
    ru: 'Эфиры жирных кислот — источник жира следует проверить.',
  },
  'Soya yağı əsaslı emulqatordur — mənbəsi açıq şəkildə bitkidir. Halaldır.': {
    tr: 'Soya yağı bazlı emülgatördür — kaynağı açıkça bitkiseldir. Helaldir.',
    en: 'A soybean-oil-based emulsifier — its source is clearly plant-based. Halal.',
    ru: 'Эмульгатор на основе соевого масла — источник явно растительный. Халяль.',
  },
  'Xəmir yaxşılaşdırıcısıdır — stearin turşusunun mənbəyi (bitki/heyvan) yoxlanmalıdır.': {
    tr: 'Hamur iyileştiricidir — stearik asidin kaynağı (bitkisel/hayvansal) kontrol edilmelidir.',
    en: 'A flour treatment agent — the source of the stearic acid (plant/animal) should be checked.',
    ru: 'Улучшитель муки — источник стеариновой кислоты (растительный/животный) следует проверить.',
  },
  'Xəmir yaxşılaşdırıcısıdır — stearin turşusunun mənbəyi yoxlanmalıdır.': {
    tr: 'Hamur iyileştiricidir — stearik asidin kaynağı kontrol edilmelidir.',
    en: 'A flour treatment agent — the source of the stearic acid should be checked.',
    ru: 'Улучшитель муки — источник стеариновой кислоты следует проверить.',
  },
  'Stearin turşusunun şərab turşusu efiridir — stearin mənbəyi yoxlanmalıdır.': {
    tr: 'Stearik asidin şarap asidi esteridir — stearin kaynağı kontrol edilmelidir.',
    en: 'The tartaric acid ester of stearic acid — the stearin source should be checked.',
    ru: 'Эфир винной кислоты стеариновой кислоты — источник стеарина следует проверить.',
  },
  'Sorbitol və stearin turşusunun birləşməsindən alınan emulqatordur — stearin mənbəyi yoxlanmalıdır.': {
    tr: 'Sorbitol ve stearik asidin birleşmesinden elde edilen emülgatördür — stearin kaynağı kontrol edilmelidir.',
    en: 'An emulsifier made by combining sorbitol with stearic acid — the stearin source should be checked.',
    ru: 'Эмульгатор, получаемый соединением сорбита со стеариновой кислотой — источник стеарина следует проверить.',
  },
  'Sorbitan emulqatorudur — stearin mənbəyi yoxlanmalıdır.': {
    tr: 'Sorbitan emülgatörüdür — stearin kaynağı kontrol edilmelidir.',
    en: 'A sorbitan emulsifier — the stearin source should be checked.',
    ru: 'Эмульгатор сорбитан — источник стеарина следует проверить.',
  },
  'Sorbitan emulqatorudur — yağ turşusu mənbəyi yoxlanmalıdır.': {
    tr: 'Sorbitan emülgatörüdür — yağ asidi kaynağı kontrol edilmelidir.',
    en: 'A sorbitan emulsifier — the fatty acid source should be checked.',
    ru: 'Эмульгатор сорбитан — источник жирной кислоты следует проверить.',
  },
  'Sorbitan emulqatorudur — palmitin turşusu mənbəyi yoxlanmalıdır.': {
    tr: 'Sorbitan emülgatörüdür — palmitik asit kaynağı kontrol edilmelidir.',
    en: 'A sorbitan emulsifier — the palmitic acid source should be checked.',
    ru: 'Эмульгатор сорбитан — источник пальмитиновой кислоты следует проверить.',
  },
  'Adından da göründüyü kimi bitki sterollarıdır. Halaldır.': {
    tr: 'Adından da anlaşılacağı gibi bitki sterolleridir. Helaldir.',
    en: 'Plant sterols, as the name suggests. Halal.',
    ru: 'Растительные стеролы, как следует из названия. Халяль.',
  },
  'Adi soda (natrium karbonat) mineralıdır — çörəkçilik və turşuluq tənzimləməsində istifadə olunur. Halaldır.': {
    tr: 'Sıradan soda (sodyum karbonat) mineralidir — fırıncılık ve asitlik düzenlemede kullanılır. Helaldir.',
    en: 'The common soda (sodium carbonate) mineral — used in baking and acidity regulation. Halal.',
    ru: 'Минерал обычной соды (карбоната натрия) — используется в выпечке и регулировании кислотности. Халяль.',
  },
  'Mineral karbonat duzudur. Halaldır.': {
    tr: 'Mineral karbonat tuzudur. Helaldir.',
    en: 'A mineral carbonate salt. Halal.',
    ru: 'Минеральная карбонатная соль. Халяль.',
  },
  'Ənənəvi qabartma agentidir ("hartshorn") — bəzi peçenyelərdə istifadə olunur. Mineral/kimyəvi mənşəlidir, halaldır.': {
    tr: 'Geleneksel kabartma ajanıdır ("hartshorn") — bazı kurabiyelerde kullanılır. Mineral/kimyasal kaynaklıdır, helaldir.',
    en: 'A traditional raising agent ("hartshorn") — used in some cookies. Mineral/chemical in origin, halal.',
    ru: 'Традиционный разрыхлитель ("хартсхорн") — используется в некоторых видах печенья. Минерального/химического происхождения, халяль.',
  },
  'Mineral turşudur, emal prosesində istifadə olunur. Halaldır.': {
    tr: 'Mineral asittir, işleme sürecinde kullanılır. Helaldir.',
    en: 'A mineral acid, used in processing. Halal.',
    ru: 'Минеральная кислота, используется в процессе переработки. Халяль.',
  },
  'Kalium xlorid — süfrə duzunun natrium miqdarını azaltmaq üçün əvəzedici kimi istifadə olunur. Mineral, halaldır.': {
    tr: 'Potasyum klorür — sofra tuzunun sodyum miktarını azaltmak için ikame olarak kullanılır. Mineral, helaldir.',
    en: 'Potassium chloride — used as a substitute to reduce the sodium content of table salt. A mineral, halal.',
    ru: 'Хлорид калия — используется как заменитель для снижения содержания натрия в поваренной соли. Минерал, халяль.',
  },
  'Mineral duzdur — pendirçilikdə və turşulaşdırılmış tərəvəzdə bərklik verən kimi istifadə olunur. Halaldır.': {
    tr: 'Mineral tuzdur — peynircilikte ve turşularda sertlik verici olarak kullanılır. Helaldir.',
    en: 'A mineral salt — used as a firming agent in cheesemaking and pickled vegetables. Halal.',
    ru: 'Минеральная соль — используется как уплотнитель в сыроварении и маринованных овощах. Халяль.',
  },
  'Mineral duzdur (bəzi soya südündən düyü/tofu hazırlanmasında istifadə olunur — "nigari"). Halaldır.': {
    tr: 'Mineral tuzdur (bazı soya sütünden tofu hazırlanmasında kullanılır — "nigari"). Helaldir.',
    en: 'A mineral salt (used to make tofu from soy milk — "nigari"). Halal.',
    ru: 'Минеральная соль (используется для приготовления тофу из соевого молока — "нигари"). Халяль.',
  },
  'Mineral qalay duzudur — konserv meyvə-tərəvəzdə rəng saxlayıcı kimi istifadə olunur. Halaldır.': {
    tr: 'Mineral kalay tuzudur — konserve meyve-sebzede renk koruyucu olarak kullanılır. Helaldir.',
    en: 'A mineral tin salt — used as a color-retention agent in canned fruit and vegetables. Halal.',
    ru: 'Минеральная оловянная соль — используется для сохранения цвета в консервированных фруктах и овощах. Халяль.',
  },
  'Mineral sulfat duzlarıdır. Halaldır.': {
    tr: 'Mineral sülfat tuzlarıdır. Helaldir.',
    en: 'Mineral sulfate salts. Halal.',
    ru: 'Минеральные сульфатные соли. Халяль.',
  },
  'Gips mineralı — tofu istehsalında laxtalandırıcı, çörəkçilikdə mineral əlavə kimi istifadə olunur. Halaldır.': {
    tr: 'Alçı mineralidir — tofu üretiminde pıhtılaştırıcı, fırıncılıkta mineral katkı olarak kullanılır. Helaldir.',
    en: 'The mineral gypsum — used as a coagulant in tofu production and a mineral additive in baking. Halal.',
    ru: 'Минерал гипс — используется как коагулянт в производстве тофу и минеральная добавка в выпечке. Халяль.',
  },
  'Mineral duzdur, çörəkçilikdə maya qidası kimi istifadə olunur. Halaldır.': {
    tr: 'Mineral tuzdur, fırıncılıkta maya besini olarak kullanılır. Helaldir.',
    en: 'A mineral salt, used as yeast nutrient in baking. Halal.',
    ru: 'Минеральная соль, используется как питание для дрожжей в выпечке. Халяль.',
  },
  'Mineral duzdur, turşulaşdırılmış tərəvəzdə bərkidici kimi istifadə olunur. Halaldır.': {
    tr: 'Mineral tuzdur, turşularda sertleştirici olarak kullanılır. Helaldir.',
    en: 'A mineral salt, used as a firming agent in pickled vegetables. Halal.',
    ru: 'Минеральная соль, используется как уплотнитель в маринованных овощах. Халяль.',
  },
  'Mineral duzdur, qabartma tozunda istifadə olunur. Halaldır.': {
    tr: 'Mineral tuzdur, kabartma tozunda kullanılır. Helaldir.',
    en: 'A mineral salt, used in baking powder. Halal.',
    ru: 'Минеральная соль, используется в разрыхлителе. Халяль.',
  },
  'Şap (alum) olaraq da tanınır — mineral duzdur, qabartma tozunda istifadə olunur. Halaldır.': {
    tr: 'Şap olarak da bilinir — mineral tuzdur, kabartma tozunda kullanılır. Helaldir.',
    en: 'Also known as alum — a mineral salt, used in baking powder. Halal.',
    ru: 'Также известен как квасцы — минеральная соль, используется в разрыхлителе. Халяль.',
  },
  'Kaustik soda — mineral kimyəvi maddədir, pretsel/bagel bişirilməsi kimi proseslərdə istifadə olunur. Halaldır.': {
    tr: 'Kostik soda — mineral kimyasal maddedir, çörek/bagel pişirme gibi süreçlerde kullanılır. Helaldir.',
    en: 'Caustic soda — a mineral chemical, used in processes like pretzel/bagel baking. Halal.',
    ru: 'Каустическая сода — минеральное химическое вещество, используется в таких процессах, как выпечка кренделей/бейглов. Халяль.',
  },
  'Mineral kimyəvi maddədir, zeytun emalında istifadə olunur. Halaldır.': {
    tr: 'Mineral kimyasal maddedir, zeytin işlemede kullanılır. Helaldir.',
    en: 'A mineral chemical, used in olive processing. Halal.',
    ru: 'Минеральное химическое вещество, используется при переработке оливок. Халяль.',
  },
  'Sönmüş əhəng — mineral maddədir, mısır tortilla hazırlanmasında (nixtamalizasiya) istifadə olunur. Halaldır.': {
    tr: 'Sönmüş kireç — mineral maddedir, mısır tortillası hazırlanmasında (nixtamalizasyon) kullanılır. Helaldir.',
    en: 'Slaked lime — a mineral substance, used in making corn tortillas (nixtamalization). Halal.',
    ru: 'Гашёная известь — минеральное вещество, используется при приготовлении кукурузных тортилий (никстамализация). Халяль.',
  },
  'Mineral kimyəvi maddədir, emal prosesində istifadə olunur. Halaldır.': {
    tr: 'Mineral kimyasal maddedir, işleme sürecinde kullanılır. Helaldir.',
    en: 'A mineral chemical, used in processing. Halal.',
    ru: 'Минеральное химическое вещество, используется в процессе переработки. Халяль.',
  },
  'Mineral maddədir. Halaldır.': {
    tr: 'Mineral maddedir. Helaldir.',
    en: 'A mineral substance. Halal.',
    ru: 'Минеральное вещество. Халяль.',
  },
  'Sönməmiş əhəng — mineral maddədir. Halaldır.': {
    tr: 'Sönmemiş kireç — mineral maddedir. Helaldir.',
    en: 'Quicklime — a mineral substance. Halal.',
    ru: 'Негашёная известь — минеральное вещество. Халяль.',
  },
  'Dəmir tartrat mineralıdır. Halaldır.': {
    tr: 'Demir tartrat mineralidir. Helaldir.',
    en: 'The mineral iron tartrate. Halal.',
    ru: 'Минерал тартрат железа. Халяль.',
  },
  'Duzun topalanmasının qarşısını alan mineral maddədir — çox az miqdarda istifadə olunur. Halaldır.': {
    tr: 'Tuzun topaklanmasını önleyen mineral maddedir — çok az miktarda kullanılır. Helaldir.',
    en: 'A mineral substance that prevents salt from caking — used in very small amounts. Halal.',
    ru: 'Минеральное вещество, предотвращающее слёживание соли — используется в очень малых количествах. Халяль.',
  },
  'Duz və şərabda topalanma/çöküntünün qarşısını alan mineral maddədir. Halaldır.': {
    tr: 'Tuz ve şarapta topaklanma/çökeltiyi önleyen mineral maddedir. Helaldir.',
    en: 'A mineral substance that prevents caking/precipitation in salt and wine. Halal.',
    ru: 'Минеральное вещество, предотвращающее слёживание/осадок в соли и вине. Халяль.',
  },
  'Mineral maddədir, topalanmanın qarşısını alır. Halaldır.': {
    tr: 'Mineral maddedir, topaklanmayı önler. Helaldir.',
    en: 'A mineral substance, prevents caking. Halal.',
    ru: 'Минеральное вещество, предотвращает слёживание. Халяль.',
  },
  'Mineral fosfat duzudur, qabartma tozunda istifadə olunur. Halaldır.': {
    tr: 'Mineral fosfat tuzudur, kabartma tozunda kullanılır. Helaldir.',
    en: 'A mineral phosphate salt, used in baking powder. Halal.',
    ru: 'Минеральная фосфатная соль, используется в разрыхлителе. Халяль.',
  },
  'Silisium mineralı (qum əsaslı) — toz halında qidaların (məs. duz, ədviyyat) axıcı qalmasını təmin edir. Halaldır.': {
    tr: 'Silisyum mineralidir (kum bazlı) — toz haldeki gıdaların (örn. tuz, baharat) akıcı kalmasını sağlar. Helaldir.',
    en: 'A silicon mineral (sand-based) — keeps powdered foods (e.g. salt, spices) free-flowing. Halal.',
    ru: 'Минерал кремния (на основе песка) — обеспечивает сыпучесть порошкообразных продуктов (напр. соли, специй). Халяль.',
  },
  'Mineral silikatdır, topalanmanın qarşısını alır. Halaldır.': {
    tr: 'Mineral silikattır, topaklanmayı önler. Helaldir.',
    en: 'A mineral silicate, prevents caking. Halal.',
    ru: 'Минеральный силикат, предотвращает слёживание. Халяль.',
  },
  'Talk mineralıdır (kosmetikada da istifadə olunur) — düyü kimi məhsulların cilalanmasında istifadə oluna bilər. Halaldır.': {
    tr: 'Talk mineralidir (kozmetikte de kullanılır) — pirinç gibi ürünlerin parlatılmasında kullanılabilir. Helaldir.',
    en: 'The mineral talc (also used in cosmetics) — can be used to polish products like rice. Halal.',
    ru: 'Минерал тальк (также используется в косметике) — может использоваться для полировки таких продуктов, как рис. Халяль.',
  },
  'Mineral silikatdır. Halaldır.': {
    tr: 'Mineral silikattır. Helaldir.',
    en: 'A mineral silicate. Halal.',
    ru: 'Минеральный силикат. Халяль.',
  },
  'Gil mineralıdır, şərabın durulaşdırılmasında da istifadə olunur. Halaldır.': {
    tr: 'Kil mineralidir, şarabın durultulmasında da kullanılır. Helaldir.',
    en: 'A clay mineral, also used to clarify wine. Halal.',
    ru: 'Глинистый минерал, также используется для осветления вина. Халяль.',
  },
  'Kaolin gil mineralıdır. Halaldır.': {
    tr: 'Kaolin kil mineralidir. Helaldir.',
    en: 'The clay mineral kaolin. Halal.',
    ru: 'Глинистый минерал каолин. Халяль.',
  },
  'Xalis yağ turşularıdır — bitki yağından və ya heyvan piyindən ola bilər, mənbə yoxlanmalıdır.': {
    tr: 'Saf yağ asitleridir — bitkisel yağdan ya da hayvansal yağdan olabilir, kaynak kontrol edilmelidir.',
    en: 'Pure fatty acids — may come from plant oil or animal fat, the source should be checked.',
    ru: 'Чистые жирные кислоты — могут быть из растительного масла или животного жира, источник следует проверить.',
  },
  'Qlükozanın fermentasiyasından alınan turşudur. Bitki mənşəlidir, halaldır.': {
    tr: 'Glukozun fermantasyonundan elde edilen asittir. Bitkisel kaynaklıdır, helaldir.',
    en: 'An acid obtained by fermenting glucose. Plant-derived, halal.',
    ru: 'Кислота, получаемая ферментацией глюкозы. Растительного происхождения, халяль.',
  },
  'Qlükon turşusunun laktonudur — tofu laxtalandırılmasında, kolbasa istehsalında yavaş turşulaşdırıcı kimi istifadə olunur. Halaldır.': {
    tr: 'Glukonik asidin laktonudur — tofu pıhtılaştırmada, sucuk üretiminde yavaş asitlendirici olarak kullanılır. Helaldir.',
    en: 'The lactone of gluconic acid — used as a slow acidifier in tofu coagulation and sausage production. Halal.',
    ru: 'Лактон глюконовой кислоты — используется как медленный подкислитель при коагуляции тофу и производстве колбас. Халяль.',
  },
  'Qlükon turşusunun natrium duzudur. Halaldır.': {
    tr: 'Glukonik asidin sodyum tuzudur. Helaldir.',
    en: 'The sodium salt of gluconic acid. Halal.',
    ru: 'Натриевая соль глюконовой кислоты. Халяль.',
  },
  'Qlükon turşusunun kalium duzudur. Halaldır.': {
    tr: 'Glukonik asidin potasyum tuzudur. Helaldir.',
    en: 'The potassium salt of gluconic acid. Halal.',
    ru: 'Калиевая соль глюконовой кислоты. Халяль.',
  },
  'Qlükon turşusunun kalsium duzudur, kalsium əlavəsi kimi də istifadə olunur. Halaldır.': {
    tr: 'Glukonik asidin kalsiyum tuzudur, kalsiyum takviyesi olarak da kullanılır. Helaldir.',
    en: 'The calcium salt of gluconic acid, also used as a calcium supplement. Halal.',
    ru: 'Кальциевая соль глюконовой кислоты, также используется как добавка кальция. Халяль.',
  },
  'Qlükon turşusunun dəmir duzudur — bəzi zeytunları qaraltmaq üçün istifadə olunur. Halaldır.': {
    tr: 'Glukonik asidin demir tuzudur — bazı zeytinleri karartmak için kullanılır. Helaldir.',
    en: 'The iron salt of gluconic acid — used to blacken some olives. Halal.',
    ru: 'Железная соль глюконовой кислоты — используется для чернения некоторых оливок. Халяль.',
  },
  'Süd turşusunun dəmir duzudur — süd turşusunun (E270-də olduğu kimi) fermentasiya mənbəyi yoxlanmalıdır.': {
    tr: 'Laktik asidin demir tuzudur — laktik asidin (E270\'te olduğu gibi) fermantasyon kaynağı kontrol edilmelidir.',
    en: 'The iron salt of lactic acid — as with E270, the lactic acid\'s fermentation source should be checked.',
    ru: 'Железная соль молочной кислоты — как и с E270, источник ферментации молочной кислоты следует проверить.',
  },
  'Sintetik konservantdır — dəniz məhsullarının (qarides) qaralmasının qarşısını almaq üçün istifadə olunur. Halaldır.': {
    tr: 'Sentetik koruyucudur — deniz ürünlerinin (karides) kararmasını önlemek için kullanılır. Helaldir.',
    en: 'A synthetic preservative — used to prevent darkening in seafood (shrimp). Halal.',
    ru: 'Синтетический консервант — используется для предотвращения потемнения морепродуктов (креветок). Халяль.',
  },
  'Təbiətdə zülallarda geniş yayılmış amin turşusudur, sənayedə şəkərin bakterial fermentasiyası ilə istehsal olunur. Bitki mənşəlidir, halaldır.': {
    tr: 'Doğada proteinlerde yaygın bulunan amino asittir, endüstride şekerin bakteriyel fermantasyonuyla üretilir. Bitkisel kaynaklıdır, helaldir.',
    en: 'An amino acid widely found in proteins in nature, industrially produced by bacterial fermentation of sugar. Plant-derived, halal.',
    ru: 'Аминокислота, широко встречающаяся в белках в природе, в промышленности производится бактериальной ферментацией сахара. Растительного происхождения, халяль.',
  },
  'MSG — qlutamin turşusunun natrium duzudur, sənayedə şəkər/nişastanın bakterial fermentasiyası ilə istehsal olunur. Bitki mənşəlidir, halaldır.': {
    tr: 'MSG — glutamik asidin sodyum tuzudur, endüstride şeker/nişastanın bakteriyel fermantasyonuyla üretilir. Bitkisel kaynaklıdır, helaldir.',
    en: 'MSG — the sodium salt of glutamic acid, industrially produced by bacterial fermentation of sugar/starch. Plant-derived, halal.',
    ru: 'Глутамат натрия (MSG) — натриевая соль глутаминовой кислоты, в промышленности производится бактериальной ферментацией сахара/крахмала. Растительного происхождения, халяль.',
  },
  'Qlutamat duzudur, MSG-yə bənzər. Halaldır.': {
    tr: 'Glutamat tuzudur, MSG\'ye benzer. Helaldir.',
    en: 'A glutamate salt, similar to MSG. Halal.',
    ru: 'Глутаматная соль, аналогичная глутамату натрия. Халяль.',
  },
  'Qlutamat duzudur. Halaldır.': {
    tr: 'Glutamat tuzudur. Helaldir.',
    en: 'A glutamate salt. Halal.',
    ru: 'Глутаматная соль. Халяль.',
  },
  'Dad artırıcı nukleotiddir — bakterial fermentasiya ilə də istehsal oluna bilər. Halaldır.': {
    tr: 'Tat arttırıcı nükleotittir — bakteriyel fermantasyonla da üretilebilir. Helaldir.',
    en: 'A flavor-enhancing nucleotide — can also be produced by bacterial fermentation. Halal.',
    ru: 'Усиливающий вкус нуклеотид — также может производиться бактериальной ферментацией. Халяль.',
  },
  'Guanilat duzudur — bəzən bakterial fermentasiya, bəzən balıq/heyvan mənşəli xammaldan alınır. Mənbə yoxlanmalıdır.': {
    tr: 'Guanilat tuzudur — bazen bakteriyel fermantasyon, bazen balık/hayvansal hammaddeden elde edilir. Kaynak kontrol edilmelidir.',
    en: 'A guanylate salt — sometimes from bacterial fermentation, sometimes from fish/animal-derived raw material. The source should be checked.',
    ru: 'Гуанилатная соль — иногда из бактериальной ферментации, иногда из рыбного/животного сырья. Источник следует проверить.',
  },
  'Guanilat duzudur — mənbə (fermentasiya/heyvan) yoxlanmalıdır.': {
    tr: 'Guanilat tuzudur — kaynak (fermantasyon/hayvansal) kontrol edilmelidir.',
    en: 'A guanylate salt — the source (fermentation/animal) should be checked.',
    ru: 'Гуанилатная соль — источник (ферментация/животный) следует проверить.',
  },
  'Guanilat duzudur — mənbə yoxlanmalıdır.': {
    tr: 'Guanilat tuzudur — kaynak kontrol edilmelidir.',
    en: 'A guanylate salt — the source should be checked.',
    ru: 'Гуанилатная соль — источник следует проверить.',
  },
  'Dad artırıcı nukleotiddir — ənənəvi olaraq balıq/ət ekstraktından, sənayedə isə çox vaxt bakterial fermentasiyadan alınır. Mənbə yoxlanmalıdır.': {
    tr: 'Tat arttırıcı nükleotittir — geleneksel olarak balık/et ekstraktından, endüstride ise çoğunlukla bakteriyel fermantasyondan elde edilir. Kaynak kontrol edilmelidir.',
    en: 'A flavor-enhancing nucleotide — traditionally from fish/meat extract, industrially most often from bacterial fermentation. The source should be checked.',
    ru: 'Усиливающий вкус нуклеотид — традиционно из рыбного/мясного экстракта, в промышленности чаще всего из бактериальной ферментации. Источник следует проверить.',
  },
  'İnozin turşusunun natrium duzudur — balıq/heyvan mənşəli və ya bakterial fermentasiya məhsulu ola bilər. Mənbə yoxlanmalıdır.': {
    tr: 'İnosinik asidin sodyum tuzudur — balık/hayvansal kaynaklı ya da bakteriyel fermantasyon ürünü olabilir. Kaynak kontrol edilmelidir.',
    en: 'The sodium salt of inosinic acid — may be fish/animal-derived or a bacterial fermentation product. The source should be checked.',
    ru: 'Натриевая соль инозиновой кислоты — может быть рыбного/животного происхождения или продуктом бактериальной ферментации. Источник следует проверить.',
  },
  'İnozin turşusunun kalium duzudur — balıq/heyvan mənşəli ola bilər. Mənbə yoxlanmalıdır.': {
    tr: 'İnosinik asidin potasyum tuzudur — balık/hayvansal kaynaklı olabilir. Kaynak kontrol edilmelidir.',
    en: 'The potassium salt of inosinic acid — may be fish/animal-derived. The source should be checked.',
    ru: 'Калиевая соль инозиновой кислоты — может быть рыбного/животного происхождения. Источник следует проверить.',
  },
  'İnozin turşusunun kalsium duzudur — balıq/heyvan mənşəli ola bilər. Mənbə yoxlanmalıdır.': {
    tr: 'İnosinik asidin kalsiyum tuzudur — balık/hayvansal kaynaklı olabilir. Kaynak kontrol edilmelidir.',
    en: 'The calcium salt of inosinic acid — may be fish/animal-derived. The source should be checked.',
    ru: 'Кальциевая соль инозиновой кислоты — может быть рыбного/животного происхождения. Источник следует проверить.',
  },
  'Ribonukleotid qarışığıdır (guanilat+inozinat) — mənbə yoxlanmalıdır.': {
    tr: 'Ribonükleotid karışımıdır (guanilat+inozinat) — kaynak kontrol edilmelidir.',
    en: 'A ribonucleotide mix (guanylate + inosinate) — the source should be checked.',
    ru: 'Смесь рибонуклеотидов (гуанилат + инозинат) — источник следует проверить.',
  },
  'Ribonukleotid qarışığıdır — dad artırıcı kimi chips, souslar və instant şorbalarda geniş istifadə olunur. Mənbə yoxlanmalıdır.': {
    tr: 'Ribonükleotid karışımıdır — tat arttırıcı olarak cips, soslar ve hazır çorbalarda yaygın kullanılır. Kaynak kontrol edilmelidir.',
    en: 'A ribonucleotide mix — widely used as a flavor enhancer in chips, sauces, and instant soups. The source should be checked.',
    ru: 'Смесь рибонуклеотидов — широко используется как усилитель вкуса в чипсах, соусах и супах быстрого приготовления. Источник следует проверить.',
  },
  'Ən sadə amin turşusudur — kimyəvi sintez və ya fermentasiya ilə istehsal oluna bilər, istehsal mənbəyi yoxlanmalıdır.': {
    tr: 'En basit amino asittir — kimyasal sentez ya da fermantasyonla üretilebilir, üretim kaynağı kontrol edilmelidir.',
    en: 'The simplest amino acid — can be produced by chemical synthesis or fermentation; the production source should be checked.',
    ru: 'Простейшая аминокислота — может производиться химическим синтезом или ферментацией, источник производства следует проверить.',
  },
  'Bakterial fermentasiya ilə istehsal olunan amin turşusudur. Halaldır.': {
    tr: 'Bakteriyel fermantasyonla üretilen amino asittir. Helaldir.',
    en: 'An amino acid produced by bacterial fermentation. Halal.',
    ru: 'Аминокислота, производимая бактериальной ферментацией. Халяль.',
  },
  'Mineral duzdur, çeynəmə saqqızında dad artırıcı kimi istifadə olunur. Halaldır.': {
    tr: 'Mineral tuzdur, sakızda tat arttırıcı olarak kullanılır. Helaldir.',
    en: 'A mineral salt, used as a flavor enhancer in chewing gum. Halal.',
    ru: 'Минеральная соль, используется как усилитель вкуса в жевательной резинке. Халяль.',
  },
  'Silikon əsaslı sintetik maddədir — qida qızardılmasında köpük əmələ gəlməsini azaldır. Halaldır.': {
    tr: 'Silikon bazlı sentetik maddedir — gıda kızartmasında köpük oluşumunu azaltır. Helaldir.',
    en: 'A silicone-based synthetic substance — reduces foaming during food frying. Halal.',
    ru: 'Синтетическое вещество на основе силикона — снижает пенообразование при жарке пищи. Халяль.',
  },
  'Arı mumu — meyvə, şokolad dragee və saqqızın üzərinə parlaqlıq vermək üçün istifadə olunur. Arı məhsulu heyvan mənşəli sayılmır (fəqihlərin əksəriyyəti arının özünü yeməyi haram, lakin mumunu halal sayır). Halaldır.': {
    tr: 'Arı mumu — meyve, çikolata draje ve sakıza parlaklık vermek için kullanılır. Arı ürünü hayvansal sayılmaz (fakihlerin çoğu arının kendisini yemeyi haram, ancak mumunu helal sayar). Helaldir.',
    en: 'Beeswax — used to give shine to fruit, chocolate dragées, and gum. A bee product is not considered animal-derived in the usual sense (most scholars hold eating the bee itself as haram, but its wax as halal). Halal.',
    ru: 'Пчелиный воск — используется для придания блеска фруктам, шоколадному драже и жвачке. Продукт пчёл не считается животного происхождения в обычном смысле (большинство факихов считают употребление самой пчелы харамом, а её воск — халялем). Халяль.',
  },
  'Candelilla kolunun səthindən alınan bitki mumu. Halaldır.': {
    tr: 'Candelilla çalısının yüzeyinden elde edilen bitkisel mumdur. Helaldir.',
    en: 'A plant wax from the surface of the candelilla shrub. Halal.',
    ru: 'Растительный воск с поверхности кустарника кандилла. Халяль.',
  },
  'Karnauba palmasının yarpaqlarından alınan bitki mumu — şirniyyat və meyvələrin parlaqlaşdırılmasında istifadə olunur. Halaldır.': {
    tr: 'Karnauba palmiyesinin yapraklarından elde edilen bitkisel mumdur — şekerleme ve meyvelerin parlatılmasında kullanılır. Helaldir.',
    en: 'A plant wax from carnauba palm leaves — used to glaze confectionery and fruit. Halal.',
    ru: 'Растительный воск из листьев пальмы карнауба — используется для глазирования кондитерских изделий и фруктов. Халяль.',
  },
  'Lak böcəyinin (Kerria lacca) ifraz etdiyi qatrandan alınır — şirniyyat və meyvələrin (məs. alma) parlaqlaşdırılmasında istifadə olunur. Həşərat ifrazı olduğu üçün bəzi sertifikat orqanları haram, bəziləri isə (bal kimi) həşəratın özü deyil, ifrazı olduğu üçün icazəli sayır — status mənbə/certifikator baxışından asılıdır.': {
    tr: 'Lak böceğinin (Kerria lacca) salgıladığı reçineden elde edilir — şekerleme ve meyvelerin (örn. elma) parlatılmasında kullanılır. Böcek salgısı olduğu için bazı sertifika kuruluşları haram, bazıları ise (bal gibi) böceğin kendisi değil salgısı olduğu için helal sayar — durum kaynak/sertifikatöre göre değişir.',
    en: 'Made from resin secreted by the lac insect (Kerria lacca) — used to glaze confectionery and fruit (e.g. apples). Since it\'s an insect secretion, some certification bodies rule it haram, while others (like honey) accept it as halal since it\'s a secretion rather than the insect itself — the status depends on the source/certifier\'s view.',
    ru: 'Получают из смолы, выделяемой лаковым насекомым (Kerria lacca) — используется для глазирования кондитерских изделий и фруктов (напр. яблок). Поскольку это выделение насекомого, некоторые сертифицирующие органы признают его харамом, другие (как мёд) считают халялем, так как это выделение, а не само насекомое — статус зависит от источника/позиции сертификатора.',
  },
  'Neft əsaslı mineral mumdur. Halaldır.': {
    tr: 'Petrol kökenli mineral mumdur. Helaldir.',
    en: 'A petroleum-based mineral wax. Halal.',
    ru: 'Минеральный воск на нефтяной основе. Халяль.',
  },
  'Tam sintetik mumdur. Halaldır.': {
    tr: 'Tamamen sentetik mumdur. Helaldir.',
    en: 'A fully synthetic wax. Halal.',
    ru: 'Полностью синтетический воск. Халяль.',
  },
  'Linyit kömüründən alınan mineral mum efirləridir. Halaldır.': {
    tr: 'Linyit kömüründen elde edilen mineral mum esterleridir. Helaldir.',
    en: 'Mineral wax esters obtained from lignite coal. Halal.',
    ru: 'Эфиры минерального воска, получаемые из лигнитного угля. Халяль.',
  },
  'Tam sintetik (neft əsaslı) mumdur. Halaldır.': {
    tr: 'Tamamen sentetik (petrol kökenli) mumdur. Helaldir.',
    en: 'A fully synthetic (petroleum-based) wax. Halal.',
    ru: 'Полностью синтетический (нефтяной) воск. Халяль.',
  },
  'Xəmiri yumşaldan amin turşusudur — tarixən insan saçından/quş lələklərindən, bəzən donuz tükündən alınıb; müasir istehsalda bakterial fermentasiya da geniş yayılıb. Mənbə (fermentasiya, quş tükü, donuz tükü) etiketdə göstərilmədiyi üçün status "mənbəyindən asılıdır".': {
    tr: 'Hamuru yumuşatan amino asittir — tarihsel olarak insan saçından/kuş tüylerinden, bazen domuz kılından elde edilmiştir; modern üretimde bakteriyel fermantasyon da yaygınlaşmıştır. Kaynak (fermantasyon, kuş tüyü, domuz kılı) etikette gösterilmediğinden durum "kaynağa bağlıdır".',
    en: 'An amino acid that softens dough — historically obtained from human hair/bird feathers, sometimes pig bristles; bacterial fermentation is now also common in modern production. Since the source (fermentation, feathers, pig bristles) isn\'t shown on the label, the status is "depends on source".',
    ru: 'Аминокислота, смягчающая тесто — исторически получали из человеческих волос/перьев птиц, иногда из свиной щетины; в современном производстве также широко распространена бактериальная ферментация. Поскольку источник (ферментация, перья, свиная щетина) не указан на этикетке, статус "зависит от источника".',
  },
  'Un ağardılmasında istifadə olunan kimyəvi emal agentidir. Halaldır.': {
    tr: 'Un ağartmada kullanılan kimyasal işlem maddesidir. Helaldir.',
    en: 'A chemical processing agent used to bleach flour. Halal.',
    ru: 'Химический технологический агент, используемый для отбеливания муки. Халяль.',
  },
  'Karbamid (sidik cövhəri) — sənayedə tam sintetik yolla istehsal olunur, çeynəmə saqqızında istifadə olunur. Halaldır.': {
    tr: 'Karbamit (üre) — endüstride tamamen sentetik yolla üretilir, sakızda kullanılır. Helaldir.',
    en: 'Carbamide (urea) — industrially produced fully synthetically, used in chewing gum. Halal.',
    ru: 'Карбамид (мочевина) — в промышленности производится полностью синтетическим путём, используется в жевательной резинке. Халяль.',
  },
  'İnert qazdır, qablaşdırmada oksidləşmənin qarşısını almaq üçün istifadə olunur. Halaldır.': {
    tr: 'İnert gazdır, ambalajlamada oksidasyonu önlemek için kullanılır. Helaldir.',
    en: 'An inert gas, used to prevent oxidation in packaging. Halal.',
    ru: 'Инертный газ, используется для предотвращения окисления в упаковке. Халяль.',
  },
  'İnert qazdır. Halaldır.': {
    tr: 'İnert gazdır. Helaldir.',
    en: 'An inert gas. Halal.',
    ru: 'Инертный газ. Халяль.',
  },
  'Havanın əsas tərkib hissəsidir, qablaşdırmada qoruyucu qaz kimi istifadə olunur. Halaldır.': {
    tr: 'Havanın ana bileşenidir, ambalajlamada koruyucu gaz olarak kullanılır. Helaldir.',
    en: 'The main component of air, used as a protective packaging gas. Halal.',
    ru: 'Основной компонент воздуха, используется как защитный упаковочный газ. Халяль.',
  },
  'Krem/köpük sprey qablarında təzyiq qazı kimi istifadə olunur. Halaldır.': {
    tr: 'Krem/köpük sprey kutularında basınç gazı olarak kullanılır. Helaldir.',
    en: 'Used as a propellant gas in whipped cream/foam spray cans. Halal.',
    ru: 'Используется как газ-пропеллент в баллончиках со взбитыми сливками/пеной. Халяль.',
  },
  'Sprey qablarda təzyiq qazı kimi istifadə olunur. Halaldır.': {
    tr: 'Sprey kutularında basınç gazı olarak kullanılır. Helaldir.',
    en: 'Used as a propellant gas in spray cans. Halal.',
    ru: 'Используется как газ-пропеллент в аэрозольных баллончиках. Халяль.',
  },
  'Bəzi qablaşdırma tətbiqlərində istifadə olunur. Halaldır.': {
    tr: 'Bazı ambalajlama uygulamalarında kullanılır. Helaldir.',
    en: 'Used in some packaging applications. Halal.',
    ru: 'Используется в некоторых видах упаковки. Халяль.',
  },
  'Qablaşdırma qazı kimi istifadə olunur. Halaldır.': {
    tr: 'Ambalajlama gazı olarak kullanılır. Helaldir.',
    en: 'Used as a packaging gas. Halal.',
    ru: 'Используется как упаковочный газ. Халяль.',
  },
  'Tam sintetik, kalorisiz şirinləşdiricidir — sərinləşdirici içki və şəkərsiz məhsullarda geniş istifadə olunur. Halaldır.': {
    tr: 'Tamamen sentetik, kalorisiz tatlandırıcıdır — soğuk içecek ve şekersiz ürünlerde yaygın olarak kullanılır. Helaldir.',
    en: 'A fully synthetic, calorie-free sweetener — widely used in soft drinks and sugar-free products. Halal.',
    ru: 'Полностью синтетический бескалорийный подсластитель — широко используется в прохладительных напитках и продуктах без сахара. Халяль.',
  },
  'İki amin turşusunun (fenilalanin + aspartik turşu) birləşməsindən sintez olunan kalorisiz şirinləşdiricidir. Halaldır (fenilketonuriyalılar üçün xəbərdarlıq tələb olunur — bu tibbi, halallıqla bağlı olmayan qeyddir).': {
    tr: 'İki amino asidin (fenilalanin + aspartik asit) birleşmesinden sentezlenen kalorisiz tatlandırıcıdır. Helaldir (fenilketonürili hastalar için uyarı zorunludur — bu tıbbi, helal-haramla ilgili olmayan bir nottur).',
    en: 'A calorie-free sweetener synthesized by combining two amino acids (phenylalanine + aspartic acid). Halal (a warning is required for people with phenylketonuria — a medical note, not a halal one).',
    ru: 'Бескалорийный подсластитель, синтезируемый соединением двух аминокислот (фенилаланина и аспарагиновой кислоты). Халяль (требуется предупреждение для людей с фенилкетонурией — это медицинское примечание, не связанное с халяльностью).',
  },
  'Tam sintetik şirinləşdiricidir (ABŞ-da qadağandır, AB-də icazəlidir). Halaldır.': {
    tr: 'Tamamen sentetik tatlandırıcıdır (ABD\'de yasak, AB\'de izinlidir). Helaldir.',
    en: 'A fully synthetic sweetener (banned in the US, permitted in the EU). Halal.',
    ru: 'Полностью синтетический подсластитель (запрещён в США, разрешён в ЕС). Халяль.',
  },
  'Şəkərdən istehsal olunan şəkər spirtidir. Halaldır.': {
    tr: 'Şekerden üretilen şeker alkolüdür. Helaldir.',
    en: 'A sugar alcohol produced from sugar. Halal.',
    ru: 'Сахарный спирт, производимый из сахара. Халяль.',
  },
  'Tam sintetik, kalorisiz şirinləşdiricidir — ən qədim süni şirinləşdiricilərdən biridir. Halaldır.': {
    tr: 'Tamamen sentetik, kalorisiz tatlandırıcıdır — en eski yapay tatlandırıcılardan biridir. Helaldir.',
    en: 'A fully synthetic, calorie-free sweetener — one of the oldest artificial sweeteners. Halal.',
    ru: 'Полностью синтетический бескалорийный подсластитель — один из старейших искусственных подсластителей. Халяль.',
  },
  'Şəkərin kimyəvi modifikasiyasından alınan kalorisiz şirinləşdiricidir. Halaldır.': {
    tr: 'Şekerin kimyasal modifikasyonundan elde edilen kalorisiz tatlandırıcıdır. Helaldir.',
    en: 'A calorie-free sweetener made by chemically modifying sugar. Halal.',
    ru: 'Бескалорийный подсластитель, получаемый химической модификацией сахара. Халяль.',
  },
  'Qərbi Afrikadan olan katemfe bitkisinin meyvəsindən çıxarılan zülal əsaslı şirinləşdiricidir — bitki mənşəli olsa da, hazırlanma/emal prosesi (məs. fermentasiya ilə istehsal olunan formalar) yoxlanıla bilər.': {
    tr: 'Batı Afrika kökenli katemfe bitkisinin meyvesinden elde edilen protein bazlı tatlandırıcıdır — bitkisel kaynaklı olsa da, hazırlama/işleme süreci (örn. fermantasyonla üretilen formları) kontrol edilebilir.',
    en: 'A protein-based sweetener extracted from the fruit of the West African katemfe plant — though plant-derived, its preparation/processing method (e.g. forms produced via fermentation) can be checked.',
    ru: 'Белковый подсластитель, извлекаемый из плода западноафриканского растения катемфе — хотя растительного происхождения, способ подготовки/переработки (напр. формы, полученные ферментацией) можно проверить.',
  },
  'Sitrus qabığından sintez olunan şirinləşdiricidir. Bitki mənşəlidir, halaldır.': {
    tr: 'Narenciye kabuğundan sentezlenen tatlandırıcıdır. Bitkisel kaynaklıdır, helaldir.',
    en: 'A sweetener synthesized from citrus peel. Plant-derived, halal.',
    ru: 'Подсластитель, синтезируемый из цитрусовой кожуры. Растительного происхождения, халяль.',
  },
  'Stevia bitkisinin yarpaqlarından çıxarılan təbii şirinləşdiricidir. Halaldır.': {
    tr: 'Stevia bitkisinin yapraklarından elde edilen doğal tatlandırıcıdır. Helaldir.',
    en: 'A natural sweetener extracted from stevia plant leaves. Halal.',
    ru: 'Натуральный подсластитель, извлекаемый из листьев растения стевия. Халяль.',
  },
  'Stevia qlikozidlərinin enzimlə modifikasiya edilmiş formasıdır — istifadə olunan enzimin mənbəyi (mikrob/heyvan) yoxlanıla bilər.': {
    tr: 'Stevia glikozitlerinin enzimle modifiye edilmiş formudur — kullanılan enzimin kaynağı (mikrobiyal/hayvansal) kontrol edilebilir.',
    en: 'An enzyme-modified form of steviol glycosides — the source (microbial/animal) of the enzyme used can be checked.',
    ru: 'Ферментативно модифицированная форма гликозидов стевии — источник используемого фермента (микробный/животный) можно проверить.',
  },
  'Stevia qlikozidlərinin qlükozillə modifikasiya edilmiş formasıdır — istehsal üsulu yoxlanmalıdır.': {
    tr: 'Stevia glikozitlerinin glukozille modifiye edilmiş formudur — üretim yöntemi kontrol edilmelidir.',
    en: 'A glucosylated form of steviol glycosides — the production method should be checked.',
    ru: 'Глюкозилированная форма гликозидов стевии — способ производства следует проверить.',
  },
  'Aspartama bənzər, ondan qat-qat güclü tam sintetik şirinləşdiricidir. Halaldır.': {
    tr: 'Aspartama benzer, ondan kat kat güçlü tamamen sentetik tatlandırıcıdır. Helaldir.',
    en: 'A fully synthetic sweetener similar to aspartame but many times more potent. Halal.',
    ru: 'Полностью синтетический подсластитель, похожий на аспартам, но во много раз сильнее. Халяль.',
  },
  'Aspartam və asesulfam K-nın birləşmiş duzudur. Halaldır.': {
    tr: 'Aspartam ve asesülfam K\'nın birleşik tuzudur. Helaldir.',
    en: 'A combined salt of aspartame and acesulfame K. Halal.',
    ru: 'Комбинированная соль аспартама и ацесульфама К. Халяль.',
  },
  'Nişastadan istehsal olunan şəkər spirti siropudur. Halaldır.': {
    tr: 'Nişastadan üretilen şeker alkolü şurubudur. Helaldir.',
    en: 'A sugar-alcohol syrup produced from starch. Halal.',
    ru: 'Сироп сахарного спирта, производимый из крахмала. Халяль.',
  },
  'Nişastadan istehsal olunan şəkər spirtidir — şəkərsiz şokoladda geniş istifadə olunur. Halaldır.': {
    tr: 'Nişastadan üretilen şeker alkolüdür — şekersiz çikolatada yaygın olarak kullanılır. Helaldir.',
    en: 'A sugar alcohol produced from starch — widely used in sugar-free chocolate. Halal.',
    ru: 'Сахарный спирт, производимый из крахмала — широко используется в шоколаде без сахара. Халяль.',
  },
  'Laktozadan istehsal olunan şəkər spirtidir. Halaldır.': {
    tr: 'Laktozdan üretilen şeker alkolüdür. Helaldir.',
    en: 'A sugar alcohol produced from lactose. Halal.',
    ru: 'Сахарный спирт, производимый из лактозы. Халяль.',
  },
  'Bitki lifindən (məs. tozağacı, qarğıdalı sapağı) istehsal olunan şəkər spirtidir — diş çürüməsinə qarşı saqqızlarda geniş istifadə olunur. Halaldır.': {
    tr: 'Bitki lifinden (örn. huş ağacı, mısır koçanı) üretilen şeker alkolüdür — diş çürümesine karşı sakızlarda yaygın olarak kullanılır. Helaldir.',
    en: 'A sugar alcohol produced from plant fiber (e.g. birch, corn cob) — widely used in anti-cavity chewing gum. Halal.',
    ru: 'Сахарный спирт, производимый из растительного волокна (напр. берёзы, кукурузных початков) — широко используется в жвачке против кариеса. Халяль.',
  },
  'Meyvələrdə təbii olan, sənayedə şəkərin göbələk fermentasiyası ilə istehsal olunan şəkər spirtidir. Halaldır.': {
    tr: 'Meyvelerde doğal olarak bulunan, endüstride şekerin mantar fermantasyonuyla üretilen şeker alkolüdür. Helaldir.',
    en: 'A sugar alcohol naturally found in fruit, industrially produced by fungal fermentation of sugar. Halal.',
    ru: 'Сахарный спирт, естественно содержащийся во фруктах, в промышленности производится грибковой ферментацией сахара. Халяль.',
  },
  'Aspartam əsaslı, çox güclü tam sintetik şirinləşdiricidir. Halaldır.': {
    tr: 'Aspartam bazlı, çok güçlü tamamen sentetik tatlandırıcıdır. Helaldir.',
    en: 'An aspartame-based, very potent, fully synthetic sweetener. Halal.',
    ru: 'Очень сильный, полностью синтетический подсластитель на основе аспартама. Халяль.',
  },
  'Kvillaya ağacının qabığından çıxarılan köpükləndiricidir — bəzi içkilərdə istifadə olunur. Bitki mənşəlidir, halaldır.': {
    tr: 'Kvilaya ağacının kabuğundan elde edilen köpürtücüdür — bazı içeceklerde kullanılır. Bitkisel kaynaklıdır, helaldir.',
    en: 'A foaming agent extracted from quillaia tree bark — used in some drinks. Plant-derived, halal.',
    ru: 'Пенообразователь, извлекаемый из коры дерева квиллайя — используется в некоторых напитках. Растительного происхождения, халяль.',
  },
};

export function translateECodeCategory(category: string, language: Language): string {
  if (language === 'az') return category;
  return CATEGORY_TRANSLATIONS[category]?.[language] ?? category;
}

export function translateECodeNote(note: string, language: Language): string {
  if (language === 'az') return note;
  return NOTE_TRANSLATIONS[note]?.[language] ?? note;
}

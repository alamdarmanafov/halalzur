# Halalzur

Halallıq sertifikatı skan tətbiqi (iOS, Expo/React Native). Məhsulun barkodunu
skan edərək halallıq statusunu GIMDES, Helal Akreditasyon Kurumu (HAK), SMIIC,
JAKIM və AZSTANDART Halal (Azərbaycan) kimi tanınan sertifikat orqanları ilə
çarpaz yoxlayır.

## Struktur

- `app/(auth)` — Giriş / qeydiyyat ekranları
- `app/(tabs)` — 3 əsas tab: **Skan et**, **Məhsullar**, **Profil**
- `app/subscription.tsx` — Premium abunəlik (paywall)
- `app/product/[id].tsx` — Məhsul detalları / sertifikat nəticəsi
- `lib/certification.ts` — Barkod → sertifikat nəticəsi axtarışı. Supabase
  konfiqurasiya olunubsa `certified_entries` cədvəlini sorğulayır, olmasa
  yerli demo data-ya keçir.
- `lib/certifiers.ts` — Tanınan sertifikat orqanlarının siyahısı
- `lib/supabase.ts` — Supabase client (yalnız açıq "anon" açarla)
- `supabase/schema.sql` — Supabase-də bir dəfə işlədiləcək SQL sxemi
- `components/Logo.tsx` — Brend loqosu (SVG)

## İşə salmaq

```bash
npm install
npm run ios     # iOS simulator (macOS lazımdır)
npm run start    # Expo Go ilə test etmək üçün
```

Demo skan üçün "Skan et" tabında ekranın altındakı nümunə barkod düymələrindən
istifadə edin (kamera olmadan test etmək üçün).

## Supabase-i qoşmaq (real GIMDES/JAKIM data üçün)

1. [supabase.com](https://supabase.com)-da pulsuz hesab açıb yeni layihə yaradın.
2. Layihədə **SQL Editor** → **New query** açıb `supabase/schema.sql`
   faylının tam məzmununu yapışdırıb işə salın (cədvəlləri və oxuma
   siyasətlərini yaradır).
3. **Project Settings → API**-dən `Project URL` və `anon public` açarını
   götürün.
4. Kök qovluqda `.env.example`-i `.env` adı ilə kopyalayın və dəyərləri
   doldurun:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=xxxx
   ```
5. `npx expo start`-u yenidən başladın. Tətbiq artıq mövcud olduqda
   Supabase-dən oxuyacaq, cədvəl boşdursa "Naməlum məhsul" göstərəcək —
   məlumatı doldurmaq (GIMDES PDF-i və JAKIM MyeHalal-ı içəri idxal edən
   ayrıca bir sync skripti) növbəti addımdır.

**Vacib:** `EXPO_PUBLIC_` prefiksli dəyişənlər (yuxarıdakı ikisi) tətbiq
bundle-ına düşür, yəni telefonda oxunmağa görə açıq olmalıdır — ona görə
oraya yalnız `anon`/`publishable` açarı qoyun. `service_role` açarını
(aşağıya bax) `EXPO_PUBLIC_` prefiksi OLMADAN saxlayın ki, tətbiqə düşməsin.

## Sync skripti (GIMDES/JAKIM data-sını doldurmaq)

`certified_entries` cədvəli boş yaranır — `scripts/sync/` bunu doldurur.
Bu, tətbiqin bir hissəsi deyil, sadəcə sizin kompüterinizdə əl ilə
işlədəcəyiniz ayrıca bir skriptdir.

1. `.env`-ə əlavə edin (`EXPO_PUBLIC_` prefiksi OLMADAN):
   ```
   SUPABASE_SERVICE_ROLE_KEY=xxxx
   ```
   Bunu Supabase → **Project Settings → API Keys → service_role**-dan
   götürün. Bu açar RLS-i keçir (bütün cədvələ yazma icazəsi verir), ona
   görə HEÇ VAXT paylaşmayın və ya `EXPO_PUBLIC_` prefiksi ilə işlətməyin.
2. Əvvəlcə yoxlama rejimində işə salın (heç nə yazmır, sadəcə göstərir):
   ```bash
   npm run sync:dry
   ```
3. Nəticə düzgün görünürsə, əsl yazma üçün:
   ```bash
   npm run sync
   ```

**Hazırkı vəziyyət:**
- **GIMDES** (`scripts/sync/gimdes.ts`) — GIMDES-in dərc etdiyi PDF-i oxuyub
  sətir-sətir firma adlarına ayırır. PDF-in URL-i və formatı bu sessiyada
  yoxlanıla bilməyib (şəbəkə siyasəti gimdes.org-a çıxışı bloklayır) —
  `npm run sync:dry` ilə çıxan nəticəni özünüz gözdən keçirin, format fərqli
  çıxarsa `parseGimdesText()` funksiyasını ona uyğun tənzimləyin.
- **JAKIM** (`scripts/sync/jakim.ts`) — hələ yazılmayıb, sadəcə stub-dır.
  MyeHalal portalının data-nı necə verdiyini (JSON API, yoxsa HTML) əvvəlcə
  brauzerdən araşdırmaq lazımdır.
- HAK və SMIIC üçün sync yoxdur — onlar məhsul sertifikatlaşdırmır (sertifikat
  orqanlarını akkreditə edir), ona görə çəkiləcək məhsul data-sı yoxdur.
- **AZSTANDART Halal** (Azərbaycan) — hələ sync skripti yoxdur, açıq/scrape
  oluna bilən sertifikatlı firma siyahısı tapılmayıb. Azərbaycan
  məhsullarını indi **əl ilə** əlavə edin (aşağıya bax).

### Azərbaycan (və ya istənilən) məhsulunu əl ilə əlavə etmək

Kod yazmadan, birbaşa Supabase-də:

1. Supabase Dashboard → **Table Editor** → `certified_entries` cədvəlini açın.
2. **Insert → Insert row** düyməsinə basın, sahələri doldurun:
   - `entry_type`: `product`
   - `barcode`: məhsulun barkodu (adətən qablaşdırmada, 13 rəqəm)
   - `product_name`: məhsulun adı
   - `brand`: marka
   - `category`: məs. "Şirniyyat", "Çörək", "İçki"
   - `status`: `halal` / `mushbooh` / `haram` / `unknown`
   - `certifier_id`: `azstandart` (və ya digər orqan ID-si — `certifiers`
     cədvəlindən)
   - `certificate_number`, `verified_at`, `ingredients`, `notes`: istəyə görə
3. **Save**. Tətbiqdə həmin barkodu skan edən kimi (və ya Məhsullar tabında
   axtaranda) dərhal görünəcək — heç bir kod dəyişikliyi/deploy lazım deyil.

### İstifadəçi təklifləri + xal sistemi (icma töhfəsi)

Bunun əvəzinə (və ya əlavə olaraq) indi tətbiqin özündə əl ilə girmədən
istifadəçilərdən məhsul təklifi toplaya bilərsiniz:

- Naməlum barkod ekranında istifadəçi "Bu məhsulu icmaya təklif edin"
  formunu doldurub göndərir (`product_submissions` cədvəlinə düşür,
  `review_status = 'pending'`).
- Siz (`alamdarmanafov@gmail.com` ilə daxil olanda, `lib/admin.ts`-də
  təyin olunub) Profil → **Admin: Təsdiq gözləyənlər** menyusundan
  siyahını görüb **Təsdiqlə/Rədd et** edirsiniz.
- Təsdiqlədikdə: məhsul avtomatik `certified_entries`-ə (`halalzur`
  sertifikat mənbəyi ilə — "icma yoxlaması", rəsmi orqan deyil) əlavə
  olunur, göndərən istifadəçi **+10 xal** qazanır (Profildə görünür).

**Yeni Supabase cədvəllərini işə salmaq lazımdır** — `supabase/schema.sql`-in
sonuna `product_submissions`, `user_points` cədvəlləri və `halalzur`
sertifikat mənbəyi əlavə olunub. SQL Editor-da bütün faylı yenidən işə
salmayın (köhnə hissələr xəta verər) — yalnız faylın **son hissəsini**
(`insert into certifiers ... 'halalzur' ...`-dan aşağını) kopyalayıb işə
salın.

⚠️ **Təhlükəsizlik qeydi:** admin ekranı yalnız client-tərəfdə e-poçt
yoxlaması ilə qorunur (real backend autentifikasiyası yoxdur), ona görə
nəzəri olaraq bu, tam təhlükəsiz deyil. Real buraxılışdan əvvəl Supabase
Auth (və ya oxşar) ilə əvəz edin ki, RLS server tərəfdə real istifadəçi
identifikasiyasını yoxlaya bilsin (bax: `supabase/schema.sql`-də
`product_submissions` üzərindəki qeyd).

## Firebase-i qoşmaq (push bildirişlər üçün)

Bildiriş göndərmə (delivery) Firebase Cloud Messaging ilə işləyir — Supabase
yalnız hansı cihazın hansı istifadəçiyə aid olduğunu saxlayır
(`device_tokens` cədvəli), göndərmə əməliyyatını özü etmir.

1. [console.firebase.google.com](https://console.firebase.google.com)-da
   yeni layihə yaradın.
2. Layihəyə **iOS app** əlavə edin, bundle ID olaraq `com.halalzur.app`
   yazın.
3. Endirilən **`GoogleService-Info.plist`** faylını layihənin kök
   qovluğuna qoyun (adı dəyişmədən — `app.json` bu adı gözləyir). Bu fayl
   `.gitignore`-dadır, GitHub-a getmir.
4. **Project Settings → Cloud Messaging → Apple app configuration**-da
   APNs Authentication Key (`.p8`) yükləyin — bunu Apple Developer hesabı
   → **Certificates, Identifiers & Profiles → Keys**-dən "Apple Push
   Notifications service (APNs)" icazəsi ilə yaradırsınız (bir dəfəlik,
   bütün tətbiqləriniz üçün ortaq istifadə oluna bilər).
5. `supabase/schema.sql`-ə yenidən baxın — `device_tokens` cədvəli əlavə
   olunub, onu da Supabase SQL Editor-da işə salmaq lazımdır (əvvəlki
   cədvəllərə toxunmur, sadəcə əlavə edir).
6. EAS build alın (Expo Go-da native Firebase modulu yoxdur, işləməyəcək).

**Elan göndərmək** — heç bir backend kodu yazmadan: Firebase Console →
**Cloud Messaging** → **New campaign** → **Notifications** → hədəf olaraq
`halalzur_all` mövzusunu (topic) seçin. Hər cihaz giriş edəndə avtomatik bu
mövzuya abunə olur (`lib/notifications.ts`).

## İstehsala keçməzdən əvvəl

1. **Avtomatlaşdırma** — sync skriptini əl ilə deyil, dövri (məs. gündə bir
   dəfə) işə salmaq üçün GitHub Actions cron və ya Supabase-in planlaşdırılan
   Edge Function-u qurmaq lazımdır.
2. **Autentifikasiya** — `lib/auth-context.tsx` hazırda cihazda lokal
   saxlanılır, şifrə yoxlaması etmir. Real backend (Supabase/Firebase/öz
   API-niz) ilə əvəz edin.
3. **Abunəlik ödənişi** — `app/subscription.tsx` artıq `react-native-iap` ilə
   real StoreKit çağırışı edir (Apple Pay yox — App Store Guideline 3.1.1-ə
   görə yalnız In-App Purchase). İşləməsi üçün:
   - App Store Connect → **Subscriptions**-də eyni ID-lərlə məhsul yaradın:
     `com.halalzur.app.premium.monthly`, `.sixmonth`, `.yearly` — eyni
     subscription group-da, qiymətləri orda təyin edin.
   - **Agreements, Tax, and Banking**-i doldurun — Apple pulu yalnız bundan
     sonra bank hesabınıza köçürür (bu, kodla əlaqəli deyil).
   - Bu, native modul olduğu üçün **Expo Go-da işləmir** — test üçün EAS
     dev-client build (`eas build --profile development`) və ya
     TestFlight/production build lazımdır.
   - Hazırda alışlar server tərəfdə qəbz təsdiqi olmadan bitirilir (backend
     yoxdur) — real buraxılışdan əvvəl bunu Apple-ın App Store Server API-si
     və ya RevenueCat kimi bir xidmətlə əlavə edin ki, saxta qəbzlər Premium-u
     pulsuz aça bilməsin.
4. **App ikon/splash PNG-ləri** — `assets/` içindəki fayllar hələ default
   Expo şablonundandır. `components/Logo.tsx`-dəki SVG-ni əsas götürüb
   Figma/Canva-da 1024×1024 PNG ixrac edin və həmin faylları əvəz edin.

## Sayt (halalzur.com) və admin panel — Vercel-ə yükləmə

Bu repoda iki ayrı statik sayt var, **ikisi də ayrıca Vercel layihəsi olmalıdır**
ki, admin panel əsas domendə (halalzur.com) görünməsin:

| Qovluq | Nə üçündür | Domen |
| --- | --- | --- |
| `website/` | halalzur.com marketing saytı, erkən giriş (waitlist) formu | `halalzur.com` |
| `admin-panel/` | Məhsul təkliflərinə baxıb təsdiq/rədd etmə paneli | Vercel-in verdiyi default `*.vercel.app` linki (öz domen bağlamayın) |

Hər ikisi sırf statik HTML-dir (build addımı yoxdur), ona görə Vercel-də:

1. **Sayt üçün**: vercel.com → **Add New Project** → bu repo-nu seçin →
   **Root Directory**-ni `website` olaraq təyin edin → Framework Preset:
   **Other** (build command boş qala bilər) → Deploy.
   Deploy olduqdan sonra **Settings → Domains**-dən `halalzur.com`-u əlavə
   edin (domeni aldıqdan sonra).
2. **Admin panel üçün**: eyni repo ilə **ikinci, ayrı** bir layihə yaradın →
   **Root Directory**-ni `admin-panel` olaraq təyin edin → Deploy edin.
   Bu layihəyə **heç bir custom domen bağlamayın** — Vercel-in verdiyi
   default `halalzur-admin-xxxx.vercel.app` linkindən istifadə edin və bu
   linki yalnız özünüzlə paylaşın.

**Admin panelin girişini dəyişin**: `admin-panel/index.html` faylında
`ADMIN_EMAIL` (defolt: `alamdarmanafov@gmail.com`, `lib/admin.ts`-dəki ilə
eynidir) və `ADMIN_PASSPHRASE` sabitlərini tapıb öz e-poçt/şifrənizlə əvəz
edin, sonra push edin. Bu, real backend autentifikasiyası deyil (fayl
mənbəyində görünür) — sadəcə panelin təsadüfi tapılmasının qarşısını alır.
`product_submissions`,
`certified_entries` və `user_points` cədvəllərinin RLS siyasətləri hazırda
`anon` açarı ilə oxuma/yazmaya icazə verir (bax `supabase/schema.sql`-dəki
SECURITY CAVEAT qeydi) — ictimai buraxılışdan əvvəl bunu real Supabase Auth
əsaslı admin roluna keçirmək lazımdır.

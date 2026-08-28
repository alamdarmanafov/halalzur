# Halalzur

Halallıq sertifikatı skan tətbiqi (iOS, Expo/React Native). Məhsulun barkodunu
skan edərək halallıq statusunu GIMDES, Helal Akreditasyon Kurumu (HAK), SMIIC
və JAKIM kimi tanınan sertifikat orqanları ilə çarpaz yoxlayır.

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

## İstehsala keçməzdən əvvəl

1. **Avtomatlaşdırma** — sync skriptini əl ilə deyil, dövri (məs. gündə bir
   dəfə) işə salmaq üçün GitHub Actions cron və ya Supabase-in planlaşdırılan
   Edge Function-u qurmaq lazımdır.
2. **Autentifikasiya** — `lib/auth-context.tsx` hazırda cihazda lokal
   saxlanılır, şifrə yoxlaması etmir. Real backend (Supabase/Firebase/öz
   API-niz) ilə əvəz edin.
3. **Abunəlik ödənişi** — iOS-da rəqəmsal abunəlik yalnız **App Store
   In-App Purchase (StoreKit)** vasitəsilə ola bilər (Apple Pay yox — Apple
   Review Guideline 3.1.1). `app/subscription.tsx` daxilində `purchasePremium`
   funksiyasını RevenueCat (`react-native-purchases`) və ya
   `expo-in-app-purchases` ilə əvəz edin, App Store Connect-də məhsul ID-ləri
   yaradın (`com.halalzur.app.premium.monthly/yearly`).
4. **App ikon/splash PNG-ləri** — `assets/` içindəki fayllar hələ default
   Expo şablonundandır. `components/Logo.tsx`-dəki SVG-ni əsas götürüb
   Figma/Canva-da 1024×1024 PNG ixrac edin və həmin faylları əvəz edin.

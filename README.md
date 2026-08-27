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

**Vacib:** `.env`-ə yalnız `anon` açarı qoyun, heç vaxt `service_role`
açarını deyil — `anon` açar client-da açıq işlədilməyə görə təhlükəsizdir
(oxuma hüquqları `schema.sql`-dəki RLS siyasətləri ilə məhdudlaşdırılıb).

## İstehsala keçməzdən əvvəl

1. **GIMDES/JAKIM sync skripti** — `certified_entries` cədvəli hazırda
   boşdur. GIMDES-in dərc etdiyi PDF siyahısını və JAKIM-ın MyeHalal
   portalını dövri olaraq oxuyub bu cədvələ yazan ayrıca bir skript (backend
   tərəfdə, `service_role` açarı ilə) lazımdır. HAK və SMIIC məhsul
   sertifikatlaşdırmır (onlar sertifikat orqanlarını akkreditə edir), ona
   görə onlardan çəkiləcək məhsul data-sı yoxdur.
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

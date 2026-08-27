# Halalzur

Halallıq sertifikatı skan tətbiqi (iOS, Expo/React Native). Məhsulun barkodunu
skan edərək halallıq statusunu GIMDES, Helal Akreditasyon Kurumu (HAK), SMIIC
və JAKIM kimi tanınan sertifikat orqanları ilə çarpaz yoxlayır.

## Struktur

- `app/(auth)` — Giriş / qeydiyyat ekranları
- `app/(tabs)` — 3 əsas tab: **Skan et**, **Məhsullar**, **Profil**
- `app/subscription.tsx` — Premium abunəlik (paywall)
- `app/product/[id].tsx` — Məhsul detalları / sertifikat nəticəsi
- `lib/certification.ts` — Barkod → sertifikat nəticəsi axtarışı (hazırda demo
  data ilə işləyir, real inteqrasiya üçün qeydlərə bax)
- `lib/certifiers.ts` — Tanınan sertifikat orqanlarının siyahısı
- `components/Logo.tsx` — Brend loqosu (SVG)

## İşə salmaq

```bash
npm install
npm run ios     # iOS simulator (macOS lazımdır)
npm run start    # Expo Go ilə test etmək üçün
```

Demo skan üçün "Skan et" tabında ekranın altındakı nümunə barkod düymələrindən
istifadə edin (kamera olmadan test etmək üçün).

## İstehsala keçməzdən əvvəl

1. **Sertifikat məlumat mənbəyi** — `lib/certification.ts` hazırda statik
   demo data qaytarır. Real sertifikat orqanları (GIMDES, HAK, SMIIC üzv
   qurumları, JAKIM) hələ ki ictimai real-time API açıqlamayıb; ya onlarla
   məlumat paylaşım sazişi bağlamaq, ya da onların dərc etdiyi
   sertifikat siyahılarından (adətən PDF/reyestr) idxal edərək öz
   verilənlər bazanızı qurmaq lazımdır.
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

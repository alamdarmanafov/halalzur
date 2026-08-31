export type Language = 'az' | 'en';

type Dict = Record<string, string>;

// Phase 1: shared navigation chrome + Profile + Products screens. Product
// data itself (names, descriptions, category names from Supabase) stays
// Azerbaijani-only for now — translating that is a separate, larger effort
// (either bilingual columns in the database or a translation pipeline).
export const translations: Record<Language, Dict> = {
  az: {
    tabProducts: 'Məhsullar',
    tabFavorites: 'Favoritlər',
    tabPlaces: 'Məkanlar',
    tabProfile: 'Profil',

    profileTitle: 'Profil',
    profileHistoryItem: 'Skan tarixçəsi',
    profileFavoritesItem: 'Favoritlər',
    profileNotifications: 'Bildirişlər',
    profileNotificationsOnTitle: 'Bildirişlər aktivdir',
    profileNotificationsOnBody: 'Halalzur elanlarını alacaqsınız.',
    profileNotificationsOffTitle: 'Bildirişlər deaktivdir',
    profileNotificationsOffBody:
      'İcazə verilməyib, ya da bu build-də (Expo Go) native bildiriş modulu yoxdur. Ayarlar → Bildirişlər-dən aça bilərsiniz.',
    profileEcodes: 'E-kod bələdçisi',
    profileAchievements: 'Nailiyyətlər',
    profileLanguage: 'Dil',
    profileLanguageTitle: 'Dil seçimi',
    profileLanguageAz: 'Azərbaycanca',
    profileLanguageEn: 'İngiliscə',
    profileCertifiers: 'Sertifikat orqanları haqqında',
    profileCertifiersTitle: 'Sertifikat orqanları',
    profileCertifiersBody:
      'Halalzur GIMDES, Helal Akreditasyon Kurumu (HAK), SMIIC, JAKIM və AZSTANDART Halal (Azərbaycan) qeydiyyatları ilə çarpaz yoxlama aparır.',
    profileInvite: 'Dostunu dəvət et',
    profileFeedback: 'Xəta bildir / Rəy',
    profileAdminPending: 'Admin: Təsdiq gözləyənlər',
    profileClearHistory: 'Tarixçəni təmizlə',
    profileSignOut: 'Çıxış et',
    profileFreePlan: 'Pulsuz plan',
    profileFreePlanDesc: 'Gündə 3 skan · Premium-a keçin, limitsiz olsun',
    profilePremiumExpiryLine: 'Nailiyyət mükafatı — {date} tarixinə qədər',

    productsTitle: 'Məhsullar',
    productsSearchPlaceholder: 'Məhsul, marka və ya kateqoriya axtar',
    productsCategoryAll: 'Hamısı',
    productsDeleteTitle: 'Tarixçədən sil',
    productsDeleteBody: 'səhv skan edilibsə, tarixçədən silə bilərsiniz.',
    productsDeleteCancel: 'Ləğv et',
    productsDeleteConfirm: 'Sil',
    productsRecentLabel: 'Son skan etdikləriniz',
    productsPopularLabel: 'Populyar məhsullar',
    productsEmptyResult: 'Nəticə tapılmadı',
  },
  en: {
    tabProducts: 'Products',
    tabFavorites: 'Favorites',
    tabPlaces: 'Places',
    tabProfile: 'Profile',

    profileTitle: 'Profile',
    profileHistoryItem: 'Scan history',
    profileFavoritesItem: 'Favorites',
    profileNotifications: 'Notifications',
    profileNotificationsOnTitle: 'Notifications are on',
    profileNotificationsOnBody: "You'll receive Halalzur announcements.",
    profileNotificationsOffTitle: 'Notifications are off',
    profileNotificationsOffBody:
      "Permission wasn't granted, or this build (Expo Go) has no native notification module. You can enable it from Settings → Notifications.",
    profileEcodes: 'E-code guide',
    profileAchievements: 'Achievements',
    profileLanguage: 'Language',
    profileLanguageTitle: 'Choose language',
    profileLanguageAz: 'Azerbaijani',
    profileLanguageEn: 'English',
    profileCertifiers: 'About certification bodies',
    profileCertifiersTitle: 'Certification bodies',
    profileCertifiersBody:
      'Halalzur cross-checks against GIMDES, the Halal Accreditation Agency (HAK), SMIIC, JAKIM, and AZSTANDART Halal (Azerbaijan) registries.',
    profileInvite: 'Invite a friend',
    profileFeedback: 'Report a bug / Feedback',
    profileAdminPending: 'Admin: Pending approvals',
    profileClearHistory: 'Clear history',
    profileSignOut: 'Sign out',
    profileFreePlan: 'Free plan',
    profileFreePlanDesc: '3 scans a day · Go Premium for unlimited',
    profilePremiumExpiryLine: 'Achievement reward — until {date}',

    productsTitle: 'Products',
    productsSearchPlaceholder: 'Search product, brand, or category',
    productsCategoryAll: 'All',
    productsDeleteTitle: 'Remove from history',
    productsDeleteBody: 'If this was scanned by mistake, you can remove it from your history.',
    productsDeleteCancel: 'Cancel',
    productsDeleteConfirm: 'Remove',
    productsRecentLabel: 'Your recent scans',
    productsPopularLabel: 'Popular products',
    productsEmptyResult: 'No results found',
  },
};

export type TranslationKey = keyof typeof translations.az;

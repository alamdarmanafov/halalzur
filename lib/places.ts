import { HalalStatus } from './types';

export type PlaceCategory = 'restoran' | 'kafe' | 'coffee_shop';

export type Place = {
  id: string;
  name: string;
  category: PlaceCategory;
  status: HalalStatus;
  address: string;
  latitude: number;
  longitude: number;
  certifierName: string | null;
  note: string | null;
};

export const PLACE_CATEGORY_LABEL: Record<PlaceCategory, string> = {
  restoran: 'Restoran',
  kafe: 'Kafe',
  coffee_shop: 'Coffee Shop',
};

export const PLACE_CATEGORY_ICON: Record<PlaceCategory, string> = {
  restoran: 'restaurant',
  kafe: 'cafe',
  coffee_shop: 'cafe-outline',
};

/**
 * Local demo dataset — same role as MOCK_DB in lib/certification.ts: a
 * dev/offline fallback until a real `places` table (or a places sync,
 * mirroring scripts/sync for products) backs this from Supabase.
 */
const MOCK_PLACES: Place[] = [
  {
    id: 'p1',
    name: 'Şirvanşah Restoranı',
    category: 'restoran',
    status: 'halal',
    address: 'Nizami küç. 14, Bakı',
    latitude: 40.3728,
    longitude: 49.8442,
    certifierName: 'GIMDES',
    note: 'Bütün ət məhsulları sertifikatlı təchizatçıdan gətirilir.',
  },
  {
    id: 'p2',
    name: 'Anadolu Ocakbaşı',
    category: 'restoran',
    status: 'halal',
    address: 'Fətəli xan Xoyski pr. 41, Bakı',
    latitude: 40.3947,
    longitude: 49.8669,
    certifierName: 'HAK',
    note: null,
  },
  {
    id: 'p3',
    name: 'Zəfəran Kafe',
    category: 'kafe',
    status: 'mushbooh',
    address: 'İçərişəhər, 28 May küç. 3, Bakı',
    latitude: 40.3661,
    longitude: 49.8353,
    certifierName: null,
    note: 'Menyuda alkoqollu içki servisi var — yalnız qida hissəsi üçün ehtiyatlı seçim edin.',
  },
  {
    id: 'p4',
    name: 'Bulvar Coffee',
    category: 'coffee_shop',
    status: 'halal',
    address: 'Neftçilər pr. 2, Bakı',
    latitude: 40.3625,
    longitude: 49.8508,
    certifierName: null,
    note: 'Yalnız qəhvə və şirniyyat — heyvan mənşəli tərkib yoxdur.',
  },
  {
    id: 'p5',
    name: 'Qız Qalası Çayxanası',
    category: 'kafe',
    status: 'halal',
    address: 'Qoşa Qala Qapısı yaxınlığı, Bakı',
    latitude: 40.3667,
    longitude: 49.8347,
    certifierName: 'AZSTANDART Halal',
    note: null,
  },
  {
    id: 'p6',
    name: 'Port Baku Coffee Roasters',
    category: 'coffee_shop',
    status: 'unknown',
    address: 'Neftçilər pr. 153, Bakı',
    latitude: 40.3729,
    longitude: 49.8541,
    certifierName: null,
    note: 'Hələ heç bir sertifikat orqanı tərəfindən yoxlanılmayıb.',
  },
];

export function getAllPlaces(): Place[] {
  return MOCK_PLACES;
}

export function getPlacesByCategory(category: PlaceCategory | 'hamısı'): Place[] {
  const all = getAllPlaces();
  return category === 'hamısı' ? all : all.filter((p) => p.category === category);
}

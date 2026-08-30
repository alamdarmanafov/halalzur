import { HalalStatus } from './types';
import { supabase, isSupabaseConfigured } from './supabase';

export type PlaceCategory = 'restoran' | 'kafe' | 'coffee_shop';

export type Place = {
  id: string;
  name: string;
  category: PlaceCategory;
  status: HalalStatus;
  address: string;
  latitude: number | null;
  longitude: number | null;
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
 * dev/offline fallback while Supabase's `places` table (supabase/schema.sql)
 * isn't configured yet, or if a request to it fails. The admin panel writes
 * the real rows by hand — there's no automated sync for places.
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

type PlaceRow = {
  id: string;
  name: string;
  category: PlaceCategory;
  status: HalalStatus;
  address: string;
  latitude: number | null;
  longitude: number | null;
  certifier_name: string | null;
  note: string | null;
};

function mapRowToPlace(row: PlaceRow): Place {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    status: row.status,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    certifierName: row.certifier_name,
    note: row.note,
  };
}

export async function getAllPlaces(): Promise<Place[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('places')
      .select('id, name, category, status, address, latitude, longitude, certifier_name, note')
      .eq('approved', true)
      .order('created_at', { ascending: false });

    if (!error) return (data ?? []).map(mapRowToPlace);
    console.warn('Supabase getAllPlaces failed, falling back to local data:', error.message);
  }

  return MOCK_PLACES;
}

export async function getPlacesByCategory(category: PlaceCategory | 'hamısı'): Promise<Place[]> {
  const all = await getAllPlaces();
  return category === 'hamısı' ? all : all.filter((p) => p.category === category);
}

/**
 * In-app submission by a regular user — always lands with approved =
 * false, so it stays invisible in getAllPlaces()/getPlacesByCategory()
 * until an admin reviews and approves it from the admin panel.
 */
export async function submitPlace(input: {
  userId: string;
  userName: string;
  name: string;
  category: PlaceCategory;
  address: string;
  note: string;
}): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase qoşulmayıb — məkan təklifi göndərilə bilmir.');
  }
  const { error } = await supabase.from('places').insert({
    name: input.name,
    category: input.category,
    address: input.address,
    status: 'unknown',
    note: input.note || null,
    approved: false,
    submitted_by: input.userId,
    submitted_by_name: input.userName,
  });
  if (error) throw error;
}

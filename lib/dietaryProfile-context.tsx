import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, PropsWithChildren } from 'react';
import { DietaryTag, AllergenTag } from './dietaryKeywords';

const STORAGE_KEY = 'halalzur.dietaryProfile';

type StoredProfile = {
  dietaryTags: DietaryTag[];
  allergenTags: AllergenTag[];
  blockedBrands: string[];
};

const EMPTY: StoredProfile = { dietaryTags: [], allergenTags: [], blockedBrands: [] };

type DietaryProfileContextValue = StoredProfile & {
  toggleDietaryTag: (tag: DietaryTag) => void;
  toggleAllergenTag: (tag: AllergenTag) => void;
  addBlockedBrand: (brand: string) => void;
  removeBlockedBrand: (brand: string) => void;
  isBrandBlocked: (brand: string) => boolean;
};

const DietaryProfileContext = createContext<DietaryProfileContextValue | null>(null);

/**
 * Purely local (AsyncStorage) — like liteMode, this is a per-device
 * personalization setting rather than account data, so it doesn't need a
 * Supabase table or sync logic to be useful.
 */
export function DietaryProfileProvider({ children }: PropsWithChildren) {
  const [profile, setProfile] = useState<StoredProfile>(EMPTY);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (!saved) return;
      try {
        setProfile({ ...EMPTY, ...JSON.parse(saved) });
      } catch {
        // corrupted storage — keep defaults
      }
    });
  }, []);

  const persist = (next: StoredProfile) => {
    setProfile(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const value = useMemo<DietaryProfileContextValue>(
    () => ({
      ...profile,
      toggleDietaryTag: (tag) =>
        persist({
          ...profile,
          dietaryTags: profile.dietaryTags.includes(tag)
            ? profile.dietaryTags.filter((t) => t !== tag)
            : [...profile.dietaryTags, tag],
        }),
      toggleAllergenTag: (tag) =>
        persist({
          ...profile,
          allergenTags: profile.allergenTags.includes(tag)
            ? profile.allergenTags.filter((t) => t !== tag)
            : [...profile.allergenTags, tag],
        }),
      addBlockedBrand: (brand) => {
        const trimmed = brand.trim();
        if (!trimmed || profile.blockedBrands.some((b) => b.toLowerCase() === trimmed.toLowerCase())) return;
        persist({ ...profile, blockedBrands: [...profile.blockedBrands, trimmed] });
      },
      removeBlockedBrand: (brand) =>
        persist({ ...profile, blockedBrands: profile.blockedBrands.filter((b) => b !== brand) }),
      isBrandBlocked: (brand) => profile.blockedBrands.some((b) => b.toLowerCase() === brand.toLowerCase()),
    }),
    [profile]
  );

  return <DietaryProfileContext.Provider value={value}>{children}</DietaryProfileContext.Provider>;
}

export function useDietaryProfile() {
  const ctx = useContext(DietaryProfileContext);
  if (!ctx) throw new Error('useDietaryProfile must be used within DietaryProfileProvider');
  return ctx;
}

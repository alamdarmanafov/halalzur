import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, PropsWithChildren } from 'react';
import { CertificationResult } from './types';

const STORAGE_KEY = 'halalzur.favorites';

type FavoritesContextValue = {
  favorites: CertificationResult[];
  isLoading: boolean;
  isFavorite: (barcode: string) => boolean;
  toggleFavorite: (result: CertificationResult) => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: PropsWithChildren) {
  const [favorites, setFavorites] = useState<CertificationResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setFavorites(JSON.parse(raw));
      })
      .finally(() => setIsLoading(false));
  }, []);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      isLoading,
      isFavorite: (barcode) => favorites.some((f) => f.barcode === barcode),
      toggleFavorite: async (result) => {
        const exists = favorites.some((f) => f.barcode === result.barcode);
        const next = exists
          ? favorites.filter((f) => f.barcode !== result.barcode)
          : [result, ...favorites];
        setFavorites(next);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      },
    }),
    [favorites, isLoading]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}

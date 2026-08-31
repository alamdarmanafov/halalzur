import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, PropsWithChildren } from 'react';
import { CertificationResult } from './types';
import { fetchRemoteFavorites, syncFavoriteAdd, syncFavoriteRemove } from './favorites';
import { useAuth } from './auth-context';

const STORAGE_KEY = 'halalzur.favorites';

type FavoritesContextValue = {
  favorites: CertificationResult[];
  isLoading: boolean;
  isFavorite: (barcode: string) => boolean;
  toggleFavorite: (result: CertificationResult) => Promise<void>;
  refresh: () => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<CertificationResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Signed-in accounts (Apple/Google) are the source of truth once
  // reachable, so Favoritlər survives a reinstall/device change — local
  // storage stays the cache used while offline or signed out.
  const load = async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const local: CertificationResult[] = raw ? JSON.parse(raw) : [];
    const remote = user ? await fetchRemoteFavorites(user.id) : null;
    const next = remote ?? local;
    setFavorites(next);
    if (remote) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  useEffect(() => {
    load().finally(() => setIsLoading(false));
  }, [user?.id]);

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
        if (user) {
          if (exists) syncFavoriteRemove(user.id, result.barcode);
          else syncFavoriteAdd(user.id, result);
        }
      },
      refresh: load,
    }),
    [favorites, isLoading, user]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, PropsWithChildren } from 'react';
import { CertificationResult } from './types';

const STORAGE_KEY = 'halalzur.shoppingList';

export type ShoppingListItem = {
  barcode: string;
  productName: string;
  brand: string;
  imageEmoji: string;
  bought: boolean;
  addedAt: string;
};

type ShoppingListContextValue = {
  items: ShoppingListItem[];
  isOnList: (barcode: string) => boolean;
  addItem: (result: CertificationResult) => void;
  removeItem: (barcode: string) => void;
  toggleBought: (barcode: string) => void;
  clearBought: () => void;
};

const ShoppingListContext = createContext<ShoppingListContextValue | null>(null);

/**
 * Purely local (AsyncStorage) — a personal "must buy" checklist built from
 * scanned/viewed products, same scope as favorites (this app has no
 * per-item collaboration feature, so there's no reason for this to be
 * cloud-synced the way scan history/favorites are).
 */
export function ShoppingListProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<ShoppingListItem[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setItems(JSON.parse(raw));
    });
  }, []);

  const persist = (next: ShoppingListItem[]) => {
    setItems(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const value = useMemo<ShoppingListContextValue>(
    () => ({
      items,
      isOnList: (barcode) => items.some((i) => i.barcode === barcode),
      addItem: (result) => {
        if (items.some((i) => i.barcode === result.barcode)) return;
        persist([
          {
            barcode: result.barcode,
            productName: result.productName,
            brand: result.brand,
            imageEmoji: result.imageEmoji,
            bought: false,
            addedAt: new Date().toISOString(),
          },
          ...items,
        ]);
      },
      removeItem: (barcode) => persist(items.filter((i) => i.barcode !== barcode)),
      toggleBought: (barcode) =>
        persist(items.map((i) => (i.barcode === barcode ? { ...i, bought: !i.bought } : i))),
      clearBought: () => persist(items.filter((i) => !i.bought)),
    }),
    [items]
  );

  return <ShoppingListContext.Provider value={value}>{children}</ShoppingListContext.Provider>;
}

export function useShoppingList() {
  const ctx = useContext(ShoppingListContext);
  if (!ctx) throw new Error('useShoppingList must be used within ShoppingListProvider');
  return ctx;
}

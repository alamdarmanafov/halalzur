import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, PropsWithChildren } from 'react';
import { CertificationResult } from './types';
import { maybeRequestReviewAfterScans } from './reviewPrompt';

const STORAGE_KEY = 'halalzur.history';
// Same cap for everyone — the Premium spec is explicit that history is
// not a plan differentiator, only a local device cap to keep AsyncStorage
// bounded.
const HISTORY_LIMIT = 200;

type HistoryContextValue = {
  history: CertificationResult[];
  isLoading: boolean;
  addScan: (result: CertificationResult) => Promise<void>;
  removeScan: (barcode: string) => Promise<void>;
  clear: () => Promise<void>;
};

const HistoryContext = createContext<HistoryContextValue | null>(null);

export function HistoryProvider({ children }: PropsWithChildren) {
  const [history, setHistory] = useState<CertificationResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setHistory(JSON.parse(raw));
      })
      .finally(() => setIsLoading(false));
  }, []);

  const value = useMemo<HistoryContextValue>(
    () => ({
      history,
      isLoading,
      addScan: async (result) => {
        const next = [result, ...history.filter((h) => h.barcode !== result.barcode)].slice(
          0,
          HISTORY_LIMIT
        );
        setHistory(next);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        maybeRequestReviewAfterScans(next.length);
      },
      removeScan: async (barcode) => {
        const next = history.filter((h) => h.barcode !== barcode);
        setHistory(next);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      },
      clear: async () => {
        setHistory([]);
        await AsyncStorage.removeItem(STORAGE_KEY);
      },
    }),
    [history, isLoading]
  );

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useHistory() {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error('useHistory must be used within HistoryProvider');
  return ctx;
}

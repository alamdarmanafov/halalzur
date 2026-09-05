import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, PropsWithChildren } from 'react';
import { CertificationResult } from './types';
import { maybeRequestReviewAfterScans } from './reviewPrompt';
import { fetchRemoteHistory, syncHistoryAdd, syncHistoryRemove, syncHistoryClear } from './historyBackup';
import { useAuth } from './auth-context';

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
  refresh: () => Promise<void>;
};

const HistoryContext = createContext<HistoryContextValue | null>(null);

export function HistoryProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [history, setHistory] = useState<CertificationResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Signed-in accounts (Apple/Google) are the source of truth once
  // reachable, so scan history survives a reinstall/device change — same
  // pattern as favorites-context.tsx — local storage stays the cache used
  // while offline or signed out.
  const load = async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const local: CertificationResult[] = raw ? JSON.parse(raw) : [];
    const remote = user ? await fetchRemoteHistory(user.id) : null;
    const next = remote ?? local;
    setHistory(next);
    if (remote) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  useEffect(() => {
    load().finally(() => setIsLoading(false));
  }, [user?.id]);

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
        if (user) syncHistoryAdd(user.id, result);
      },
      removeScan: async (barcode) => {
        const next = history.filter((h) => h.barcode !== barcode);
        setHistory(next);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        if (user) syncHistoryRemove(user.id, barcode);
      },
      clear: async () => {
        setHistory([]);
        await AsyncStorage.removeItem(STORAGE_KEY);
        if (user) syncHistoryClear(user.id);
      },
      refresh: load,
    }),
    [history, isLoading, user]
  );

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useHistory() {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error('useHistory must be used within HistoryProvider');
  return ctx;
}

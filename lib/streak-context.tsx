import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, PropsWithChildren } from 'react';

const STORAGE_KEY = 'halalzur.streak';

type StoredStreak = { streak: number; lastScanDate: string | null };

type StreakContextValue = {
  streak: number;
  recordScan: () => void;
};

const StreakContext = createContext<StreakContextValue | null>(null);

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Purely local (AsyncStorage), like liteMode/dietaryProfile — a per-device
 * "streak" counter of consecutive calendar days with at least one scan.
 * history-context's entries have no per-scan date field (it's a deduped
 * "my recent scans" list, not an append log), so this tracks its own
 * lastScanDate/streak pair instead of deriving it from history.
 */
export function StreakProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<StoredStreak>({ streak: 0, lastScanDate: null });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        setState(JSON.parse(raw));
      } catch {
        // corrupted storage — keep defaults
      }
    });
  }, []);

  const value = useMemo<StreakContextValue>(
    () => ({
      streak: state.streak,
      recordScan: () => {
        const today = todayStr();
        if (state.lastScanDate === today) return; // already counted today
        const next: StoredStreak =
          state.lastScanDate === yesterdayStr()
            ? { streak: state.streak + 1, lastScanDate: today }
            : { streak: 1, lastScanDate: today };
        setState(next);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      },
    }),
    [state]
  );

  return <StreakContext.Provider value={value}>{children}</StreakContext.Provider>;
}

export function useStreak() {
  const ctx = useContext(StreakContext);
  if (!ctx) throw new Error('useStreak must be used within StreakProvider');
  return ctx;
}

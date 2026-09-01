import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, PropsWithChildren } from 'react';

const STORAGE_KEY = 'halalzur.liteMode';

type LiteModeContextValue = {
  liteMode: boolean;
  setLiteMode: (on: boolean) => void;
};

const LiteModeContext = createContext<LiteModeContextValue | null>(null);

/**
 * A manual "data saver" toggle rather than automatic bandwidth detection —
 * expo-network's getNetworkStateAsync() (lib/network.ts) only reports
 * connection type (wifi/cellular/none), not actual speed, so guessing
 * "slow" from that would be unreliable. Skips product photo downloads
 * (falls back to the emoji already used when no photo exists) wherever
 * it's checked.
 */
export function LiteModeProvider({ children }: PropsWithChildren) {
  const [liteMode, setLiteModeState] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === '1') setLiteModeState(true);
    });
  }, []);

  const value = useMemo<LiteModeContextValue>(
    () => ({
      liteMode,
      setLiteMode: (on) => {
        setLiteModeState(on);
        AsyncStorage.setItem(STORAGE_KEY, on ? '1' : '0');
      },
    }),
    [liteMode]
  );

  return <LiteModeContext.Provider value={value}>{children}</LiteModeContext.Provider>;
}

export function useLiteMode() {
  const ctx = useContext(LiteModeContext);
  if (!ctx) throw new Error('useLiteMode must be used within LiteModeProvider');
  return ctx;
}

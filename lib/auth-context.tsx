import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, PropsWithChildren } from 'react';
import { User } from './types';

const STORAGE_KEY = 'halalzur.user';

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, _password: string) => Promise<void>;
  signUp: (name: string, email: string, _password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setPlan: (plan: User['plan']) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setUser(JSON.parse(raw));
      })
      .finally(() => setIsLoading(false));
  }, []);

  const persist = async (next: User | null) => {
    setUser(next);
    if (next) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      // NOTE: demo-only local auth. Swap for a real backend (Supabase/Firebase/
      // custom API) before shipping — this does not verify passwords.
      signIn: async (email) => {
        await persist({
          id: 'local-user',
          name: email.split('@')[0] || 'İstifadəçi',
          email,
          plan: 'free',
          scansThisMonth: 0,
        });
      },
      signUp: async (name, email) => {
        await persist({
          id: 'local-user',
          name,
          email,
          plan: 'free',
          scansThisMonth: 0,
        });
      },
      signOut: async () => {
        await persist(null);
      },
      setPlan: async (plan) => {
        if (!user) return;
        await persist({ ...user, plan });
      },
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

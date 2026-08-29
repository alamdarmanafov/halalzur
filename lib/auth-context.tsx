import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import { createContext, useContext, useEffect, useMemo, useState, PropsWithChildren } from 'react';
import { User } from './types';

const STORAGE_KEY = 'halalzur.user';

export class GoogleSignInUnavailableError extends Error {}

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, _password: string) => Promise<void>;
  signUp: (name: string, email: string, _password: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setPlan: (plan: User['plan']) => Promise<void>;
  incrementScanCount: () => Promise<void>;
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
          scansToday: 0,
          lastScanDate: null,
        });
      },
      signUp: async (name, email) => {
        await persist({
          id: 'local-user',
          name,
          email,
          plan: 'free',
          scansToday: 0,
          lastScanDate: null,
        });
      },
      signInWithApple: async () => {
        try {
          const credential = await AppleAuthentication.signInAsync({
            requestedScopes: [
              AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
              AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
          });
          // Apple only returns name/email on the FIRST authorization for this
          // app — later sign-ins only give the stable `user` id, so fall back
          // to something usable rather than blanking out the profile.
          const name =
            [credential.fullName?.givenName, credential.fullName?.familyName]
              .filter(Boolean)
              .join(' ') || 'Apple istifadəçisi';
          await persist({
            id: `apple-${credential.user}`,
            name,
            email: credential.email ?? `${credential.user}@privaterelay.appleid.com`,
            plan: 'free',
            scansToday: 0,
            lastScanDate: null,
          });
        } catch (err: any) {
          if (err?.code === 'ERR_REQUEST_CANCELED') return;
          throw err;
        }
      },
      // NOTE: placeholder — real Google Sign-In needs an OAuth client set up
      // in Google Cloud Console (@react-native-google-signin/google-signin),
      // which requires credentials only the project owner can create.
      signInWithGoogle: async () => {
        throw new GoogleSignInUnavailableError('Google ilə giriş hələ qoşulmayıb.');
      },
      signOut: async () => {
        await persist(null);
      },
      setPlan: async (plan) => {
        if (!user) return;
        await persist({ ...user, plan });
      },
      // Free-tier scan quota resets daily rather than persisting a running
      // total, so a user's local date (not a server clock) is the reset key.
      incrementScanCount: async () => {
        if (!user) return;
        const today = new Date().toISOString().slice(0, 10);
        const scansToday = user.lastScanDate === today ? user.scansToday + 1 : 1;
        await persist({ ...user, scansToday, lastScanDate: today });
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

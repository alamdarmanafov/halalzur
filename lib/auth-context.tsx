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
            scansThisMonth: 0,
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

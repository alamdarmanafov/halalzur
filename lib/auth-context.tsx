import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import { createContext, useContext, useEffect, useMemo, useState, PropsWithChildren } from 'react';
import { User } from './types';
import { syncUser, fetchRemotePlan } from './userSync';
import { AchievementTier } from './achievements';

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
  refreshPlan: () => Promise<void>;
  grantAchievementPremium: (tier: AchievementTier) => Promise<void>;
  // In-memory only (not persisted) — true for one app session right after
  // signUp/first-time signInWithApple, so (tabs)/_layout.tsx's
  // WelcomeModal knows to greet the new account exactly once.
  justRegistered: boolean;
  clearJustRegistered: () => void;
};

/** A timed achievement reward that has passed its expiry reverts to free. */
function withExpiredAchievementCleared(u: User): User {
  if (u.plan !== 'premium' || !u.premiumExpiresAt) return u;
  if (new Date(u.premiumExpiresAt).getTime() > Date.now()) return u;
  return { ...u, plan: 'free', premiumExpiresAt: null };
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [justRegistered, setJustRegistered] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(async (raw) => {
        if (!raw) return;
        const stored = withExpiredAchievementCleared(JSON.parse(raw) as User);
        setUser(stored);
        // An admin-panel plan change only ever lands in Supabase's `users`
        // row — this is the one moment that change reaches the device.
        const remotePlan = await fetchRemotePlan(stored.id);
        const next =
          remotePlan && remotePlan !== stored.plan ? { ...stored, plan: remotePlan } : stored;
        setUser(next);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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
          premiumExpiresAt: null,
          claimedAchievements: [],
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
          premiumExpiresAt: null,
          claimedAchievements: [],
        });
        setJustRegistered(true);
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
          const id = `apple-${credential.user}`;
          // Apple sign-in re-creates this user object on every login (signOut
          // wipes local storage), so without reading the plan back first this
          // would always default to 'free' and immediately overwrite any
          // admin-granted premium in Supabase via syncUser() below.
          const remotePlan = await fetchRemotePlan(id);
          const appleUser: User = {
            id,
            name,
            email: credential.email ?? `${credential.user}@privaterelay.appleid.com`,
            plan: remotePlan ?? 'free',
            scansToday: 0,
            lastScanDate: null,
            premiumExpiresAt: null,
            claimedAchievements: [],
          };
          await persist(appleUser);
          syncUser(appleUser);
          // Apple only hands back an email on the account's first
          // authorization — the one reliable "this is a new sign-up" signal
          // we have, since there's no real backend to check against.
          if (credential.email) setJustRegistered(true);
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
        const next = { ...user, plan };
        await persist(next);
        syncUser(next);
      },
      // Free-tier scan quota resets daily rather than persisting a running
      // total, so a user's local date (not a server clock) is the reset key.
      incrementScanCount: async () => {
        if (!user) return;
        const today = new Date().toISOString().slice(0, 10);
        const scansToday = user.lastScanDate === today ? user.scansToday + 1 : 1;
        await persist({ ...user, scansToday, lastScanDate: today });
      },
      refreshPlan: async () => {
        if (!user) return;
        const remotePlan = await fetchRemotePlan(user.id);
        const withPlan = remotePlan && remotePlan !== user.plan ? { ...user, plan: remotePlan } : user;
        const cleared = withExpiredAchievementCleared(withPlan);
        if (cleared !== user) await persist(cleared);
      },
      grantAchievementPremium: async (tier) => {
        if (!user) return;
        const base =
          user.plan === 'premium' && user.premiumExpiresAt && new Date(user.premiumExpiresAt).getTime() > Date.now()
            ? new Date(user.premiumExpiresAt).getTime()
            : Date.now();
        const premiumExpiresAt = new Date(base + tier.days * 86400000).toISOString();
        const next: User = {
          ...user,
          plan: 'premium',
          premiumExpiresAt,
          claimedAchievements: [...user.claimedAchievements, tier.threshold],
        };
        await persist(next);
        syncUser(next);
      },
      justRegistered,
      clearJustRegistered: () => setJustRegistered(false),
    }),
    [user, isLoading, justRegistered]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

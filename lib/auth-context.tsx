import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import { createContext, useContext, useEffect, useMemo, useState, PropsWithChildren } from 'react';
import { User } from './types';
import { supabase } from './supabase';
import { syncUser, fetchRemoteAccountState } from './userSync';
import { AchievementTier } from './achievements';

const STORAGE_KEY = 'halalzur.user';

export class GoogleSignInUnavailableError extends Error {}

/** Thrown from a sign-in method when the admin panel has banned this account. */
export class BannedAccountError extends Error {}

function banMessage(reason: string | null): string {
  return reason
    ? `Hesabınız bloklanıb: ${reason}`
    : 'Hesabınız bloklanıb. Ətraflı məlumat üçün dəstəklə əlaqə saxlayın.';
}

// GoogleSignin.configure() only needs to run once per app launch.
let googleConfigured = false;
function ensureGoogleConfigured(): boolean {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  if (!iosClientId) return false;
  if (!googleConfigured) {
    GoogleSignin.configure({ iosClientId });
    googleConfigured = true;
  }
  return true;
}

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setPlan: (plan: User['plan']) => Promise<void>;
  incrementScanCount: () => Promise<void>;
  refreshPlan: () => Promise<void>;
  grantAchievementPremium: (tier: AchievementTier) => Promise<void>;
  // In-memory only (not persisted) — true for one app session right after
  // first sign-in with a given account, so (tabs)/_layout.tsx's
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
        // An admin-panel plan change, or an achievement-granted Premium's
        // expiry, only ever lands in Supabase's `users` row — this is the
        // one moment that reaches the device.
        const remote = await fetchRemoteAccountState(stored.id);
        if (remote?.banned) {
          // Silent — nothing is awaiting a thrown error at app-launch
          // time, so just drop the session instead of leaving a banned
          // account signed in.
          await AsyncStorage.removeItem(STORAGE_KEY);
          setUser(null);
          return;
        }
        const next = remote
          ? withExpiredAchievementCleared({
              ...stored,
              plan: remote.plan,
              premiumExpiresAt: remote.premiumExpiresAt,
              claimedAchievements: remote.claimedAchievements,
            })
          : stored;
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
          // wipes local storage), so without reading this back first this
          // would always default to 'free'/no-expiry/no-claims and either
          // overwrite any admin-granted premium in Supabase via syncUser()
          // below, or let an already-claimed achievement tier be claimed
          // again since claimedAchievements would appear empty.
          const remote = await fetchRemoteAccountState(id);
          if (remote?.banned) throw new BannedAccountError(banMessage(remote.banReason));
          const appleUser: User = withExpiredAchievementCleared({
            id,
            name,
            email: credential.email ?? `${credential.user}@privaterelay.appleid.com`,
            plan: remote?.plan ?? 'free',
            scansToday: 0,
            lastScanDate: null,
            premiumExpiresAt: remote?.premiumExpiresAt ?? null,
            claimedAchievements: remote?.claimedAchievements ?? [],
          });
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
      signInWithGoogle: async () => {
        if (!ensureGoogleConfigured()) {
          throw new GoogleSignInUnavailableError('Google ilə giriş hələ qoşulmayıb.');
        }
        const response = await GoogleSignin.signIn();
        if (!isSuccessResponse(response)) return; // user cancelled

        const id = `google-${response.data.user.id}`;
        // Same re-creates-on-every-login shape as signInWithApple — read
        // back plan/expiry/claims first so a repeat sign-in doesn't reset
        // an admin-granted premium or a claimed achievement tier.
        const remote = await fetchRemoteAccountState(id);
        if (remote?.banned) throw new BannedAccountError(banMessage(remote.banReason));
        const googleUser: User = withExpiredAchievementCleared({
          id,
          name: response.data.user.name || 'Google istifadəçisi',
          email: response.data.user.email,
          plan: remote?.plan ?? 'free',
          scansToday: 0,
          lastScanDate: null,
          premiumExpiresAt: remote?.premiumExpiresAt ?? null,
          claimedAchievements: remote?.claimedAchievements ?? [],
        });
        await persist(googleUser);
        syncUser(googleUser);
        // No first-authorization signal like Apple's — a missing remote
        // row is the next best "this account is new here" check.
        if (!remote) setJustRegistered(true);
      },
      signUpWithEmail: async (email, password, name) => {
        if (!supabase) throw new Error('Supabase qoşulmayıb.');
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (error) throw error;
        // Email confirmation is enabled in the Supabase project → no
        // session comes back until the user clicks the confirmation link.
        if (!data.session || !data.user) {
          throw new Error(
            'Qeydiyyat göndərildi, amma email təsdiqi aktivdir. Supabase → Authentication → Providers → Email-də "Confirm email"-i deaktiv edin.'
          );
        }
        const id = `email-${data.user.id}`;
        const remote = await fetchRemoteAccountState(id);
        if (remote?.banned) {
          await supabase.auth.signOut();
          throw new BannedAccountError(banMessage(remote.banReason));
        }
        const emailUser: User = withExpiredAchievementCleared({
          id,
          name,
          email,
          plan: remote?.plan ?? 'free',
          scansToday: 0,
          lastScanDate: null,
          premiumExpiresAt: remote?.premiumExpiresAt ?? null,
          claimedAchievements: remote?.claimedAchievements ?? [],
        });
        await persist(emailUser);
        syncUser(emailUser);
        setJustRegistered(true);
      },
      signInWithEmail: async (email, password) => {
        if (!supabase) throw new Error('Supabase qoşulmayıb.');
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const id = `email-${data.user.id}`;
        const remote = await fetchRemoteAccountState(id);
        if (remote?.banned) {
          await supabase.auth.signOut();
          throw new BannedAccountError(banMessage(remote.banReason));
        }
        const emailUser: User = withExpiredAchievementCleared({
          id,
          name: (data.user.user_metadata?.name as string | undefined) || email.split('@')[0],
          email,
          plan: remote?.plan ?? 'free',
          scansToday: 0,
          lastScanDate: null,
          premiumExpiresAt: remote?.premiumExpiresAt ?? null,
          claimedAchievements: remote?.claimedAchievements ?? [],
        });
        await persist(emailUser);
        syncUser(emailUser);
      },
      signOut: async () => {
        await supabase?.auth.signOut();
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
        const remote = await fetchRemoteAccountState(user.id);
        const withRemote = remote
          ? {
              ...user,
              plan: remote.plan,
              premiumExpiresAt: remote.premiumExpiresAt,
              claimedAchievements: remote.claimedAchievements,
            }
          : user;
        const cleared = withExpiredAchievementCleared(withRemote);
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

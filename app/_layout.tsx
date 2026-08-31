import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../lib/auth-context';
import { HistoryProvider } from '../lib/history-context';
import { FavoritesProvider } from '../lib/favorites-context';
import { LanguageProvider } from '../lib/i18n-context';
import { OfflineBanner } from '../components/OfflineBanner';
import { initSentry, Sentry } from '../lib/sentry';

initSentry();

function RootLayout() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <HistoryProvider>
          <FavoritesProvider>
            <StatusBar style="light" />
            <OfflineBanner />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="subscription"
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="product/[id]"
                options={{ presentation: 'card', animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="ecodes"
                options={{ presentation: 'card', animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="achievements"
                options={{ presentation: 'card', animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="shopping-scan"
                options={{ presentation: 'card', animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="admin"
                options={{ presentation: 'card', animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="feedback"
                options={{ presentation: 'card', animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="referrals"
                options={{ presentation: 'card', animation: 'slide_from_right' }}
              />
            </Stack>
          </FavoritesProvider>
        </HistoryProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default Sentry.wrap(RootLayout);

import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../lib/auth-context';
import { HistoryProvider } from '../lib/history-context';
import { FavoritesProvider } from '../lib/favorites-context';
import { LanguageProvider } from '../lib/i18n-context';
import { LiteModeProvider } from '../lib/liteMode-context';
import { OfflineBanner } from '../components/OfflineBanner';
import { initSentry, Sentry } from '../lib/sentry';
import { rootViewRef } from '../lib/screenshotRef';
import { loadCustomECodes } from '../lib/eCodes';
import { loadCustomHaramKeywords } from '../lib/haramKeywords';

initSentry();
loadCustomECodes();
loadCustomHaramKeywords();

function RootLayout() {
  return (
    <View ref={rootViewRef} style={{ flex: 1 }} collapsable={false}>
    <LanguageProvider>
      <AuthProvider>
        <HistoryProvider>
          <FavoritesProvider>
            <LiteModeProvider>
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
            </LiteModeProvider>
          </FavoritesProvider>
        </HistoryProvider>
      </AuthProvider>
    </LanguageProvider>
    </View>
  );
}

export default Sentry.wrap(RootLayout);

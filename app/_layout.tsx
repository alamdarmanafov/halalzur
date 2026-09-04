import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '../lib/auth-context';
import { HistoryProvider } from '../lib/history-context';
import { FavoritesProvider } from '../lib/favorites-context';
import { LanguageProvider } from '../lib/i18n-context';
import { LiteModeProvider } from '../lib/liteMode-context';
import { DietaryProfileProvider } from '../lib/dietaryProfile-context';
import { StreakProvider } from '../lib/streak-context';
import { ShoppingListProvider } from '../lib/shoppingList-context';
import { OfflineBanner } from '../components/OfflineBanner';
import { initSentry, Sentry } from '../lib/sentry';
import { rootViewRef } from '../lib/screenshotRef';
import { loadCustomECodes } from '../lib/eCodes';
import { loadCustomHaramKeywords } from '../lib/haramKeywords';

SplashScreen.preventAutoHideAsync();

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
            <DietaryProfileProvider>
            <StreakProvider>
            <ShoppingListProvider>
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
                  name="dietary-profile"
                  options={{ presentation: 'card', animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="notification-preferences"
                  options={{ presentation: 'card', animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="shopping-list"
                  options={{ presentation: 'card', animation: 'slide_from_right' }}
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
                  name="feedback-history"
                  options={{ presentation: 'card', animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="referrals"
                  options={{ presentation: 'card', animation: 'slide_from_right' }}
                />
              </Stack>
            </ShoppingListProvider>
            </StreakProvider>
            </DietaryProfileProvider>
            </LiteModeProvider>
          </FavoritesProvider>
        </HistoryProvider>
      </AuthProvider>
    </LanguageProvider>
    </View>
  );
}

export default Sentry.wrap(RootLayout);

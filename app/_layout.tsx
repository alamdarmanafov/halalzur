import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../lib/auth-context';
import { HistoryProvider } from '../lib/history-context';
import { FavoritesProvider } from '../lib/favorites-context';
import { OfflineBanner } from '../components/OfflineBanner';

export default function RootLayout() {
  return (
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
              name="favorites"
              options={{ presentation: 'card', animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="admin"
              options={{ presentation: 'card', animation: 'slide_from_right' }}
            />
          </Stack>
        </FavoritesProvider>
      </HistoryProvider>
    </AuthProvider>
  );
}

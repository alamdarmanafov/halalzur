import { Fragment, useEffect } from 'react';
import { router, Tabs, usePathname } from 'expo-router';
import { Pressable, StyleSheet, GestureResponderEvent, AccessibilityState, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../lib/auth-context';
import { registerForPushNotifications, onForegroundMessage, setupNotificationNavigation } from '../../lib/notifications';
import { sendPushNotification } from '../../lib/pushNotify';
import { onShake } from '../../lib/shake';
import { captureAppScreenshot } from '../../lib/screenshot';
import { useLanguage } from '../../lib/i18n-context';
import { AnnouncementModal } from '../../components/AnnouncementModal';
import { WelcomeModal } from '../../components/WelcomeModal';
import { colors, radius } from '../../constants/theme';

const TAB_ICON_SIZE = 24;

type ScanTabButtonProps = {
  onPress?: (e: GestureResponderEvent) => void;
  accessibilityState?: AccessibilityState;
};

function ScanTabButton({ onPress, accessibilityState }: ScanTabButtonProps) {
  const focused = !!accessibilityState?.selected;
  return (
    <Pressable onPress={onPress} style={styles.scanWrap} accessibilityRole="button">
      <LinearGradient
        colors={[colors.primaryDark, colors.primary, colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.scanButton, focused && styles.scanButtonFocused]}
      >
        <Ionicons name="scan" size={30} color={colors.white} />
      </LinearGradient>
    </Pressable>
  );
}

export default function TabsLayout() {
  const { user, justRegistered } = useAuth();
  const pathname = usePathname();
  const { t } = useLanguage();

  useEffect(() => {
    const unsubscribeShake = onShake(async () => {
      if (pathname === '/feedback') return;
      const screenshot = await captureAppScreenshot();
      router.push({ pathname: '/feedback', params: screenshot ? { screenshot } : {} });
    });
    return unsubscribeShake;
  }, [pathname]);

  useEffect(() => {
    if (!user) return;
    // Only after the token is actually registered can a push reach this
    // device — at signUp/signInWithApple time (where justRegistered gets
    // set) there's no device_tokens row yet.
    registerForPushNotifications(user.id).then((token) => {
      if (token && justRegistered) {
        sendPushNotification(
          user.id,
          'Xoş gəldiniz, Halalzur-a! 👋',
          'Barkodu skan edərək məhsulun halal statusunu dərhal görə bilərsiniz.',
          { route: '/(tabs)/products' }
        );
      }
    });
    const unsubscribeForeground = onForegroundMessage((title, body, route) => {
      Alert.alert(
        title,
        body,
        route ? [{ text: 'Bax', onPress: () => router.push(route as any) }, { text: 'Bağla', style: 'cancel' }] : undefined
      );
    });
    // Handles the tap itself when the notification arrived while
    // backgrounded or cold-started the app — onForegroundMessage only
    // covers the app-already-open case above.
    const unsubscribeOpened = setupNotificationNavigation();
    return () => {
      unsubscribeForeground();
      unsubscribeOpened();
    };
  }, [user, justRegistered]);

  return (
    <Fragment>
      <WelcomeModal />
      <AnnouncementModal />
      <Tabs
        initialRouteName="products"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.gray,
          tabBarStyle: { height: 88, paddingTop: 8, paddingBottom: 28 },
          tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        }}
      >
      <Tabs.Screen
        name="products"
        options={{
          title: t('tabProducts'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'basket' : 'basket-outline'} color={color} size={TAB_ICON_SIZE} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: t('tabFavorites'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'heart' : 'heart-outline'} color={color} size={TAB_ICON_SIZE} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: '',
          tabBarButton: (props) => <ScanTabButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="places"
        options={{
          title: t('tabPlaces'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'location' : 'location-outline'} color={color} size={TAB_ICON_SIZE} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabProfile'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} color={color} size={TAB_ICON_SIZE} />
          ),
        }}
      />
      </Tabs>
    </Fragment>
  );
}

const styles = StyleSheet.create({
  scanWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  scanButton: {
    top: -22,
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 3,
    borderColor: colors.white,
  },
  scanButtonFocused: {
    borderColor: colors.surface,
  },
});

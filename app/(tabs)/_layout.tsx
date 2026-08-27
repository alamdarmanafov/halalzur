import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, GestureResponderEvent, AccessibilityState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius } from '../../constants/theme';

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
  return (
    <Tabs
      initialRouteName="index"
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
          title: 'Məhsullar',
          tabBarIcon: ({ color, size }) => <Ionicons name="list" color={color} size={size} />,
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
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
        }}
      />
    </Tabs>
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

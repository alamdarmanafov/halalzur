import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
        tabBarStyle: { height: 88, paddingTop: 8, paddingBottom: 28 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Skan et',
          tabBarIcon: ({ color, size }) => <Ionicons name="scan" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Məhsullar',
          tabBarIcon: ({ color, size }) => <Ionicons name="list" color={color} size={size} />,
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

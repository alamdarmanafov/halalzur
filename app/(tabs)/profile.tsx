import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../lib/auth-context';
import { useHistory } from '../../lib/history-context';
import { useFavorites } from '../../lib/favorites-context';
import { registerForPushNotifications } from '../../lib/notifications';
import { isAdmin } from '../../lib/admin';
import { getPoints, fetchPendingSubmissions } from '../../lib/submissions';
import { colors, radius, spacing, typography } from '../../constants/theme';

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
};

function formatExpiryDate(iso: string): string {
  return new Date(iso).toLocaleDateString('az-AZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ProfileScreen() {
  const { user, signOut, refreshPlan } = useAuth();
  const { history, clear } = useHistory();
  const { favorites } = useFavorites();
  const isPremium = user?.plan === 'premium';
  const admin = isAdmin(user);
  const [points, setPoints] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadProfileData = () => {
    if (!user) return;
    getPoints(user.id)
      .then(setPoints)
      .catch(() => {});
    if (admin) {
      fetchPendingSubmissions()
        .then((list) => setPendingCount(list.length))
        .catch(() => {});
    }
  };

  useEffect(loadProfileData, [user, admin]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshPlan();
      loadProfileData();
    } finally {
      setRefreshing(false);
    }
  };

  const menuItems: MenuItem[] = [
    {
      icon: 'time-outline',
      label: `Skan tarixçəsi (${history.length})`,
      onPress: () => router.push('/(tabs)/products'),
    },
    {
      icon: 'heart-outline',
      label: `Favoritlər (${favorites.length})`,
      onPress: () => router.push('/favorites'),
    },
    {
      icon: 'notifications-outline',
      label: 'Bildirişlər',
      onPress: async () => {
        const token = user ? await registerForPushNotifications(user.id) : null;
        if (token) {
          Alert.alert('Bildirişlər aktivdir', 'Halalzur elanlarını alacaqsınız.');
        } else {
          Alert.alert(
            'Bildirişlər deaktivdir',
            'İcazə verilməyib, ya da bu build-də (Expo Go) native bildiriş modulu yoxdur. Ayarlar → Bildirişlər-dən aça bilərsiniz.'
          );
        }
      },
    },
    {
      icon: 'flask-outline',
      label: 'E-kod bələdçisi',
      onPress: () => router.push('/ecodes'),
    },
    {
      icon: 'trophy-outline',
      label: 'Nailiyyətlər',
      onPress: () => router.push('/achievements'),
    },
    {
      icon: 'globe-outline',
      label: 'Dil',
      onPress: () => Alert.alert('Dil seçimi', 'Hazırda yalnız Azərbaycan dili var. Digər dillər tezliklə əlçatan olacaq.'),
    },
    {
      icon: 'shield-checkmark-outline',
      label: 'Sertifikat orqanları haqqında',
      onPress: () =>
        Alert.alert(
          'Sertifikat orqanları',
          'Halalzur GIMDES, Helal Akreditasyon Kurumu (HAK), SMIIC, JAKIM və AZSTANDART Halal (Azərbaycan) qeydiyyatları ilə çarpaz yoxlama aparır.'
        ),
    },
    {
      icon: 'gift-outline',
      label: 'Dostunu dəvət et',
      onPress: () => router.push('/referrals'),
    },
    {
      icon: 'chatbox-ellipses-outline',
      label: 'Xəta bildir / Rəy',
      onPress: () => router.push('/feedback'),
    },
    ...(admin
      ? [
          {
            icon: 'shield-half-outline' as const,
            label: `Admin: Təsdiq gözləyənlər (${pendingCount})`,
            onPress: () => router.push('/admin'),
          },
        ]
      : []),
    {
      icon: 'trash-outline',
      label: 'Tarixçəni təmizlə',
      onPress: () => clear(),
    },
    {
      icon: 'log-out-outline',
      label: 'Çıxış et',
      onPress: async () => {
        await signOut();
        router.replace('/(auth)/welcome');
      },
      danger: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <Text style={styles.title}>Profil</Text>

        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name ?? '?').slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{user?.name}</Text>
              {isPremium && (
                <View style={styles.premiumBadge}>
                  <Ionicons name="star" size={11} color={colors.white} />
                  <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                </View>
              )}
            </View>
            <Text style={styles.email}>{user?.email}</Text>
            {isPremium && user?.premiumExpiresAt && (
              <Text style={styles.premiumExpiry}>
                Nailiyyət mükafatı — {formatExpiryDate(user.premiumExpiresAt)} tarixinə qədər
              </Text>
            )}
          </View>
          <View style={styles.pointsBadge}>
            <Ionicons name="trophy" size={14} color={colors.primaryDark} />
            <Text style={styles.pointsText}>{points}</Text>
          </View>
        </View>

        {!isPremium && (
          <Pressable onPress={() => router.push('/subscription')}>
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.planCard}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.planLabel}>Pulsuz plan</Text>
                <Text style={styles.planDesc}>Gündə 3 skan · Premium-a keçin, limitsiz olsun</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={colors.white} />
            </LinearGradient>
          </Pressable>
        )}

        <View style={styles.menu}>
          {menuItems.map((item) => (
            <Pressable key={item.label} style={styles.menuRow} onPress={item.onPress}>
              <Ionicons
                name={item.icon}
                size={20}
                color={item.danger ? colors.danger : colors.primaryDark}
              />
              <Text style={[styles.menuLabel, item.danger && { color: colors.danger }]}>
                {item.label}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.grayLight} />
            </Pressable>
          ))}
        </View>

        <Text style={styles.version}>Halalzur v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, paddingHorizontal: spacing.lg },
  title: { ...typography.h1, color: colors.primaryDark, marginTop: spacing.md, marginBottom: spacing.lg },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.h2, color: colors.primaryDark },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  name: { ...typography.h3, color: colors.black },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  premiumBadgeText: { color: colors.white, fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  email: { ...typography.small, color: colors.gray, marginTop: 2 },
  premiumExpiry: { ...typography.small, color: colors.primaryDark, marginTop: 2, fontWeight: '600' },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  pointsText: { ...typography.small, color: colors.primaryDark, fontWeight: '800' },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  planLabel: { ...typography.h3, color: colors.white },
  planDesc: { ...typography.small, color: colors.surface, marginTop: 2 },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(10,77,46,0.08)',
  },
  menuLabel: { flex: 1, ...typography.body, color: colors.black, fontWeight: '600' },
  version: { textAlign: 'center', color: colors.grayLight, marginTop: spacing.lg, fontSize: typography.small.fontSize },
});

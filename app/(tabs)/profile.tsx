import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../lib/auth-context';
import { useHistory } from '../../lib/history-context';
import { useFavorites } from '../../lib/favorites-context';
import { registerForPushNotifications } from '../../lib/notifications';
import { colors, radius, spacing, typography } from '../../constants/theme';

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { history, clear } = useHistory();
  const { favorites } = useFavorites();
  const isPremium = user?.plan === 'premium';

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
      icon: 'shield-checkmark-outline',
      label: 'Sertifikat orqanları haqqında',
      onPress: () =>
        Alert.alert(
          'Sertifikat orqanları',
          'Halalzur GIMDES, Helal Akreditasyon Kurumu (HAK), SMIIC, JAKIM və AZSTANDART Halal (Azərbaycan) qeydiyyatları ilə çarpaz yoxlama aparır.'
        ),
    },
    {
      icon: 'trash-outline',
      label: 'Tarixçəni təmizlə',
      onPress: () => clear(),
    },
    {
      icon: 'log-out-outline',
      label: 'Çıxış et',
      onPress: () => signOut(),
      danger: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <Text style={styles.title}>Profil</Text>

        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name ?? '?').slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </View>

        <Pressable onPress={() => router.push('/subscription')}>
          <LinearGradient
            colors={isPremium ? [colors.primaryDark, colors.primary] : [colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.planCard}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.planLabel}>{isPremium ? 'Premium üzv' : 'Pulsuz plan'}</Text>
              <Text style={styles.planDesc}>
                {isPremium
                  ? 'Limitsiz skan, tam sertifikat detalları'
                  : 'Aylıq 3 skan · Premium-a keçin, limitsiz olsun'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.white} />
          </LinearGradient>
        </Pressable>

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
  name: { ...typography.h3, color: colors.black },
  email: { ...typography.small, color: colors.gray, marginTop: 2 },
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

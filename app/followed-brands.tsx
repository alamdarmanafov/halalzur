import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth-context';
import { useLanguage } from '../lib/i18n-context';
import { getFollowedBrands, unfollowBrand } from '../lib/brandFollows';
import { colors, radius, spacing, typography } from '../constants/theme';

export default function FollowedBrandsScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getFollowedBrands(user.id)
      .then(setBrands)
      .finally(() => setLoading(false));
  }, [user]);

  const onUnfollow = async (brand: string) => {
    if (!user) return;
    setBrands((prev) => prev.filter((b) => b !== brand));
    await unfollowBrand(user.id, brand);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.black} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('followedBrandsTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : brands.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="bookmark-outline" size={40} color={colors.grayLight} />
          <Text style={styles.emptyText}>{t('followedBrandsEmpty')}</Text>
        </View>
      ) : (
        <FlatList
          data={brands}
          keyExtractor={(brand) => brand}
          contentContainerStyle={{ padding: spacing.lg }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Ionicons name="pricetag" size={18} color={colors.primaryDark} />
              <Text style={styles.rowText}>{item}</Text>
              <Pressable onPress={() => onUnfollow(item)} hitSlop={8}>
                <Ionicons name="close-circle" size={22} color={colors.grayLight} />
              </Pressable>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...typography.h3, color: colors.black },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingHorizontal: spacing.xl },
  emptyText: { ...typography.body, color: colors.gray, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  rowText: { flex: 1, ...typography.body, color: colors.black, fontWeight: '600' },
});

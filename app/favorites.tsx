import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../lib/favorites-context';
import { StatusBadge } from '../components/StatusBadge';
import { colors, radius, spacing, typography } from '../constants/theme';

export default function FavoritesScreen() {
  const { favorites } = useFavorites();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.black} />
        </Pressable>
        <Text style={styles.title}>Favoritlər</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.barcode}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.md }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="heart-outline" size={36} color={colors.grayLight} />
            <Text style={styles.emptyText}>Hələ favorit məhsulunuz yoxdur</Text>
            <Text style={styles.emptyHint}>
              Bir məhsulu açıb ürək ikonuna toxunaraq buraya əlavə edə bilərsiniz.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.barcode } })}
          >
            <Text style={styles.emoji}>{item.imageEmoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.productName} numberOfLines={1}>
                {item.productName}
              </Text>
              <Text style={styles.brand} numberOfLines={1}>
                {item.brand} · {item.category}
              </Text>
              <StatusBadge status={item.status} size="sm" />
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.grayLight} />
          </Pressable>
        )}
      />
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
  title: { ...typography.h3, color: colors.primaryDark },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  emoji: { fontSize: 30 },
  productName: { ...typography.h3, color: colors.black },
  brand: { ...typography.small, color: colors.gray, marginTop: 2, marginBottom: spacing.xs },
  empty: { alignItems: 'center', marginTop: spacing.xl, gap: spacing.sm, paddingHorizontal: spacing.lg },
  emptyText: { ...typography.body, color: colors.gray, fontWeight: '600', textAlign: 'center' },
  emptyHint: { ...typography.small, color: colors.gray, textAlign: 'center' },
});

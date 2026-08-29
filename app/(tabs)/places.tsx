import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getPlacesByCategory, Place, PLACE_CATEGORY_LABEL, PLACE_CATEGORY_ICON, PlaceCategory } from '../../lib/places';
import { StatusBadge } from '../../components/StatusBadge';
import { colors, radius, spacing, typography } from '../../constants/theme';

const FILTERS: { key: PlaceCategory | 'hamısı'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'hamısı', label: 'Hamısı', icon: 'apps-outline' },
  { key: 'restoran', label: PLACE_CATEGORY_LABEL.restoran, icon: PLACE_CATEGORY_ICON.restoran as any },
  { key: 'kafe', label: PLACE_CATEGORY_LABEL.kafe, icon: PLACE_CATEGORY_ICON.kafe as any },
  { key: 'coffee_shop', label: PLACE_CATEGORY_LABEL.coffee_shop, icon: PLACE_CATEGORY_ICON.coffee_shop as any },
];

export default function PlacesScreen() {
  const [filter, setFilter] = useState<PlaceCategory | 'hamısı'>('hamısı');
  const [data, setData] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getPlacesByCategory(filter).then((places) => {
      if (active) {
        setData(places);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [filter]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Məkanlar</Text>
      <Text style={styles.subtitle}>Halal sertifikatlı restoran, kafe və coffee shop-lar</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryRow}
        contentContainerStyle={{ gap: spacing.sm }}
      >
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <Pressable
              key={f.key}
              style={[styles.categoryChip, active && styles.categoryChipActive]}
              onPress={() => setFilter(f.key)}
            >
              <Ionicons name={f.icon} size={14} color={active ? colors.white : colors.primaryDark} />
              <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: spacing.xl, paddingTop: spacing.md }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="location-outline" size={32} color={colors.grayLight} />
              <Text style={styles.emptyText}>Bu kateqoriyada məkan tapılmadı</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons name={PLACE_CATEGORY_ICON[item.category] as any} size={22} color={colors.primaryDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.placeName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.address} numberOfLines={1}>
                {PLACE_CATEGORY_LABEL[item.category]} · {item.address}
              </Text>
              <StatusBadge status={item.status} size="sm" />
              {item.note && (
                <Text style={styles.note} numberOfLines={2}>
                  {item.note}
                </Text>
              )}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, paddingHorizontal: spacing.lg },
  title: { ...typography.h1, color: colors.primaryDark, marginTop: spacing.md },
  subtitle: { ...typography.small, color: colors.gray, marginTop: 4 },
  categoryRow: { marginTop: spacing.md, flexGrow: 0 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  categoryChipActive: { backgroundColor: colors.primary },
  categoryChipText: { ...typography.small, color: colors.primaryDark, fontWeight: '700' },
  categoryChipTextActive: { color: colors.white },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeName: { ...typography.h3, color: colors.black },
  address: { ...typography.small, color: colors.gray, marginTop: 2, marginBottom: spacing.xs },
  note: { ...typography.small, color: colors.gray, marginTop: spacing.xs, lineHeight: 17 },
  empty: { alignItems: 'center', marginTop: spacing.xl, gap: spacing.sm },
  emptyText: { color: colors.gray },
});

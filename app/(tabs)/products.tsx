import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHistory } from '../../lib/history-context';
import { searchProducts, getAllProducts } from '../../lib/certification';
import { CertificationResult } from '../../lib/types';
import { StatusBadge } from '../../components/StatusBadge';
import { colors, radius, spacing, typography } from '../../constants/theme';

const CATEGORIES: { label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Hamısı', icon: 'apps-outline' },
  { label: 'Şirniyyat', icon: 'ice-cream-outline' },
  { label: 'Çörək', icon: 'nutrition-outline' },
  { label: 'İçki', icon: 'cafe-outline' },
  { label: 'Süd məhsulları', icon: 'water-outline' },
  { label: 'Kosmetika', icon: 'sparkles-outline' },
];

export default function ProductsScreen() {
  const { history } = useHistory();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Hamısı');
  const [results, setResults] = useState<CertificationResult[]>(getAllProducts());

  useEffect(() => {
    let active = true;
    searchProducts(query).then((r) => {
      if (active) setResults(r);
    });
    return () => {
      active = false;
    };
  }, [query]);

  const data = useMemo(() => {
    const base = query ? results : history.length ? history : results;
    if (category === 'Hamısı') return base;
    return base.filter((item) => item.category.toLowerCase().includes(category.toLowerCase()));
  }, [query, results, history, category]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Məhsullar</Text>
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.gray} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Məhsul, marka və ya kateqoriya axtar"
          placeholderTextColor={colors.gray}
          style={styles.searchInput}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryRow}
        contentContainerStyle={{ gap: spacing.sm }}
      >
        {CATEGORIES.map((c) => {
          const active = c.label === category;
          return (
            <Pressable
              key={c.label}
              style={[styles.categoryChip, active && styles.categoryChipActive]}
              onPress={() => setCategory(c.label)}
            >
              <Ionicons name={c.icon} size={14} color={active ? colors.white : colors.primaryDark} />
              <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                {c.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {!query && (
        <Text style={styles.sectionLabel}>
          {history.length ? 'Son skan etdikləriniz' : 'Populyar məhsullar'}
        </Text>
      )}

      <FlatList
        data={data}
        keyExtractor={(item) => item.barcode}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={32} color={colors.grayLight} />
            <Text style={styles.emptyText}>Nəticə tapılmadı</Text>
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
  container: { flex: 1, backgroundColor: colors.white, paddingHorizontal: spacing.lg },
  title: { ...typography.h1, color: colors.primaryDark, marginTop: spacing.md },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 46,
    marginTop: spacing.md,
  },
  searchInput: { flex: 1, fontSize: typography.body.fontSize, color: colors.black },
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
  sectionLabel: {
    ...typography.small,
    color: colors.gray,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
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
  empty: { alignItems: 'center', marginTop: spacing.xl, gap: spacing.sm },
  emptyText: { color: colors.gray },
});

import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useHistory } from '../../lib/history-context';
import { useLanguage } from '../../lib/i18n-context';
import {
  searchProducts,
  getManyByBarcode,
  getMostRecommendedProducts,
  RecommendedProduct,
} from '../../lib/certification';
import { PRODUCT_CATEGORIES, getProductCategories } from '../../lib/categories';
import { CertificationResult } from '../../lib/types';
import { StatusBadge } from '../../components/StatusBadge';
import { colors, radius, spacing, typography } from '../../constants/theme';

const CATEGORY_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  Şirniyyat: 'ice-cream-outline',
  Çörək: 'nutrition-outline',
  İçki: 'cafe-outline',
  'Süd məhsulları': 'water-outline',
  'Ət məhsulları': 'restaurant-outline',
  Konservlər: 'archive-outline',
  'Dondurulmuş məhsullar': 'snow-outline',
  Souslar: 'flask-outline',
  Qəlyanaltılar: 'fast-food-outline',
  'Dənli məhsullar': 'basket-outline',
  'Uşaq qidası': 'happy-outline',
  'Makaron və düyü': 'restaurant-outline',
  Yağlar: 'water-outline',
  Ədviyyat: 'leaf-outline',
  Kosmetika: 'sparkles-outline',
};

const DEFAULT_CATEGORY_ICON: keyof typeof Ionicons.glyphMap = 'pricetag-outline';

function buildCategoryChips(labels: readonly string[]): { label: string; icon: keyof typeof Ionicons.glyphMap }[] {
  return [
    { label: 'Hamısı', icon: 'apps-outline' },
    ...labels.map((label) => ({ label, icon: CATEGORY_ICON[label] ?? DEFAULT_CATEGORY_ICON })),
  ];
}

export default function ProductsScreen() {
  const { history, removeScan } = useHistory();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Hamısı');
  const [results, setResults] = useState<CertificationResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // History stores a frozen snapshot from scan time, so a product admin
  // approves/re-statuses later never updates there on its own — this
  // refreshes each history barcode against the live data.
  const [liveHistory, setLiveHistory] = useState<Record<string, CertificationResult>>({});
  const [recommendedMode, setRecommendedMode] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const RECOMMENDED_PAGE_SIZE = 10;
  const [recommendedVisibleCount, setRecommendedVisibleCount] = useState(RECOMMENDED_PAGE_SIZE);
  // Starts from the hardcoded fallback so the chip row isn't empty on
  // first render, then swaps in the admin-editable DB list once it loads.
  const [categoryChips, setCategoryChips] = useState(() => buildCategoryChips(PRODUCT_CATEGORIES));

  useEffect(() => {
    let active = true;
    getProductCategories().then((labels) => {
      if (active) setCategoryChips(buildCategoryChips(labels));
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoadingResults(true);
    searchProducts(query).then((r) => {
      if (!active) return;
      setResults(r);
      setLoadingResults(false);
    });
    return () => {
      active = false;
    };
  }, [query]);

  useEffect(() => {
    if (history.length === 0) return;
    let active = true;
    getManyByBarcode(history.map((h) => h.barcode)).then((map) => {
      if (!active) return;
      setLiveHistory(map);
      // A history entry scanned while still unclassified that has since
      // been approved (admin gave it a real status) no longer needs to sit
      // in "my scans" — it's now a real product in the database.
      history
        .filter((h) => h.status === 'unknown' && map[h.barcode] && map[h.barcode].status !== 'unknown')
        .forEach((h) => removeScan(h.barcode));
    });
    return () => {
      active = false;
    };
  }, [history]);

  useEffect(() => {
    if (!recommendedMode) return;
    let active = true;
    setLoadingRecommended(true);
    getMostRecommendedProducts(200).then((r) => {
      if (!active) return;
      setRecommendedProducts(r);
      setRecommendedVisibleCount(RECOMMENDED_PAGE_SIZE);
      setLoadingRecommended(false);
    });
    return () => {
      active = false;
    };
  }, [recommendedMode]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (recommendedMode) {
        setRecommendedProducts(await getMostRecommendedProducts(200));
        setRecommendedVisibleCount(RECOMMENDED_PAGE_SIZE);
      } else {
        setResults(await searchProducts(query));
        if (history.length) setLiveHistory(await getManyByBarcode(history.map((h) => h.barcode)));
      }
    } finally {
      setRefreshing(false);
    }
  };

  const filteredData = useMemo(() => {
    const base = recommendedMode
      ? recommendedProducts
      : query
      ? results
      : history.length
      ? history.map((h) => liveHistory[h.barcode] ?? h)
      : results;
    if (category === 'Hamısı') return base;
    return base.filter((item) => item.category.toLowerCase().includes(category.toLowerCase()));
  }, [query, results, history, liveHistory, category, recommendedMode, recommendedProducts]);

  // Recommended mode paginates 10-at-a-time client-side (already fetched
  // up to 200) rather than everything at once — nothing else does, since
  // search/history/category browsing are already naturally short lists.
  const data = recommendedMode ? filteredData.slice(0, recommendedVisibleCount) : filteredData;
  const hasMoreRecommended = recommendedMode && recommendedVisibleCount < filteredData.length;

  // Only history-backed rows are deletable — search/browse results are the
  // shared product database, not something a personal "wrong scan" delete
  // applies to.
  const isHistoryView = !recommendedMode && !query && history.length > 0;

  const toggleRecommendedMode = () => {
    setRecommendedMode((prev) => !prev);
    setQuery('');
  };
  const confirmDelete = (item: CertificationResult) => {
    Alert.alert(t('productsDeleteTitle'), `"${item.productName}" ${t('productsDeleteBody')}`, [
      { text: t('productsDeleteCancel'), style: 'cancel' },
      { text: t('productsDeleteConfirm'), style: 'destructive', onPress: () => removeScan(item.barcode) },
    ]);
  };

  const [refreshingBarcode, setRefreshingBarcode] = useState<string | null>(null);
  // A single history row's on-demand refresh — the [history]-effect above
  // already re-checks every history barcode on mount, but this lets a user
  // force one specific row right after they know an admin just changed it,
  // without waiting for a remount.
  const recheckBarcode = async (barcode: string) => {
    setRefreshingBarcode(barcode);
    try {
      const map = await getManyByBarcode([barcode]);
      if (map[barcode]) setLiveHistory((prev) => ({ ...prev, [barcode]: map[barcode] }));
    } finally {
      setRefreshingBarcode(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>{t('productsTitle')}</Text>
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.gray} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('productsSearchPlaceholder')}
          placeholderTextColor={colors.gray}
          style={styles.searchInput}
        />
      </View>

      <Pressable
        style={[styles.recommendedToggle, recommendedMode && styles.recommendedToggleActive]}
        onPress={toggleRecommendedMode}
      >
        <Ionicons
          name={recommendedMode ? 'thumbs-up' : 'thumbs-up-outline'}
          size={16}
          color={recommendedMode ? colors.white : colors.primaryDark}
        />
        <Text style={[styles.recommendedToggleText, recommendedMode && styles.recommendedToggleTextActive]}>
          {t('productsRecommendedToggle')}
        </Text>
      </Pressable>

      <View style={styles.categoryRowWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryRow}
          contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.xl }}
        >
          {categoryChips.map((c) => {
            const active = c.label === category;
            return (
              <Pressable
                key={c.label}
                style={[styles.categoryChip, active && styles.categoryChipActive]}
                onPress={() => setCategory(c.label)}
              >
                <Ionicons name={c.icon} size={14} color={active ? colors.white : colors.primaryDark} />
                <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                  {c.label === 'Hamısı' ? t('productsCategoryAll') : c.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        {/* Hints that the row scrolls, instead of the last chip just
            slamming into the screen edge looking like a rendering glitch. */}
        <LinearGradient
          colors={['rgba(255,255,255,0)', colors.white]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.categoryFade}
          pointerEvents="none"
        />
      </View>

      {recommendedMode ? (
        <Text style={styles.sectionLabel}>{t('productsRecommendedLabel')}</Text>
      ) : (
        !query && (
          <Text style={styles.sectionLabel}>
            {history.length ? t('productsRecentLabel') : t('productsPopularLabel')}
          </Text>
        )
      )}

      <FlatList
        data={data}
        keyExtractor={(item, index) => `${item.barcode}-${index}`}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          loadingResults && !isHistoryView ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={32} color={colors.grayLight} />
              <Text style={styles.emptyText}>{t('productsEmptyResult')}</Text>
            </View>
          )
        }
        renderItem={({ item, index }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.barcode } })}
            onLongPress={isHistoryView ? () => confirmDelete(item) : undefined}
          >
            {recommendedMode && (
              <View style={[styles.rankBadge, index === 0 && styles.rankBadgeGold]}>
                <Text style={styles.rankBadgeText}>{index + 1}</Text>
              </View>
            )}
            <Text style={styles.emoji}>{item.imageEmoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.productName} numberOfLines={1}>
                {item.productName}
              </Text>
              <Text style={styles.brand} numberOfLines={1}>
                {item.brand} · {item.category}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <StatusBadge status={item.status} size="sm" />
                {recommendedMode && (
                  <View style={styles.recommendCountRow}>
                    <Ionicons name="thumbs-up" size={12} color={colors.primary} />
                    <Text style={styles.recommendCountText}>{(item as RecommendedProduct).recommendCount}</Text>
                  </View>
                )}
              </View>
            </View>
            {isHistoryView ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Pressable
                  hitSlop={8}
                  onPress={() => recheckBarcode(item.barcode)}
                  disabled={refreshingBarcode === item.barcode}
                >
                  {refreshingBarcode === item.barcode ? (
                    <ActivityIndicator size="small" color={colors.grayLight} />
                  ) : (
                    <Ionicons name="refresh-outline" size={18} color={colors.grayLight} />
                  )}
                </Pressable>
                <Pressable hitSlop={8} onPress={() => confirmDelete(item)}>
                  <Ionicons name="trash-outline" size={18} color={colors.grayLight} />
                </Pressable>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={20} color={colors.grayLight} />
            )}
          </Pressable>
        )}
        ListFooterComponent={
          hasMoreRecommended ? (
            <Pressable
              style={styles.moreBtn}
              onPress={() => setRecommendedVisibleCount((n) => n + RECOMMENDED_PAGE_SIZE)}
            >
              <Text style={styles.moreBtnText}>
                {t('productsShowMore')} ({Math.min(RECOMMENDED_PAGE_SIZE, filteredData.length - recommendedVisibleCount)})
              </Text>
            </Pressable>
          ) : null
        }
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
  recommendedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  recommendedToggleActive: { backgroundColor: colors.primary },
  recommendedToggleText: { ...typography.small, color: colors.primaryDark, fontWeight: '700' },
  recommendedToggleTextActive: { color: colors.white },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeGold: { backgroundColor: colors.warning },
  rankBadgeText: { color: colors.white, fontWeight: '800', fontSize: 12 },
  recommendCountRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recommendCountText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  moreBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  moreBtnText: { ...typography.body, color: colors.primaryDark, fontWeight: '700' },
  categoryRowWrap: { position: 'relative' },
  categoryRow: { marginTop: spacing.md, flexGrow: 0 },
  categoryFade: { position: 'absolute', right: 0, top: spacing.md, bottom: 0, width: 28 },
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

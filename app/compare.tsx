import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, FlatList, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { searchProducts, lookupBarcode, displayCertifier } from '../lib/certification';
import { getRatingSummary, RatingSummary } from '../lib/ratings';
import { extractECodesFromText } from '../lib/eCodes';
import { useHistory } from '../lib/history-context';
import { useFavorites } from '../lib/favorites-context';
import { useLanguage } from '../lib/i18n-context';
import { CertificationResult } from '../lib/types';
import { StatusBadge } from '../components/StatusBadge';
import { radius, spacing, typography, ThemeColors } from '../constants/theme';
import { useThemeColors } from '../lib/theme-context';

type Slot = 'a' | 'b';

export default function CompareScreen() {
  const { t } = useLanguage();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { favorites } = useFavorites();
  const { history } = useHistory();
  const params = useLocalSearchParams<{ barcode?: string }>();

  const [productA, setProductA] = useState<CertificationResult | null>(null);
  const [productB, setProductB] = useState<CertificationResult | null>(null);

  useEffect(() => {
    if (params.barcode) lookupBarcode(params.barcode).then(setProductA);
    // Only meant to preselect slot A when this screen is opened from a
    // product's own "Compare" button — never re-runs if the user later
    // clears/changes that slot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.barcode]);
  const [ratingA, setRatingA] = useState<RatingSummary | null>(null);
  const [ratingB, setRatingB] = useState<RatingSummary | null>(null);
  const [pickerSlot, setPickerSlot] = useState<Slot | null>(null);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CertificationResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (productA) getRatingSummary(productA.barcode).then(setRatingA);
    else setRatingA(null);
  }, [productA]);

  useEffect(() => {
    if (productB) getRatingSummary(productB.barcode).then(setRatingB);
    else setRatingB(null);
  }, [productB]);

  useEffect(() => {
    if (pickerSlot === null) return;
    const q = query.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const handle = setTimeout(() => {
      searchProducts(q)
        .then(setSearchResults)
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(handle);
  }, [query, pickerSlot]);

  const openPicker = (slot: Slot) => {
    setQuery('');
    setSearchResults([]);
    setPickerSlot(slot);
  };

  const closePicker = () => setPickerSlot(null);

  const choose = (product: CertificationResult) => {
    if (pickerSlot === 'a') setProductA(product);
    else if (pickerSlot === 'b') setProductB(product);
    closePicker();
  };

  const quickPickLists = useMemo(() => {
    const otherBarcode = pickerSlot === 'a' ? productB?.barcode : productA?.barcode;
    const dedupe = (list: CertificationResult[]) => list.filter((p) => p.barcode !== otherBarcode);
    return {
      favorites: dedupe(favorites).slice(0, 10),
      history: dedupe(history).slice(0, 10),
    };
  }, [favorites, history, pickerSlot, productA, productB]);

  if (pickerSlot !== null) {
    const showQuickPicks = query.trim().length === 0;
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={closePicker} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.black} />
          </Pressable>
          <Text style={styles.title}>{t('compareEmptySlot')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.gray} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('compareSearchPlaceholder')}
            placeholderTextColor={colors.gray}
            style={styles.searchInput}
            autoFocus
          />
          {searching && <ActivityIndicator size="small" color={colors.primary} />}
        </View>

        {showQuickPicks ? (
          <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
            {quickPickLists.favorites.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>{t('compareFavoritesSection')}</Text>
                {quickPickLists.favorites.map((p) => (
                  <PickerRow key={p.barcode} product={p} colors={colors} styles={styles} onPress={() => choose(p)} />
                ))}
              </>
            )}
            {quickPickLists.history.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>{t('compareHistorySection')}</Text>
                {quickPickLists.history.map((p) => (
                  <PickerRow key={p.barcode} product={p} colors={colors} styles={styles} onPress={() => choose(p)} />
                ))}
              </>
            )}
          </ScrollView>
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.barcode}
            contentContainerStyle={{ paddingBottom: spacing.xl }}
            renderItem={({ item }) => (
              <PickerRow product={item} colors={colors} styles={styles} onPress={() => choose(item)} />
            )}
            ListEmptyComponent={
              !searching ? (
                <View style={styles.empty}>
                  <Ionicons name="search-outline" size={32} color={colors.grayLight} />
                  <Text style={styles.emptyText}>{t('compareSearchEmpty')}</Text>
                </View>
              ) : null
            }
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.black} />
        </Pressable>
        <Text style={styles.title}>{t('compareTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.intro}>{t('compareIntro')}</Text>

      <View style={styles.slotRow}>
        <SlotCard product={productA} colors={colors} styles={styles} t={t} onPress={() => openPicker('a')} onClear={() => setProductA(null)} />
        <SlotCard product={productB} colors={colors} styles={styles} t={t} onPress={() => openPicker('b')} onClear={() => setProductB(null)} />
      </View>

      {productA && productB && (
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
          <CompareRow
            label={t('compareRowStatus')}
            colors={colors}
            styles={styles}
            valueA={<StatusBadge status={productA.status} size="sm" />}
            valueB={<StatusBadge status={productB.status} size="sm" />}
          />
          <CompareRow
            label={t('compareRowCategory')}
            colors={colors}
            styles={styles}
            valueA={<Text style={styles.cellText}>{productA.category || t('compareValueUnknown')}</Text>}
            valueB={<Text style={styles.cellText}>{productB.category || t('compareValueUnknown')}</Text>}
          />
          <CompareRow
            label={t('compareRowCertifier')}
            colors={colors}
            styles={styles}
            valueA={<Text style={styles.cellText}>{displayCertifier(productA.certifier)?.shortName ?? t('compareValueUnknown')}</Text>}
            valueB={<Text style={styles.cellText}>{displayCertifier(productB.certifier)?.shortName ?? t('compareValueUnknown')}</Text>}
          />
          <CompareRow
            label={t('compareRowVerifiedAt')}
            colors={colors}
            styles={styles}
            valueA={<Text style={styles.cellText}>{productA.verifiedAt ?? t('compareValueUnknown')}</Text>}
            valueB={<Text style={styles.cellText}>{productB.verifiedAt ?? t('compareValueUnknown')}</Text>}
          />
          <CompareRow
            label={t('compareRowOrigin')}
            colors={colors}
            styles={styles}
            valueA={<Text style={styles.cellText}>{productA.originCountry ?? t('compareValueUnknown')}</Text>}
            valueB={<Text style={styles.cellText}>{productB.originCountry ?? t('compareValueUnknown')}</Text>}
          />
          <CompareRow
            label={t('compareRowIngredients')}
            colors={colors}
            styles={styles}
            valueA={<Text style={styles.cellText}>{t('compareIngredientsCount').replace('{n}', String(productA.ingredients.length))}</Text>}
            valueB={<Text style={styles.cellText}>{t('compareIngredientsCount').replace('{n}', String(productB.ingredients.length))}</Text>}
          />
          <CompareRow
            label={t('compareRowECodes')}
            colors={colors}
            styles={styles}
            valueA={<ECodeSummary text={productA.ingredients.join(', ')} colors={colors} styles={styles} t={t} />}
            valueB={<ECodeSummary text={productB.ingredients.join(', ')} colors={colors} styles={styles} t={t} />}
          />
          <CompareRow
            label={t('compareRowRating')}
            colors={colors}
            styles={styles}
            valueA={<RatingSummaryCell summary={ratingA} colors={colors} styles={styles} t={t} />}
            valueB={<RatingSummaryCell summary={ratingB} colors={colors} styles={styles} t={t} />}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function PickerRow({
  product,
  colors,
  styles,
  onPress,
}: {
  product: CertificationResult;
  colors: ThemeColors;
  styles: ReturnType<typeof makeStyles>;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.pickerRow} onPress={onPress}>
      {product.imageUrl ? (
        <Image source={{ uri: product.imageUrl }} style={styles.pickerImage} resizeMode="contain" />
      ) : (
        <Text style={styles.pickerEmoji}>{product.imageEmoji}</Text>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.pickerName} numberOfLines={1}>
          {product.productName}
        </Text>
        <Text style={styles.pickerBrand} numberOfLines={1}>
          {product.brand}
        </Text>
      </View>
      <StatusBadge status={product.status} size="sm" />
    </Pressable>
  );
}

function SlotCard({
  product,
  colors,
  styles,
  t,
  onPress,
  onClear,
}: {
  product: CertificationResult | null;
  colors: ThemeColors;
  styles: ReturnType<typeof makeStyles>;
  t: (key: any) => string;
  onPress: () => void;
  onClear: () => void;
}) {
  if (!product) {
    return (
      <Pressable style={styles.slotEmpty} onPress={onPress}>
        <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
        <Text style={styles.slotEmptyText}>{t('compareEmptySlot')}</Text>
      </Pressable>
    );
  }
  return (
    <View style={styles.slotFilled}>
      <Pressable onPress={onClear} style={styles.slotClear} hitSlop={8}>
        <Ionicons name="close-circle" size={20} color={colors.gray} />
      </Pressable>
      <Pressable onPress={onPress} style={{ alignItems: 'center' }}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.slotImage} resizeMode="contain" />
        ) : (
          <Text style={styles.slotEmoji}>{product.imageEmoji}</Text>
        )}
        <Text style={styles.slotName} numberOfLines={2}>
          {product.productName}
        </Text>
        <Text style={styles.slotBrand} numberOfLines={1}>
          {product.brand}
        </Text>
        <Text style={styles.slotChange}>{t('compareChangeSlot')}</Text>
      </Pressable>
    </View>
  );
}

function CompareRow({
  label,
  colors,
  styles,
  valueA,
  valueB,
}: {
  label: string;
  colors: ThemeColors;
  styles: ReturnType<typeof makeStyles>;
  valueA: React.ReactNode;
  valueB: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowValues}>
        <View style={styles.rowCell}>{valueA}</View>
        <View style={styles.rowDivider} />
        <View style={styles.rowCell}>{valueB}</View>
      </View>
    </View>
  );
}

function ECodeSummary({
  text,
  colors,
  styles,
  t,
}: {
  text: string;
  colors: ThemeColors;
  styles: ReturnType<typeof makeStyles>;
  t: (key: any) => string;
}) {
  const codes = useMemo(() => extractECodesFromText(text), [text]);
  if (codes.length === 0) return <Text style={styles.cellText}>{t('compareECodesNone')}</Text>;
  return (
    <Text style={styles.cellText}>
      {codes.map((c) => c.code).join(', ')}
    </Text>
  );
}

function RatingSummaryCell({
  summary,
  colors,
  styles,
  t,
}: {
  summary: RatingSummary | null;
  colors: ThemeColors;
  styles: ReturnType<typeof makeStyles>;
  t: (key: any) => string;
}) {
  if (!summary || summary.count === 0) return <Text style={styles.cellText}>{t('compareRatingNone')}</Text>;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name="star" size={14} color={colors.accent} />
      <Text style={styles.cellText}>
        {summary.average.toFixed(1)} · {summary.count}
      </Text>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, paddingHorizontal: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
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
  intro: { ...typography.small, color: colors.gray, marginTop: spacing.md, lineHeight: 18 },
  slotRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  slotEmpty: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  slotEmptyText: { ...typography.small, color: colors.primaryDark, fontWeight: '700' },
  slotFilled: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    position: 'relative',
  },
  slotClear: { position: 'absolute', top: 6, right: 6, zIndex: 1 },
  slotImage: { width: 48, height: 48 },
  slotEmoji: { fontSize: 36 },
  slotName: { ...typography.small, color: colors.black, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  slotBrand: { ...typography.caption, color: colors.gray, textAlign: 'center' },
  slotChange: { ...typography.caption, color: colors.primaryDark, fontWeight: '700', marginTop: 4, textDecorationLine: 'underline' },
  row: { marginTop: spacing.lg },
  rowLabel: { ...typography.small, color: colors.gray, fontWeight: '700', marginBottom: spacing.xs },
  rowValues: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.md, overflow: 'hidden' },
  rowCell: { flex: 1, padding: spacing.sm, alignItems: 'center' },
  rowDivider: { width: 1, backgroundColor: colors.grayLight },
  cellText: { ...typography.small, color: colors.black, textAlign: 'center' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 46,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  searchInput: { flex: 1, fontSize: typography.body.fontSize, color: colors.black },
  sectionLabel: { ...typography.small, color: colors.gray, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.xs },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  pickerImage: { width: 36, height: 36 },
  pickerEmoji: { fontSize: 28 },
  pickerName: { ...typography.body, color: colors.black, fontWeight: '700' },
  pickerBrand: { ...typography.small, color: colors.gray },
  empty: { alignItems: 'center', marginTop: spacing.xl, gap: spacing.sm },
  emptyText: { color: colors.gray },
});

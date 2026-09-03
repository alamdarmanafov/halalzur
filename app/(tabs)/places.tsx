import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import {
  getPlacesByCategory,
  submitPlace,
  Place,
  PLACE_CATEGORY_ICON,
  PlaceCategory,
} from '../../lib/places';
import { useAuth } from '../../lib/auth-context';
import { useLanguage } from '../../lib/i18n-context';
import { distanceKm } from '../../lib/geo';
import { getPlaceRecommendCounts, getMyRecommendedPlaceIds, togglePlaceRecommend } from '../../lib/recommendations';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/Button';
import { BrandModal } from '../../components/BrandModal';
import { sendPushNotification } from '../../lib/pushNotify';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { TranslationKey } from '../../lib/i18n';

const SUBMIT_CATEGORIES: PlaceCategory[] = ['restoran', 'kafe', 'coffee_shop', 'sirniyyat', 'qessabxana', 'market'];

const CATEGORY_LABEL_KEY: Record<PlaceCategory, TranslationKey> = {
  restoran: 'placeCategoryRestoran',
  kafe: 'placeCategoryKafe',
  coffee_shop: 'placeCategoryCoffeeShop',
  sirniyyat: 'placeCategorySirniyyat',
  qessabxana: 'placeCategoryQessabxana',
  market: 'placeCategoryMarket',
};

function openInMaps(place: Place, t: (key: TranslationKey) => string) {
  // Google Maps, not Apple Maps — places here are curated from Google Maps
  // links in the admin panel, so directions should open in the same app
  // the coordinates came from. The https://www.google.com/maps URL works
  // everywhere (opens the Google Maps app via its own universal link if
  // installed, the website otherwise) with no extra native config.
  const url =
    place.latitude != null && place.longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${place.address}`)}`;
  Linking.openURL(url).catch(() => {
    Alert.alert(t('placesMapOpenFailedTitle'), t('placesMapOpenFailedBody'));
  });
}

export default function PlacesScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const categoryLabel = (cat: PlaceCategory) => t(CATEGORY_LABEL_KEY[cat]);
  const FILTERS: { key: PlaceCategory | 'hamısı'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'hamısı', label: t('placesCategoryAll'), icon: 'apps-outline' },
    { key: 'restoran', label: categoryLabel('restoran'), icon: PLACE_CATEGORY_ICON.restoran as any },
    { key: 'kafe', label: categoryLabel('kafe'), icon: PLACE_CATEGORY_ICON.kafe as any },
    { key: 'coffee_shop', label: categoryLabel('coffee_shop'), icon: PLACE_CATEGORY_ICON.coffee_shop as any },
    { key: 'sirniyyat', label: categoryLabel('sirniyyat'), icon: PLACE_CATEGORY_ICON.sirniyyat as any },
    { key: 'qessabxana', label: categoryLabel('qessabxana'), icon: PLACE_CATEGORY_ICON.qessabxana as any },
    { key: 'market', label: categoryLabel('market'), icon: PLACE_CATEGORY_ICON.market as any },
  ];
  const [filter, setFilter] = useState<PlaceCategory | 'hamısı'>('hamısı');
  const [data, setData] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<PlaceCategory>('restoran');
  const [formAddress, setFormAddress] = useState('');
  const [formNote, setFormNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedNotice, setSubmittedNotice] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [recommendCounts, setRecommendCounts] = useState<Record<string, number>>({});
  const [myRecommends, setMyRecommends] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      } catch {
        // No location — list just stays in default (newest-first) order.
      }
    })();
  }, []);

  useEffect(() => {
    if (!data.length) {
      setRecommendCounts({});
      setMyRecommends(new Set());
      return;
    }
    let cancelled = false;
    const ids = data.map((p) => p.id);
    getPlaceRecommendCounts(ids).then((counts) => {
      if (!cancelled) setRecommendCounts(counts);
    });
    if (user) {
      getMyRecommendedPlaceIds(user.id, ids).then((ids2) => {
        if (!cancelled) setMyRecommends(ids2);
      });
    } else {
      setMyRecommends(new Set());
    }
    return () => {
      cancelled = true;
    };
  }, [data, user]);

  const onToggleRecommendPlace = async (place: Place) => {
    if (!user) {
      Alert.alert(t('productRecommendSignInTitle'), t('placeRecommendSignInBody'));
      return;
    }
    const currentlyRecommended = myRecommends.has(place.id);
    try {
      await togglePlaceRecommend(user.id, place.id, currentlyRecommended);
      setMyRecommends((prev) => {
        const next = new Set(prev);
        if (currentlyRecommended) next.delete(place.id);
        else next.add(place.id);
        return next;
      });
      setRecommendCounts((prev) => ({
        ...prev,
        [place.id]: (prev[place.id] ?? 0) + (currentlyRecommended ? -1 : 1),
      }));
    } catch (err: any) {
      Alert.alert(t('placesFormFailedTitle'), err.message ?? t('placesFormFailedBody'));
    }
  };

  const sortedData = useMemo(() => {
    if (!userLocation) return data;
    const dist = (p: Place) =>
      p.latitude != null && p.longitude != null
        ? distanceKm(userLocation.latitude, userLocation.longitude, p.latitude, p.longitude)
        : Infinity;
    return [...data].sort((a, b) => dist(a) - dist(b));
  }, [data, userLocation]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      setData(await getPlacesByCategory(filter));
    } finally {
      setRefreshing(false);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormCategory('restoran');
    setFormAddress('');
    setFormNote('');
  };

  const handleSubmitPlace = async () => {
    if (!user) return;
    if (!formName.trim() || !formAddress.trim()) {
      Alert.alert(t('placesFormIncompleteTitle'), t('placesFormIncompleteBody'));
      return;
    }
    const submittedName = formName.trim();
    setSubmitting(true);
    try {
      await submitPlace({
        userId: user.id,
        userName: user.name,
        name: submittedName,
        category: formCategory,
        address: formAddress.trim(),
        note: formNote.trim(),
      });
      setFormVisible(false);
      resetForm();
      setSubmittedNotice(true);
      sendPushNotification(
        user.id,
        t('placesSubmittedPushTitle'),
        `"${submittedName}" ${t('placesSubmittedPushBody')}`,
        { route: '/(tabs)/places' }
      );
    } catch (err: any) {
      Alert.alert(t('placesFormFailedTitle'), err.message ?? t('placesFormFailedBody'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t('placesTitle')}</Text>
          <Text style={styles.subtitle}>{t('placesSubtitle')}</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => setFormVisible(true)}>
          <Ionicons name="add" size={22} color={colors.white} />
        </Pressable>
      </View>

      <View style={styles.categoryRowWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryRow}
          contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.xl }}
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

      <FlatList
        data={sortedData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: spacing.xl, paddingTop: spacing.md }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="location-outline" size={32} color={colors.grayLight} />
              <Text style={styles.emptyText}>{t('placesEmpty')}</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.placeImage} />
            ) : (
              <View style={styles.iconWrap}>
                <Ionicons name={PLACE_CATEGORY_ICON[item.category] as any} size={22} color={colors.primaryDark} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.placeName} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.featured && <Ionicons name="star" size={14} color={colors.warning} />}
              </View>
              <Text style={styles.address} numberOfLines={1}>
                {categoryLabel(item.category)} · {item.address}
                {userLocation && item.latitude != null && item.longitude != null
                  ? ` · ${distanceKm(userLocation.latitude, userLocation.longitude, item.latitude, item.longitude).toFixed(1)} km`
                  : ''}
              </Text>
              <StatusBadge status={item.status} size="sm" />
              {item.note && (
                <Text style={styles.note} numberOfLines={2}>
                  {item.note}
                </Text>
              )}
            </View>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Pressable hitSlop={8} onPress={() => openInMaps(item, t)} style={styles.directionsBtn}>
                <Ionicons name="navigate-outline" size={20} color={colors.primary} />
              </Pressable>
              <Pressable hitSlop={8} onPress={() => onToggleRecommendPlace(item)} style={styles.recommendBtn}>
                <Ionicons
                  name={myRecommends.has(item.id) ? 'thumbs-up' : 'thumbs-up-outline'}
                  size={16}
                  color={myRecommends.has(item.id) ? colors.primary : colors.gray}
                />
                {recommendCounts[item.id] > 0 && (
                  <Text style={styles.recommendCount}>{recommendCounts[item.id]}</Text>
                )}
              </Pressable>
            </View>
          </View>
        )}
      />

      <Modal visible={formVisible} animationType="slide" transparent onRequestClose={() => setFormVisible(false)}>
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('placesFormTitle')}</Text>
              <Pressable onPress={() => setFormVisible(false)}>
                <Ionicons name="close" size={22} color={colors.gray} />
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
              <TextInput
                value={formName}
                onChangeText={setFormName}
                placeholder={t('placesFormNamePlaceholder')}
                placeholderTextColor={colors.gray}
                style={styles.input}
              />
              <View style={styles.categoryPickRow}>
                {SUBMIT_CATEGORIES.map((c) => (
                  <Pressable
                    key={c}
                    style={[styles.categoryChip, formCategory === c && styles.categoryChipActive]}
                    onPress={() => setFormCategory(c)}
                  >
                    <Text
                      style={[styles.categoryChipText, formCategory === c && styles.categoryChipTextActive]}
                    >
                      {categoryLabel(c)}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                value={formAddress}
                onChangeText={setFormAddress}
                placeholder={t('placesFormAddressPlaceholder')}
                placeholderTextColor={colors.gray}
                style={styles.input}
              />
              <TextInput
                value={formNote}
                onChangeText={setFormNote}
                placeholder={t('placesFormNotePlaceholder')}
                placeholderTextColor={colors.gray}
                multiline
                style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
              />
              <Text style={styles.formHint}>{t('placesFormHint')}</Text>
              <Button
                title={submitting ? t('placesFormSending') : t('placesFormSend')}
                onPress={handleSubmitPlace}
                loading={submitting}
                style={{ marginTop: spacing.sm, marginBottom: spacing.lg }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <BrandModal
        visible={submittedNotice}
        title={t('placesThanksTitle')}
        body={t('placesThanksBody')}
        ctaLabel={t('placesThanksCta')}
        onCta={() => setSubmittedNotice(false)}
        onClose={() => setSubmittedNotice(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, paddingHorizontal: spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.md, gap: spacing.md },
  title: { ...typography.h1, color: colors.primaryDark },
  subtitle: { ...typography.small, color: colors.gray, marginTop: 4 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: { ...typography.h2, color: colors.black },
  input: {
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.grayLight,
    paddingHorizontal: spacing.md,
    fontSize: typography.body.fontSize,
    color: colors.black,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  categoryPickRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.sm },
  formHint: { ...typography.small, color: colors.gray, marginTop: spacing.xs, lineHeight: 17 },
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
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
  placeImage: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  directionsBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  recommendCount: { ...typography.small, color: colors.gray, fontWeight: '700' },
  placeName: { ...typography.h3, color: colors.black },
  address: { ...typography.small, color: colors.gray, marginTop: 2, marginBottom: spacing.xs },
  note: { ...typography.small, color: colors.gray, marginTop: spacing.xs, lineHeight: 17 },
  empty: { alignItems: 'center', marginTop: spacing.xl, gap: spacing.sm },
  emptyText: { color: colors.gray },
});

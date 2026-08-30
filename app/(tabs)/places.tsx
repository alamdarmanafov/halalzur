import { useEffect, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  getPlacesByCategory,
  submitPlace,
  Place,
  PLACE_CATEGORY_LABEL,
  PLACE_CATEGORY_ICON,
  PlaceCategory,
} from '../../lib/places';
import { useAuth } from '../../lib/auth-context';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/Button';
import { BrandModal } from '../../components/BrandModal';
import { sendPushNotification } from '../../lib/pushNotify';
import { colors, radius, spacing, typography } from '../../constants/theme';

const SUBMIT_CATEGORIES: PlaceCategory[] = ['restoran', 'kafe', 'coffee_shop'];

const FILTERS: { key: PlaceCategory | 'hamısı'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'hamısı', label: 'Hamısı', icon: 'apps-outline' },
  { key: 'restoran', label: PLACE_CATEGORY_LABEL.restoran, icon: PLACE_CATEGORY_ICON.restoran as any },
  { key: 'kafe', label: PLACE_CATEGORY_LABEL.kafe, icon: PLACE_CATEGORY_ICON.kafe as any },
  { key: 'coffee_shop', label: PLACE_CATEGORY_LABEL.coffee_shop, icon: PLACE_CATEGORY_ICON.coffee_shop as any },
];

export default function PlacesScreen() {
  const { user } = useAuth();
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
      Alert.alert('Doldurun', 'Məkanın adı və ünvanı tələb olunur.');
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
      sendPushNotification(user.id, 'Məkan təklifi göndərildi ✅', `"${submittedName}" baxılmaq üçün göndərildi.`);
    } catch (err: any) {
      Alert.alert('Göndərilmədi', err.message ?? 'Xəta baş verdi, yenidən cəhd edin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Məkanlar</Text>
          <Text style={styles.subtitle}>Halal sertifikatlı restoran, kafe və coffee shop-lar</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => setFormVisible(true)}>
          <Ionicons name="add" size={22} color={colors.white} />
        </Pressable>
      </View>

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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
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

      <Modal visible={formVisible} animationType="slide" transparent onRequestClose={() => setFormVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Məkan təklif et</Text>
              <Pressable onPress={() => setFormVisible(false)}>
                <Ionicons name="close" size={22} color={colors.gray} />
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              <TextInput
                value={formName}
                onChangeText={setFormName}
                placeholder="Məkanın adı"
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
                      {PLACE_CATEGORY_LABEL[c]}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                value={formAddress}
                onChangeText={setFormAddress}
                placeholder="Ünvan"
                placeholderTextColor={colors.gray}
                style={styles.input}
              />
              <TextInput
                value={formNote}
                onChangeText={setFormNote}
                placeholder="Qeyd (istəyə bağlı)"
                placeholderTextColor={colors.gray}
                multiline
                style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
              />
              <Text style={styles.formHint}>
                Təklifiniz admin tərəfindən baxılıb təsdiqlənəndən sonra Məkanlar siyahısında görünəcək.
              </Text>
              <Button
                title={submitting ? 'Göndərilir…' : 'Göndər'}
                onPress={handleSubmitPlace}
                loading={submitting}
                style={{ marginTop: spacing.sm, marginBottom: spacing.lg }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <BrandModal
        visible={submittedNotice}
        title="Təşəkkürlər!"
        body="Məkan təklifiniz göndərildi — admin baxıb təsdiqləyəndən sonra siyahıda görünəcək."
        ctaLabel="Əla"
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

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useIAP, ErrorCode } from 'react-native-iap';
import { Logo } from '../components/Logo';
import { Button } from '../components/Button';
import { PremiumSuccessOverlay } from '../components/PremiumSuccessOverlay';
import { useAuth } from '../lib/auth-context';
import { sendPushNotification } from '../lib/pushNotify';
import { maybeRequestReview } from '../lib/reviewPrompt';
import { colors, radius, spacing, typography } from '../constants/theme';

/**
 * Real Apple StoreKit purchases via react-native-iap — Apple collects
 * payment and pays out to the developer's bank account (set up in App
 * Store Connect → Agreements, Tax, and Banking); there's no separate
 * "route the money" step on our side.
 *
 * These product IDs must exist in App Store Connect → Subscriptions,
 * in the same subscription group, with prices set there (the USD prices
 * below are just the UI fallback shown before the real StoreKit product
 * loads — App Store Connect is the source of truth once connected).
 * Priced in USD rather than AZN because Azerbaijani Manat isn't one of
 * App Store Connect's storefront currencies.
 *
 * NOTE: react-native-iap is native code — it needs an EAS dev-client or
 * TestFlight/production build. It will not work inside plain Expo Go.
 *
 * NOTE: purchases are finished here without server-side receipt
 * verification (no backend exists yet). That's fine for early testing,
 * but before real launch, verify receipts server-side (Apple's App
 * Store Server API, or a service like RevenueCat) — otherwise a
 * tampered/replayed receipt could unlock Premium for free.
 */
const PLANS = {
  monthly: {
    id: 'com.halalzur.app.premium.monthly',
    label: 'Aylıq',
    price: '$2.99',
    period: 'ay',
  },
  sixMonth: {
    id: 'com.halalzur.app.premium.sixmonth',
    label: '6 Aylıq',
    price: '$9.99',
    period: '6 ay',
    badge: '44% qənaət',
  },
  yearly: {
    id: 'com.halalzur.app.premium.yearly',
    label: 'İllik',
    price: '$19.99',
    period: 'il',
    badge: 'Ən sərfəli',
  },
} as const;

const PLAN_SKUS = Object.values(PLANS).map((p) => p.id);

/**
 * The 4 real Premium features — deliberately just these 4, per spec.
 * Halal/certificate status is never gated (app/product/[id].tsx always
 * shows it to every user); history, favorites, and ad-removal are
 * explicitly NOT premium differentiators here.
 */
const FEATURES = [
  { icon: 'infinite-outline', label: 'Limitsiz Scan' },
  { icon: 'flask-outline', label: 'Deep Ingredient Check' },
  { icon: 'leaf-outline', label: 'Halal Alternatives' },
  { icon: 'cart-outline', label: 'Shopping Scan' },
] as const;

export default function SubscriptionScreen() {
  const { user, setPlan } = useAuth();
  const [selected, setSelected] = useState<keyof typeof PLANS>('yearly');
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [iapError, setIapError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    connected,
    subscriptions,
    fetchProducts,
    requestPurchase,
    finishTransaction,
    restorePurchases: restorePurchasesIAP,
    getActiveSubscriptions,
  } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      try {
        await finishTransaction({ purchase, isConsumable: false });
        await setPlan('premium');
        setShowSuccess(true);
        if (user) {
          sendPushNotification(
            user.id,
            'Premium aktivləşdi! 💎',
            'İndi limitsiz skan və tam tarixçədən istifadə edə bilərsiniz.',
            { route: '/(tabs)/profile' }
          );
          maybeRequestReview();
        }
      } finally {
        setPurchasing(false);
      }
    },
    onPurchaseError: (error) => {
      setPurchasing(false);
      if (error.code === ErrorCode.UserCancelled) return;
      Alert.alert('Alış tamamlanmadı', error.message);
    },
    onError: (error) => {
      setIapError(error.message);
    },
  });

  useEffect(() => {
    if (connected) {
      fetchProducts({ skus: PLAN_SKUS, type: 'subs' }).catch((err) => setIapError(err.message));
    }
  }, [connected, fetchProducts]);

  const priceFor = (key: keyof typeof PLANS) => {
    const live = subscriptions.find((s) => s.id === PLANS[key].id);
    return live?.displayPrice ?? PLANS[key].price;
  };

  const purchasePremium = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Dəstəklənmir', 'Premium hazırda yalnız iOS-da əlçatandır.');
      return;
    }
    setPurchasing(true);
    try {
      await requestPurchase({ request: { apple: { sku: PLANS[selected].id } }, type: 'subs' });
      // result lands in onPurchaseSuccess / onPurchaseError above
    } catch (err: any) {
      setPurchasing(false);
      Alert.alert(
        'StoreKit əlçatan deyil',
        'Bu, real cihazda (EAS build və ya TestFlight) işləyir — Expo Go-da native ödəniş modulu yoxdur.'
      );
    }
  };

  const restorePurchases = async () => {
    setRestoring(true);
    try {
      await restorePurchasesIAP();
      const active = await getActiveSubscriptions(PLAN_SKUS);
      if (active.length > 0) {
        await setPlan('premium');
        Alert.alert('Bərpa edildi', 'Premium abunəliyiniz tapıldı və aktivləşdirildi.');
        router.back();
      } else {
        Alert.alert('Tapılmadı', 'Aktiv Premium abunəlik tapılmadı.');
      }
    } catch (err: any) {
      Alert.alert('Bərpa alınmadı', err.message ?? 'Xəta baş verdi, yenidən cəhd edin.');
    } finally {
      setRestoring(false);
    }
  };

  if (user?.plan === 'premium') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
          <Text style={styles.title}>Siz artıq Premium üzvsünüz</Text>
          <Button title="Bağla" onPress={() => router.back()} style={{ marginTop: spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Pressable style={styles.closeBtn} onPress={() => router.back()}>
        <Ionicons name="close" size={26} color={colors.gray} />
      </Pressable>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Logo size={64} />
          <Text style={styles.heroTitle}>Daha çox yoxla.{'\n'}Daha ağıllı seçim et.</Text>
        </View>

        <View style={styles.table}>
          {FEATURES.map((f) => (
            <View key={f.icon} style={styles.tableRow}>
              <View style={styles.featureIconWrap}>
                <Ionicons name={f.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.primaryDark} />
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.planRow}>
          {(Object.entries(PLANS) as [keyof typeof PLANS, (typeof PLANS)[keyof typeof PLANS]][]).map(
            ([key, plan]) => {
              const isSelected = selected === key;
              return (
                <Pressable
                  key={key}
                  style={[styles.planOption, isSelected && styles.planOptionSelected]}
                  onPress={() => setSelected(key)}
                >
                  {'badge' in plan && plan.badge && (
                    <View style={styles.planBadge}>
                      <Text style={styles.planBadgeText}>{plan.badge}</Text>
                    </View>
                  )}
                  <Text style={styles.planPeriod}>{plan.label}</Text>
                  <Text style={styles.planPrice}>{priceFor(key)}</Text>
                  <Text style={styles.planPer}>/ {plan.period}</Text>
                </Pressable>
              );
            }
          )}
        </View>

        <Button
          title={purchasing ? 'Aktivləşdirilir…' : `Premium-a keç · ${priceFor(selected)}`}
          onPress={purchasePremium}
          loading={purchasing}
          style={{ marginTop: spacing.lg }}
        />

        <Pressable onPress={restorePurchases} style={{ marginTop: spacing.md }} disabled={restoring}>
          <Text style={styles.restoreText}>{restoring ? 'Bərpa edilir…' : 'Alışları bərpa et'}</Text>
        </Pressable>

        {iapError && Platform.OS === 'ios' && (
          <Text style={styles.iapNotice}>
            StoreKit-ə qoşulmadı — bu, Expo Go-da gözlənilən haldır. Real qiymətlər üçün EAS build/TestFlight
            lazımdır.
          </Text>
        )}

        <Text style={styles.legal}>
          Abunəlik App Store hesabınızdan tutulur və dövr bitməzdən 24 saat əvvəl ləğv edilmədiyi
          təqdirdə avtomatik yenilənir. Abunəliyi App Store → Ayarlar bölməsindən istənilən vaxt idarə
          edə və ya ləğv edə bilərsiniz.
        </Text>
        <View style={styles.legalLinks}>
          <Pressable onPress={() => Linking.openURL('https://halalzur.app/terms')}>
            <Text style={styles.legalLink}>İstifadə şərtləri</Text>
          </Pressable>
          <Text style={styles.legalDot}>·</Text>
          <Pressable onPress={() => Linking.openURL('https://halalzur.app/privacy')}>
            <Text style={styles.legalLink}>Məxfilik siyasəti</Text>
          </Pressable>
        </View>
      </ScrollView>

      <PremiumSuccessOverlay
        visible={showSuccess}
        onDone={() => {
          setShowSuccess(false);
          router.back();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, paddingHorizontal: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  closeBtn: { alignSelf: 'flex-end', padding: spacing.sm, marginTop: spacing.sm },
  hero: { alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.lg },
  heroTitle: { ...typography.h1, color: colors.primaryDark, marginTop: spacing.md, textAlign: 'center' },
  title: { ...typography.h2, color: colors.primaryDark, marginTop: spacing.md, textAlign: 'center' },
  table: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: { ...typography.body, color: colors.black, fontWeight: '700', flexShrink: 1 },
  planRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.lg },
  planOption: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.grayLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
  },
  planOptionSelected: { borderColor: colors.primary, backgroundColor: colors.surface },
  planBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  planBadgeText: { fontSize: 9, fontWeight: '800', color: colors.primaryDark },
  planPeriod: { ...typography.small, fontSize: 12, color: colors.gray, fontWeight: '700', marginTop: spacing.xs },
  planPrice: { ...typography.h3, color: colors.primaryDark, marginTop: 4 },
  planPer: { fontSize: 11, color: colors.gray },
  restoreText: { textAlign: 'center', color: colors.primary, fontWeight: '600' },
  iapNotice: {
    ...typography.small,
    color: colors.warning,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 18,
  },
  legal: { ...typography.small, color: colors.gray, textAlign: 'center', marginTop: spacing.lg, lineHeight: 18 },
  legalLinks: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.sm },
  legalLink: { ...typography.small, color: colors.primary, fontWeight: '600' },
  legalDot: { color: colors.grayLight },
});

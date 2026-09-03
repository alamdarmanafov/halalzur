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
import { useLanguage } from '../lib/i18n-context';
import { TranslationKey } from '../lib/i18n';
import { sendPushNotification } from '../lib/pushNotify';
import { logPurchaseEvent } from '../lib/purchaseTracking';
import { verifyApplePurchase } from '../lib/purchaseVerification';
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
 * Purchases are verified server-side (admin-panel/api/verify-purchase.js
 * calls Apple's App Store Server API) before Premium is granted — see
 * that file's header comment. finishTransaction() alone never grants
 * anything locally; onPurchaseSuccess only shows success and calls
 * refreshPlan() after the server confirms the transaction.
 */
const PLANS = {
  monthly: {
    id: 'com.halalzur.app.premium.monthly',
    labelKey: 'subPlanMonthly',
    price: '$2.99',
    usdAmount: 2.99,
    periodKey: 'subPeriodMonth',
  },
  sixMonth: {
    id: 'com.halalzur.app.premium.sixmonth',
    labelKey: 'subPlanSixMonth',
    price: '$9.99',
    usdAmount: 9.99,
    periodKey: 'subPeriodSixMonths',
    badgeKey: 'subBadgeSixMonthSavings',
  },
  yearly: {
    id: 'com.halalzur.app.premium.yearly',
    labelKey: 'subPlanYearly',
    price: '$19.99',
    usdAmount: 19.99,
    periodKey: 'subPeriodYear',
    badgeKey: 'subBadgeYearlyBest',
  },
} as const satisfies Record<
  string,
  {
    id: string;
    labelKey: TranslationKey;
    price: string;
    usdAmount: number;
    periodKey: TranslationKey;
    badgeKey?: TranslationKey;
  }
>;

const PLAN_SKUS = Object.values(PLANS).map((p) => p.id);

/**
 * The 4 real Premium features — deliberately just these 4, per spec.
 * Halal/certificate status is never gated (app/product/[id].tsx always
 * shows it to every user); history, favorites, and ad-removal are
 * explicitly NOT premium differentiators here.
 */
const FEATURES: { icon: string; label?: string; labelKey?: TranslationKey }[] = [
  { icon: 'infinite-outline', labelKey: 'subFeatureUnlimitedScan' },
  { icon: 'flask-outline', labelKey: 'subFeatureDeepIngredientCheck' },
  { icon: 'leaf-outline', labelKey: 'subFeatureHalalAlternatives' },
  { icon: 'cart-outline', labelKey: 'subFeatureShoppingScan' },
];

export default function SubscriptionScreen() {
  const { user, refreshPlan } = useAuth();
  const { t } = useLanguage();
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
        if (!user) return;
        // finishTransaction() only tells StoreKit the app is done with the
        // transaction locally — it's not proof of purchase. Premium is
        // granted server-side only after Apple's own API confirms this
        // transaction id (see lib/purchaseVerification.ts).
        const verified = purchase.transactionId
          ? await verifyApplePurchase(user.id, purchase.transactionId, PLANS[selected].id)
          : false;
        if (!verified) {
          Alert.alert(t('subPurchaseFailedTitle'), t('subVerificationFailedBody'));
          return;
        }
        await refreshPlan();
        setShowSuccess(true);
        logPurchaseEvent(user.id, PLANS[selected].id, PLANS[selected].usdAmount);
        sendPushNotification(
          user.id,
          t('subPremiumActivatedPushTitle'),
          t('subPremiumActivatedPushBody'),
          { route: '/(tabs)/profile' }
        );
        maybeRequestReview();
      } finally {
        setPurchasing(false);
      }
    },
    onPurchaseError: (error) => {
      setPurchasing(false);
      if (error.code === ErrorCode.UserCancelled) return;
      Alert.alert(t('subPurchaseFailedTitle'), error.message);
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

  /**
   * Both driven entirely by App Store Connect config, not app code: a
   * free trial is an "introductory offer" set on the subscription
   * product there, and family sharing is a checkbox on that same
   * product (Apple's own Family Sharing group — not a separate plan/
   * price tier). react-native-iap just reflects whatever's configured.
   */
  const trialLabelFor = (key: keyof typeof PLANS): string | null => {
    const live = subscriptions.find((s) => s.id === PLANS[key].id);
    if (!live || live.platform !== 'ios' || live.introductoryPricePaymentModeIOS !== 'free-trial') return null;
    const n = live.introductoryPriceNumberOfPeriodsIOS;
    const unit = live.introductoryPriceSubscriptionPeriodIOS;
    return n && unit ? `${n} ${unit} ${t('subFreeTrialSuffix')}` : t('subFreeTrialGeneric');
  };
  const isFamilyShareable = subscriptions.some((s) => s.platform === 'ios' && s.isFamilyShareableIOS);

  const purchasePremium = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert(t('subNotSupportedTitle'), t('subNotSupportedBody'));
      return;
    }
    setPurchasing(true);
    try {
      await requestPurchase({ request: { apple: { sku: PLANS[selected].id } }, type: 'subs' });
      // result lands in onPurchaseSuccess / onPurchaseError above
    } catch (err: any) {
      setPurchasing(false);
      Alert.alert(t('subStoreKitUnavailableTitle'), t('subStoreKitUnavailableBody'));
    }
  };

  const restorePurchases = async () => {
    setRestoring(true);
    try {
      await restorePurchasesIAP();
      const active = await getActiveSubscriptions(PLAN_SKUS);
      // Same server-verification requirement as a fresh purchase — a
      // locally-reported "active subscription" isn't granted until Apple's
      // API confirms that specific transaction (see onPurchaseSuccess).
      const verified = user && active.length > 0
        ? await verifyApplePurchase(user.id, active[0].transactionId, active[0].productId)
        : false;
      if (verified) {
        await refreshPlan();
        Alert.alert(t('subRestoredTitle'), t('subRestoredBody'));
        router.back();
      } else {
        Alert.alert(t('subNotFoundTitle'), t('subNotFoundBody'));
      }
    } catch (err: any) {
      Alert.alert(t('subRestoreFailedTitle'), err.message ?? t('subRestoreFailedBody'));
    } finally {
      setRestoring(false);
    }
  };

  if (user?.plan === 'premium') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
          <Text style={styles.title}>{t('subAlreadyPremium')}</Text>
          <Button title={t('subClose')} onPress={() => router.back()} style={{ marginTop: spacing.lg }} />
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
          <Text style={styles.heroTitle}>{t('subHeroTitle')}</Text>
        </View>

        <View style={styles.table}>
          {FEATURES.map((f) => (
            <View key={f.icon} style={styles.tableRow}>
              <View style={styles.featureIconWrap}>
                <Ionicons name={f.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.primaryDark} />
              </View>
              <Text style={styles.featureLabel}>{f.labelKey ? t(f.labelKey) : f.label}</Text>
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
                  {'badgeKey' in plan && plan.badgeKey && (
                    <View style={styles.planBadge}>
                      <Text style={styles.planBadgeText}>{t(plan.badgeKey)}</Text>
                    </View>
                  )}
                  <Text style={styles.planPeriod}>{t(plan.labelKey)}</Text>
                  <Text style={styles.planPrice}>{priceFor(key)}</Text>
                  <Text style={styles.planPer}>/ {t(plan.periodKey)}</Text>
                  {trialLabelFor(key) && <Text style={styles.planTrial}>{trialLabelFor(key)}</Text>}
                </Pressable>
              );
            }
          )}
        </View>

        <Button
          title={purchasing ? t('subActivating') : `${t('subUpgradeTo')} ${priceFor(selected)}`}
          onPress={purchasePremium}
          loading={purchasing}
          style={{ marginTop: spacing.lg }}
        />

        <Pressable onPress={restorePurchases} style={{ marginTop: spacing.md }} disabled={restoring}>
          <Text style={styles.restoreText}>{restoring ? t('subRestoring') : t('subRestorePurchases')}</Text>
        </Pressable>

        {isFamilyShareable && (
          <View style={styles.familyRow}>
            <Ionicons name="people-outline" size={16} color={colors.gray} />
            <Text style={styles.familyText}>{t('subFamilySharingNote')}</Text>
          </View>
        )}

        {iapError && Platform.OS === 'ios' && <Text style={styles.iapNotice}>{t('subIapNotice')}</Text>}

        <Text style={styles.legal}>{t('subLegal')}</Text>
        <View style={styles.legalLinks}>
          <Pressable onPress={() => Linking.openURL('https://halalzur.com/terms.html')}>
            <Text style={styles.legalLink}>{t('subTerms')}</Text>
          </Pressable>
          <Text style={styles.legalDot}>·</Text>
          <Pressable onPress={() => Linking.openURL('https://halalzur.com/privacy.html')}>
            <Text style={styles.legalLink}>{t('subPrivacy')}</Text>
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
  planTrial: { fontSize: 10.5, color: colors.primary, fontWeight: '700', marginTop: 4, textAlign: 'center' },
  restoreText: { textAlign: 'center', color: colors.primary, fontWeight: '600' },
  familyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  familyText: { fontSize: 12, color: colors.gray },
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

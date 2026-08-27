import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Logo } from '../components/Logo';
import { Button } from '../components/Button';
import { useAuth } from '../lib/auth-context';
import { colors, radius, spacing, typography } from '../constants/theme';

/**
 * iOS subscriptions must go through StoreKit / In-App Purchase — Apple Pay
 * is not permitted for unlocking digital content inside an app (App Store
 * Review Guideline 3.1.1). Wire this up with `react-native-purchases`
 * (RevenueCat) or `expo-in-app-purchases`, using product IDs configured in
 * App Store Connect, e.g.:
 *   com.halalzur.app.premium.monthly
 *   com.halalzur.app.premium.sixmonth
 *   com.halalzur.app.premium.yearly
 * `purchasePremium()` below is a placeholder for that call.
 */
const PLANS = {
  monthly: {
    id: 'com.halalzur.app.premium.monthly',
    label: 'Aylıq',
    price: '4.99 AZN',
    period: 'ay',
  },
  sixMonth: {
    id: 'com.halalzur.app.premium.sixmonth',
    label: '6 Aylıq',
    price: '19.99 AZN',
    period: '6 ay',
    badge: '33% qənaət',
  },
  yearly: {
    id: 'com.halalzur.app.premium.yearly',
    label: 'İllik',
    price: '39.99 AZN',
    period: 'il',
    badge: 'Ən sərfəli',
  },
} as const;

const FEATURES = [
  { icon: 'infinite-outline', free: '3 skan / ay', premium: 'Limitsiz skan' },
  { icon: 'document-text-outline', free: 'Əsas nəticə', premium: 'Tam sertifikat detalları' },
  { icon: 'time-outline', free: '10 tarixçə', premium: 'Limitsiz tarixçə' },
  { icon: 'notifications-outline', free: '—', premium: 'Geri çağırma bildirişləri' },
  { icon: 'shield-checkmark-outline', free: 'Standart', premium: 'Prioritet sertifikat yoxlaması' },
] as const;

export default function SubscriptionScreen() {
  const { user, setPlan } = useAuth();
  const [selected, setSelected] = useState<keyof typeof PLANS>('yearly');
  const [purchasing, setPurchasing] = useState(false);

  const purchasePremium = async () => {
    setPurchasing(true);
    try {
      // TODO: replace with real StoreKit purchase (RevenueCat / expo-in-app-purchases)
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await setPlan('premium');
      Alert.alert('Təbriklər!', 'Premium abunəlik aktivləşdi.');
      router.back();
    } finally {
      setPurchasing(false);
    }
  };

  const restorePurchases = async () => {
    // TODO: replace with real restore call from the IAP SDK
    Alert.alert('Bərpa edilir', 'Əvvəlki alışlarınız yoxlanılır…');
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
          <Text style={styles.heroTitle}>Halalzur Premium</Text>
          <Text style={styles.heroSubtitle}>Limitsiz skan, tam sertifikat şəffaflığı</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <View style={{ flex: 1.4 }} />
            <Text style={[styles.colHeader, { flex: 1 }]}>Pulsuz</Text>
            <Text style={[styles.colHeader, styles.colHeaderPremium, { flex: 1 }]}>Premium</Text>
          </View>
          {FEATURES.map((f) => (
            <View key={f.icon} style={styles.tableRow}>
              <View style={[styles.featureCell, { flex: 1.4 }]}>
                <Ionicons name={f.icon as keyof typeof Ionicons.glyphMap} size={16} color={colors.primaryDark} />
                <Text style={styles.featureLabel} numberOfLines={2}>
                  {f.premium}
                </Text>
              </View>
              <Text style={[styles.cell, { flex: 1 }]}>{f.free}</Text>
              <Text style={[styles.cell, styles.cellPremium, { flex: 1 }]}>{f.premium}</Text>
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
                  <Text style={styles.planPrice}>{plan.price}</Text>
                  <Text style={styles.planPer}>/ {plan.period}</Text>
                </Pressable>
              );
            }
          )}
        </View>

        <Button
          title={purchasing ? 'Aktivləşdirilir…' : `Premium-a keç · ${PLANS[selected].price}`}
          onPress={purchasePremium}
          loading={purchasing}
          style={{ marginTop: spacing.lg }}
        />

        <Pressable onPress={restorePurchases} style={{ marginTop: spacing.md }}>
          <Text style={styles.restoreText}>Alışları bərpa et</Text>
        </Pressable>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, paddingHorizontal: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  closeBtn: { alignSelf: 'flex-end', padding: spacing.sm, marginTop: spacing.sm },
  hero: { alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.lg },
  heroTitle: { ...typography.h1, color: colors.primaryDark, marginTop: spacing.sm },
  heroSubtitle: { ...typography.body, color: colors.gray, marginTop: 4, textAlign: 'center' },
  title: { ...typography.h2, color: colors.primaryDark, marginTop: spacing.md, textAlign: 'center' },
  table: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md },
  tableHeaderRow: { flexDirection: 'row', marginBottom: spacing.sm },
  colHeader: { ...typography.small, color: colors.gray, fontWeight: '700', textAlign: 'center' },
  colHeaderPremium: { color: colors.primaryDark },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(10,77,46,0.08)',
  },
  featureCell: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  featureLabel: { ...typography.small, color: colors.black, flexShrink: 1 },
  cell: { ...typography.small, color: colors.gray, textAlign: 'center' },
  cellPremium: { color: colors.primaryDark, fontWeight: '700' },
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
  legal: { ...typography.small, color: colors.gray, textAlign: 'center', marginTop: spacing.lg, lineHeight: 18 },
  legalLinks: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.sm },
  legalLink: { ...typography.small, color: colors.primary, fontWeight: '600' },
  legalDot: { color: colors.grayLight },
});

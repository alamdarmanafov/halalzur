import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../lib/i18n-context';
import { colors, radius, spacing, typography } from '../../constants/theme';

export function CheckIllustration() {
  const { t } = useLanguage();
  const FIELDS: [string, string][] = [
    [t('illustrationStatus'), 'Halal'],
    [t('illustrationCertificate'), 'HS123456'],
    [t('illustrationSource'), 'GIMDES'],
    [t('illustrationCountry'), t('illustrationCountryValue')],
    [t('illustrationDate'), '24.05.2026'],
  ];
  return (
    <View style={styles.wrap}>
      <View style={styles.shieldWrap}>
        <Ionicons name="shield-checkmark" size={110} color={colors.surface} />
        <Ionicons name="checkmark" size={44} color={colors.primary} style={styles.shieldCheck} />
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="arrow-back" size={14} color={colors.gray} />
          <Text style={styles.cardHeaderText}>{t('illustrationProductInfo')}</Text>
        </View>

        <View style={styles.productRow}>
          <View style={styles.productThumb}>
            <Ionicons name="nutrition-outline" size={18} color={colors.primaryDark} />
          </View>
          <Text style={styles.productName} numberOfLines={1}>
            {t('illustrationProductName')}
          </Text>
          <View style={styles.verifiedPill}>
            <Ionicons name="checkmark-circle" size={11} color={colors.primaryDark} />
            <Text style={styles.verifiedText}>HALAL</Text>
          </View>
        </View>

        {FIELDS.map(([label, value]) => (
          <View key={label} style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <Text style={styles.fieldValue}>{value}</Text>
          </View>
        ))}

        <View style={styles.moreRow}>
          <Text style={styles.moreText}>{t('illustrationMoreInfo')}</Text>
          <Ionicons name="chevron-forward" size={13} color={colors.primary} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 240, height: 260, alignItems: 'center', justifyContent: 'center' },
  shieldWrap: { position: 'absolute', left: 6, top: 60, alignItems: 'center', justifyContent: 'center' },
  shieldCheck: { position: 'absolute' },
  card: {
    width: 190,
    marginLeft: 46,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  cardHeaderText: { fontSize: 11, fontWeight: '700', color: colors.gray },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  productThumb: { width: 30, height: 30, borderRadius: 8, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  productName: { flex: 1, fontWeight: '700', fontSize: 12.5, color: colors.black },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  verifiedText: { fontSize: 8.5, fontWeight: '800', color: colors.primaryDark },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  fieldLabel: { fontSize: 10.5, color: colors.gray },
  fieldValue: { fontSize: 10.5, color: colors.black, fontWeight: '600' },
  moreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  moreText: { fontSize: 10.5, fontWeight: '700', color: colors.primaryDark },
});

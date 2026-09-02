import { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HalalStatus } from '../lib/types';
import { STATUS_LABEL_KEY } from '../lib/certification';
import { useLanguage } from '../lib/i18n-context';
import { Logo } from './Logo';
import { colors, radius, spacing, typography } from '../constants/theme';

// Darker, opaque tints of StatusBadge's palette — the badge's own pale
// tints read fine on a white screen background but wash out once this
// becomes a standalone shared image with no surrounding chrome.
const CARD_STYLE: Record<HalalStatus, { bg: string; icon: string }> = {
  halal: { bg: colors.primaryDark, icon: '✓' },
  haram: { bg: '#7A1F1F', icon: '!' },
  mushbooh: { bg: '#8A6416', icon: '⚠' },
  unknown: { bg: '#8A6416', icon: '⚠' },
};

type Props = {
  productName: string;
  brand: string;
  status: HalalStatus;
};

/**
 * Rendered off-screen (see product/[id].tsx) and captured with
 * react-native-view-shot for the "share as image" action — not meant to
 * be shown on screen directly, so it carries its own fixed size/colors
 * instead of adapting to the surrounding layout.
 */
export const ShareResultCard = forwardRef<View, Props>(function ShareResultCard(
  { productName, brand, status },
  ref
) {
  const { t } = useLanguage();
  const s = CARD_STYLE[status];
  return (
    <View ref={ref} collapsable={false} style={[styles.card, { backgroundColor: s.bg }]}>
      <View style={styles.badge}>
        <Text style={styles.badgeIcon}>{s.icon}</Text>
        <Text style={styles.badgeLabel}>{t(STATUS_LABEL_KEY[status])}</Text>
      </View>
      <Text style={styles.name} numberOfLines={3}>
        {productName}
      </Text>
      <Text style={styles.brand} numberOfLines={1}>
        {brand}
      </Text>
      <View style={styles.footer}>
        <Logo size={28} />
        <Text style={styles.footerText}>Halalzur</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: 320,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  badgeIcon: { fontSize: 16, fontWeight: '800', color: colors.white },
  badgeLabel: { fontSize: 14, fontWeight: '800', color: colors.white },
  name: { ...typography.h2, color: colors.white, textAlign: 'center', marginBottom: spacing.xs },
  brand: { ...typography.body, color: colors.white, opacity: 0.85, marginBottom: spacing.lg, textAlign: 'center' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
  footerText: { ...typography.h3, color: colors.white },
});

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

// 360x640 — a 9:16 (Instagram/TikTok Story) rectangle at exactly 1/3 of
// 1080x1920. product/[id].tsx's captureRef call asks for a 1080x1920
// output explicitly, so this ratio is what keeps that resize from
// stretching the card.
const CARD_WIDTH = 360;
const CARD_HEIGHT = 640;

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
      <View style={styles.header}>
        <Logo size={36} />
        <Text style={styles.headerText}>Halalzur</Text>
      </View>

      <View style={styles.center}>
        <View style={styles.badge}>
          <Text style={styles.badgeIcon}>{s.icon}</Text>
          <Text style={styles.badgeLabel}>{t(STATUS_LABEL_KEY[status])}</Text>
        </View>
        <Text style={styles.name} numberOfLines={4}>
          {productName}
        </Text>
        <Text style={styles.brand} numberOfLines={1}>
          {brand}
        </Text>
      </View>

      <View style={styles.footer}>
        <Logo size={48} />
        <Text style={styles.footerText}>Halalzur</Text>
        <Text style={styles.footerTagline}>{t('shareCardTagline')}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
  },
  headerText: { ...typography.h3, color: colors.white, opacity: 0.9 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    marginBottom: spacing.lg,
  },
  badgeIcon: { fontSize: 22, fontWeight: '800', color: colors.white },
  badgeLabel: { fontSize: 18, fontWeight: '800', color: colors.white },
  name: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  brand: { ...typography.h3, color: colors.white, opacity: 0.85, textAlign: 'center' },
  footer: { alignItems: 'center', gap: spacing.xs },
  footerText: { fontSize: 22, fontWeight: '800', color: colors.white },
  footerTagline: { ...typography.small, color: colors.white, opacity: 0.75 },
});

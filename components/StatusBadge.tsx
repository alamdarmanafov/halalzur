import { View, Text, StyleSheet } from 'react-native';
import { HalalStatus } from '../lib/types';
import { STATUS_LABEL_KEY } from '../lib/certification';
import { useLanguage } from '../lib/i18n-context';
import { radius, spacing, typography, ThemeColors } from '../constants/theme';
import { useTheme } from '../lib/theme-context';

// unknown intentionally shares mushbooh's yellow "not enough confirmed data"
// treatment — "şübhəli" and "məsləhət görülmür" are different claims, so
// only a confirmed (or well-founded) non-compliance goes red.
// Light-mode backgrounds are fixed pastel tints; dark mode instead tints
// each badge's own (brighter) foreground color at low opacity, since a
// bright fg on a pale-light bg would be unreadable once the theme flips.
const makeStatusStyle = (
  colors: ThemeColors,
  isDark: boolean
): Record<HalalStatus, { bg: string; fg: string; icon: string }> => ({
  halal: { bg: isDark ? 'rgba(52,211,153,0.16)' : '#E8F7ED', fg: colors.primaryDark, icon: '✓' },
  haram: { bg: isDark ? 'rgba(255,107,107,0.16)' : '#FBE9E9', fg: colors.danger, icon: '!' },
  mushbooh: { bg: isDark ? 'rgba(251,191,36,0.16)' : '#FBF3DF', fg: colors.warning, icon: '⚠' },
  unknown: { bg: isDark ? 'rgba(251,191,36,0.16)' : '#FBF3DF', fg: colors.warning, icon: '⚠' },
});

export function StatusBadge({ status, size = 'md' }: { status: HalalStatus; size?: 'sm' | 'md' }) {
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const STATUS_STYLE = makeStatusStyle(colors, isDark);
  const s = STATUS_STYLE[status];
  const small = size === 'sm';
  const label = t(STATUS_LABEL_KEY[status]);
  return (
    <View
      style={[styles.badge, { backgroundColor: s.bg, paddingVertical: small ? 3 : 6 }]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <Text style={[styles.icon, { color: s.fg, fontSize: small ? 11 : 13 }]} importantForAccessibility="no">
        {s.icon}
      </Text>
      <Text style={[styles.label, { color: s.fg, fontSize: small ? 11 : typography.small.fontSize }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  icon: { fontWeight: '800' },
  label: { fontWeight: '700' },
});

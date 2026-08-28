import { View, Text, StyleSheet } from 'react-native';
import { HalalStatus } from '../lib/types';
import { statusLabel } from '../lib/certification';
import { colors, radius, spacing, typography } from '../constants/theme';

// unknown intentionally shares mushbooh's yellow "not enough confirmed data"
// treatment — "şübhəli" and "məsləhət görülmür" are different claims, so
// only a confirmed (or well-founded) non-compliance goes red.
const STATUS_STYLE: Record<HalalStatus, { bg: string; fg: string; icon: string }> = {
  halal: { bg: '#E8F7ED', fg: colors.primaryDark, icon: '✓' },
  haram: { bg: '#FBE9E9', fg: colors.danger, icon: '!' },
  mushbooh: { bg: '#FBF3DF', fg: colors.warning, icon: '⚠' },
  unknown: { bg: '#FBF3DF', fg: colors.warning, icon: '⚠' },
};

export function StatusBadge({ status, size = 'md' }: { status: HalalStatus; size?: 'sm' | 'md' }) {
  const s = STATUS_STYLE[status];
  const small = size === 'sm';
  return (
    <View style={[styles.badge, { backgroundColor: s.bg, paddingVertical: small ? 3 : 6 }]}>
      <Text style={[styles.icon, { color: s.fg, fontSize: small ? 11 : 13 }]}>{s.icon}</Text>
      <Text style={[styles.label, { color: s.fg, fontSize: small ? 11 : typography.small.fontSize }]}>
        {statusLabel[status]}
      </Text>
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

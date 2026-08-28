import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from '../Logo';
import { colors, radius, spacing, typography } from '../../constants/theme';

const PINS = [
  { top: 18, left: 34 },
  { top: 44, left: 150 },
  { top: 96, left: 26 },
  { top: 112, left: 168 },
];

export function TrustIllustration() {
  return (
    <View style={styles.wrap}>
      <View style={styles.globeDisc}>
        <Ionicons name="earth-outline" size={130} color={colors.primary} style={{ opacity: 0.35 }} />
        {PINS.map((pin, i) => (
          <Ionicons
            key={i}
            name="location"
            size={16}
            color={colors.primaryDark}
            style={[styles.pin, { top: pin.top, left: pin.left }]}
          />
        ))}
      </View>

      <View style={styles.bagBadge}>
        <Logo size={40} />
      </View>

      <View style={styles.trustBubble}>
        <Ionicons name="people" size={16} color={colors.primaryDark} />
        <Text style={styles.trustText}>Minlərlə istifadəçi{'\n'}etibar edir</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 220, height: 260, alignItems: 'center', justifyContent: 'center' },
  globeDisc: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: { position: 'absolute' },
  bagBadge: {
    position: 'absolute',
    left: 14,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 7,
  },
  trustBubble: {
    position: 'absolute',
    right: -4,
    bottom: 10,
    width: 96,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 4,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 6,
  },
  trustText: { fontSize: 8.5, fontWeight: '700', color: colors.primaryDark, textAlign: 'center', lineHeight: 11 },
});

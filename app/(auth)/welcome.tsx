import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from '../../components/Logo';
import { Leaf } from '../../components/Leaf';
import { colors, radius, spacing, typography } from '../../constants/theme';

export default function WelcomeScreen() {
  const goToLogin = () => router.push('/(auth)/login');
  const goToRegister = () => router.push('/(auth)/register');

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <Leaf size={70} color={colors.primary} rotate={-25} style={styles.leafTopLeft} />
      <Leaf size={56} color={colors.accent} rotate={20} style={styles.leafRight} />
      <Leaf size={64} color={colors.primary} rotate={-15} style={styles.leafBottomLeft} />
      <Leaf size={48} color={colors.primaryDark} rotate={35} style={styles.leafBottomRight} />

      <Pressable
        style={styles.langBtn}
        onPress={() => Alert.alert('Dil seçimi', 'Digər dillər tezliklə əlçatan olacaq.')}
      >
        <Ionicons name="globe-outline" size={16} color={colors.primaryDark} />
        <Text style={styles.langText}>AZ</Text>
        <Ionicons name="chevron-down" size={14} color={colors.primaryDark} />
      </Pressable>

      <View style={styles.content}>
        <View style={styles.brandBlock}>
          <Logo size={104} />
          <Text style={styles.brandName}>
            <Text style={{ color: colors.primaryDark }}>Halal</Text>
            <Text style={{ color: colors.primary }}>zur</Text>
          </Text>
          <Text style={styles.tagline}>SCAN · CHECK · TRUST</Text>
        </View>

        <View style={styles.badgeWrap}>
          <View style={styles.badgeRing2} />
          <View style={styles.badgeRing1} />
          <View style={styles.badge}>
            <Logo size={92} variant="mark" />
          </View>
        </View>

        <Text style={styles.headline}>Məhsulunu skan et.{'\n'}Halal statusunu öyrən.</Text>
        <Text style={styles.subtext}>
          Dünyanın müxtəlif ölkələrindəki məhsulların halal statusunu barkod vasitəsilə yoxla.
        </Text>

        <Pressable style={styles.primaryBtn} onPress={goToLogin}>
          <Ionicons name="scan-outline" size={20} color={colors.white} />
          <Text style={styles.primaryBtnText}>Barkodu skan et</Text>
        </Pressable>

        <Pressable style={styles.secondaryBtn} onPress={goToLogin}>
          <Ionicons name="cube-outline" size={20} color={colors.primaryDark} />
          <Text style={styles.secondaryBtnText}>Məhsulları kəşf et</Text>
        </Pressable>

        <View style={styles.footerRow}>
          <Pressable onPress={goToLogin}>
            <Text style={styles.footerLink}>Daxil ol</Text>
          </Pressable>
          <View style={styles.footerDivider} />
          <Pressable onPress={goToRegister}>
            <Text style={styles.footerLink}>Qeydiyyatdan keç</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  leafTopLeft: { position: 'absolute', top: 70, left: -10, opacity: 0.9 },
  leafRight: { position: 'absolute', top: '32%', right: -14, opacity: 0.85 },
  leafBottomLeft: { position: 'absolute', bottom: 90, left: -8, opacity: 0.8 },
  leafBottomRight: { position: 'absolute', bottom: 40, right: 10, opacity: 0.7 },
  langBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    zIndex: 10,
  },
  langText: { ...typography.small, color: colors.primaryDark, fontWeight: '700' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  brandBlock: { alignItems: 'center' },
  brandName: { ...typography.h1, fontSize: 34, marginTop: spacing.sm },
  tagline: { ...typography.caption, color: colors.gray, letterSpacing: 3, marginTop: 4 },
  badgeWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: spacing.xl, width: 220, height: 220 },
  badgeRing2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.surface,
    opacity: 0.6,
  },
  badgeRing1: {
    position: 'absolute',
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: colors.white,
    opacity: 0.9,
  },
  badge: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  headline: {
    ...typography.h1,
    fontSize: 26,
    color: colors.black,
    textAlign: 'center',
    lineHeight: 32,
  },
  subtext: {
    ...typography.body,
    color: colors.gray,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: radius.lg,
    width: '100%',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  primaryBtnText: { ...typography.h3, color: colors.white },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.surface,
    height: 56,
    borderRadius: radius.lg,
    width: '100%',
    marginTop: spacing.md,
  },
  secondaryBtnText: { ...typography.h3, color: colors.primaryDark },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xl },
  footerLink: { ...typography.body, color: colors.primaryDark, fontWeight: '700' },
  footerDivider: { width: 1, height: 16, backgroundColor: colors.grayLight },
});

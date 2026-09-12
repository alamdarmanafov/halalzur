import { useMemo } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../lib/i18n-context';
import { radius, spacing, typography, ThemeColors } from '../constants/theme';
import { useThemeColors } from '../lib/theme-context';

export function GoogleSignInButton({ onPress }: { onPress: () => void }) {
  const { t } = useLanguage();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Ionicons name="logo-google" size={18} color={colors.black} />
      <Text style={styles.label}>{t('googleContinue')}</Text>
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  button: {
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.grayLight,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: { color: colors.black, fontWeight: '600', fontSize: typography.body.fontSize },
});

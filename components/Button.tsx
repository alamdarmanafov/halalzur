import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, typography } from '../constants/theme';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <Pressable onPress={onPress} disabled={isDisabled} style={[{ opacity: isDisabled ? 0.6 : 1 }, style]}>
        <LinearGradient
          colors={[colors.primaryDark, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.base}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryText}>{title}</Text>
          )}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        variant === 'outline' ? styles.outline : styles.ghost,
        { opacity: isDisabled ? 0.6 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <Text style={variant === 'outline' ? styles.outlineText : styles.ghostText}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primaryText: { color: colors.white, fontSize: typography.h3.fontSize, fontWeight: '700' },
  outline: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: 'transparent' },
  outlineText: { color: colors.primary, fontSize: typography.h3.fontSize, fontWeight: '700' },
  ghost: { backgroundColor: 'transparent' },
  ghostText: { color: colors.gray, fontSize: typography.body.fontSize, fontWeight: '600' },
});

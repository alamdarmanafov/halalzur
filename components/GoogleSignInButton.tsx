import { Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../constants/theme';

export function GoogleSignInButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Ionicons name="logo-google" size={18} color={colors.black} />
      <Text style={styles.label}>Google ilə davam et</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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

import { TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native';
import { colors, radius, spacing, typography } from '../constants/theme';

type TextFieldProps = TextInputProps & {
  label: string;
};

export function TextField({ label, style, ...rest }: TextFieldProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.gray}
        style={[styles.input, style]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: {
    fontSize: typography.small.fontSize,
    fontWeight: '600',
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  input: {
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.grayLight,
    paddingHorizontal: spacing.md,
    fontSize: typography.body.fontSize,
    color: colors.black,
    backgroundColor: colors.white,
  },
});

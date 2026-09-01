import { View, Text, StyleSheet } from 'react-native';
import { ECodeEntry } from '../lib/types';
import { ECODE_STATUS_LABEL_KEY } from '../lib/eCodes';
import { translateECodeCategory, translateECodeNote } from '../lib/eCodeTranslations';
import { useLanguage } from '../lib/i18n-context';
import { colors, radius, spacing, typography } from '../constants/theme';

const STATUS_COLOR: Record<ECodeEntry['status'], string> = {
  halal: colors.primary,
  haram: colors.danger,
  mushbooh: colors.warning,
  depends: colors.gray,
};

export function ECodeCard({ entry }: { entry: ECodeEntry }) {
  const { t, language } = useLanguage();
  const tint = STATUS_COLOR[entry.status];
  return (
    <View style={[styles.card, { borderColor: tint }]}>
      <View style={styles.headerRow}>
        <Text style={styles.code}>{entry.code}</Text>
        <View style={[styles.pill, { backgroundColor: tint + '22' }]}>
          <Text style={[styles.pillText, { color: tint }]}>{t(ECODE_STATUS_LABEL_KEY[entry.status])}</Text>
        </View>
      </View>
      <Text style={styles.name}>
        {entry.name} · {translateECodeCategory(entry.category, language)}
      </Text>
      <Text style={styles.note}>{translateECodeNote(entry.note, language)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  code: { ...typography.h3, color: colors.black },
  pill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  pillText: { fontSize: 11, fontWeight: '800' },
  name: { ...typography.small, color: colors.gray, marginTop: 2 },
  note: { ...typography.small, color: colors.black, marginTop: spacing.xs, lineHeight: 18 },
});

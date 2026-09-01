import { View, Text, StyleSheet, Pressable, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../lib/i18n-context';
import { CERTIFIERS } from '../lib/certifiers';
import { TranslationKey } from '../lib/i18n';
import { colors, radius, spacing, typography } from '../constants/theme';

const CERTIFIER_DESC_KEY: Record<string, TranslationKey> = {
  gimdes: 'certifierDescGimdes',
  hak: 'certifierDescHak',
  smiic: 'certifierDescSmiic',
  jakim: 'certifierDescJakim',
  azstandart: 'certifierDescAzstandart',
};

export default function CertifiersScreen() {
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.black} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('certifiersScreenTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        {CERTIFIERS.map((certifier) => (
          <View key={certifier.id} style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{certifier.shortName}</Text>
                <Text style={styles.cardCountry}>{certifier.country}</Text>
              </View>
            </View>
            <Text style={styles.cardName}>{certifier.name}</Text>
            {CERTIFIER_DESC_KEY[certifier.id] && (
              <Text style={styles.cardDesc}>{t(CERTIFIER_DESC_KEY[certifier.id])}</Text>
            )}
            {certifier.sourceUrl && (
              <Pressable onPress={() => Linking.openURL(certifier.sourceUrl!)} hitSlop={8}>
                <Text style={styles.sourceLink}>{t('productViewSource')}</Text>
              </Pressable>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...typography.h3, color: colors.black },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardTitle: { ...typography.h3, color: colors.black },
  cardCountry: { ...typography.small, color: colors.gray, marginTop: 1 },
  cardName: { ...typography.small, color: colors.gray, marginTop: spacing.sm, lineHeight: 18 },
  cardDesc: { ...typography.small, color: colors.black, marginTop: spacing.sm, lineHeight: 19 },
  sourceLink: {
    ...typography.small,
    color: colors.primaryDark,
    marginTop: spacing.sm,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

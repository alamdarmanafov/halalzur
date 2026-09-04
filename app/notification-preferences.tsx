import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth-context';
import { useLanguage } from '../lib/i18n-context';
import { TranslationKey } from '../lib/i18n';
import { fetchMutedNotificationTypes, syncMutedNotificationTypes } from '../lib/userSync';
import { colors, radius, spacing, typography } from '../constants/theme';

type NotifType = 'winback' | 'recommend' | 'category_digest';
const TYPES: NotifType[] = ['winback', 'recommend', 'category_digest'];

export default function NotificationPreferencesScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [muted, setMuted] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchMutedNotificationTypes(user.id)
      .then(setMuted)
      .finally(() => setLoading(false));
  }, [user]);

  const toggle = (type: NotifType, on: boolean) => {
    if (!user) return;
    const next = on ? muted.filter((m) => m !== type) : [...muted, type];
    setMuted(next);
    syncMutedNotificationTypes(user.id, next);
  };

  const LABEL_KEY: Record<NotifType, TranslationKey> = {
    winback: 'notifPrefWinback',
    recommend: 'notifPrefRecommend',
    category_digest: 'notifPrefCategoryDigest',
  };
  const DESC_KEY: Record<NotifType, TranslationKey> = {
    winback: 'notifPrefWinbackDesc',
    recommend: 'notifPrefRecommendDesc',
    category_digest: 'notifPrefCategoryDigestDesc',
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.black} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('notifPrefTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={styles.intro}>{t('notifPrefIntro')}</Text>
        {!loading &&
          TYPES.map((type) => (
            <View key={type} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{t(LABEL_KEY[type])}</Text>
                <Text style={styles.rowDesc}>{t(DESC_KEY[type])}</Text>
              </View>
              <Switch
                value={!muted.includes(type)}
                onValueChange={(on) => toggle(type, on)}
                trackColor={{ false: colors.grayLight, true: colors.primary }}
              />
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
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.h3, color: colors.black },
  intro: { ...typography.small, color: colors.gray, lineHeight: 19, marginBottom: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowLabel: { ...typography.body, color: colors.black, fontWeight: '700' },
  rowDesc: { ...typography.small, color: colors.gray, marginTop: 2, lineHeight: 17 },
});

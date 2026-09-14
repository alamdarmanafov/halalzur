import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth-context';
import { useLanguage } from '../lib/i18n-context';
import { getApprovedCount } from '../lib/submissions';
import { ACHIEVEMENT_TIERS, highestUnclaimedTier } from '../lib/achievements';
import { POINTS_PER_PREMIUM_DAY } from '../lib/points';
import { sendPushNotification } from '../lib/pushNotify';
import { maybeRequestReview } from '../lib/reviewPrompt';
import { BrandModal } from '../components/BrandModal';
import { radius, spacing, typography, ThemeColors } from '../constants/theme';
import { useThemeColors } from '../lib/theme-context';

export default function AchievementsScreen() {
  const { user, claimAchievementPoints } = useAuth();
  const { t } = useLanguage();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [approvedCount, setApprovedCount] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [unlocked, setUnlocked] = useState<{ points: number } | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const count = await getApprovedCount(user.id);
      setApprovedCount(count);
      // highestUnclaimedTier here is only used to decide whether it's worth
      // asking the server at all — grant_achievement_points (called via
      // claimAchievementPoints) recomputes eligibility itself from
      // product_submissions and is the actual source of truth for what
      // gets granted.
      const maybeTier = highestUnclaimedTier(count, user.claimedAchievements);
      if (maybeTier) {
        const result = await claimAchievementPoints();
        if (result) {
          const { points } = result;
          setUnlocked({ points });
          sendPushNotification(
            user.id,
            t('achievementsPushTitle'),
            `${points} ${t('giftPointsUnit')} ${t('achievementsCongratsBody')}`,
            { route: '/achievements' }
          );
          maybeRequestReview();
        }
      }
    } catch {
      setApprovedCount(0);
    }
  }, [user, claimAchievementPoints, t]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.black} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('achievementsTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.introCard}>
          <Ionicons name="trophy" size={26} color={colors.primaryDark} />
          <Text style={styles.introTitle}>{t('achievementsIntroTitle')}</Text>
          <Text style={styles.introBody}>{t('achievementsIntroBody')}</Text>
          {approvedCount === null ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
          ) : (
            <View style={styles.countBadge}>
              <Text style={styles.countNumber}>{approvedCount}</Text>
              <Text style={styles.countLabel}>{t('achievementsApprovedLabel')}</Text>
            </View>
          )}
        </View>

        {ACHIEVEMENT_TIERS.map((tier) => {
          const claimed = user?.claimedAchievements.includes(tier.threshold) ?? false;
          const count = approvedCount ?? 0;
          const progress = Math.min(1, count / tier.threshold);
          return (
            <View key={tier.threshold} style={styles.tierCard}>
              <View style={[styles.tierIcon, claimed && styles.tierIconDone]}>
                <Ionicons
                  name={claimed ? 'checkmark' : 'lock-closed-outline'}
                  size={20}
                  color={claimed ? colors.white : colors.gray}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tierTitle}>
                  {tier.threshold} {t('achievementsTierTitle')} {tier.days * POINTS_PER_PREMIUM_DAY} {t('giftPointsUnit')}
                </Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                </View>
                <Text style={styles.tierSub}>
                  {claimed ? t('achievementsClaimed') : `${Math.min(count, tier.threshold)}/${tier.threshold}`}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <BrandModal
        visible={!!unlocked}
        title={t('achievementsCongratsTitle')}
        body={unlocked ? `${unlocked.points} ${t('giftPointsUnit')} ${t('achievementsCongratsBody')}` : ''}
        ctaLabel={t('achievementsCongratsCta')}
        onCta={() => setUnlocked(null)}
        onClose={() => setUnlocked(null)}
      />
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
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
  introCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  introTitle: { ...typography.h3, color: colors.black, marginTop: spacing.sm, textAlign: 'center' },
  introBody: {
    ...typography.small,
    color: colors.gray,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  countBadge: { alignItems: 'center', marginTop: spacing.md },
  countNumber: { ...typography.h1, color: colors.primaryDark },
  countLabel: { ...typography.small, color: colors.gray },
  tierCard: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  tierIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierIconDone: { backgroundColor: colors.primary },
  tierTitle: { ...typography.body, color: colors.black, fontWeight: '700' },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  tierSub: { ...typography.small, color: colors.gray, marginTop: 4 },
});

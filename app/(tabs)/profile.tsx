import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, RefreshControl, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../lib/auth-context';
import { useHistory } from '../../lib/history-context';
import { useFavorites } from '../../lib/favorites-context';
import { useLanguage } from '../../lib/i18n-context';
import { registerForPushNotifications } from '../../lib/notifications';
import { syncUserLanguage } from '../../lib/userSync';
import { isAdmin } from '../../lib/admin';
import { getPoints, fetchPendingSubmissions } from '../../lib/submissions';
import { POINTS_PER_PREMIUM_DAY, MIN_REDEEMABLE_DAYS } from '../../lib/points';
import { computeBadges, BADGE_ICON, BADGE_LABEL_KEY } from '../../lib/badges';
import { useLiteMode } from '../../lib/liteMode-context';
import { useStreak } from '../../lib/streak-context';
import type { Language, TranslationKey } from '../../lib/i18n';
import { deleteAccount } from '../../lib/deleteAccount';
import { colors, radius, spacing, typography } from '../../constants/theme';

const LANGUAGE_LABEL_KEY: Record<Language, TranslationKey> = {
  az: 'profileLanguageAz',
  en: 'profileLanguageEn',
  ru: 'profileLanguageRu',
  tr: 'profileLanguageTr',
};

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
};

const DATE_LOCALE: Record<Language, string> = { az: 'az-AZ', en: 'en-US', ru: 'ru-RU', tr: 'tr-TR' };

function formatExpiryDate(iso: string, language: Language): string {
  return new Date(iso).toLocaleDateString(DATE_LOCALE[language], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ProfileScreen() {
  const { user, signOut, refreshPlan, redeemPointsForPremium } = useAuth();
  const { liteMode, setLiteMode } = useLiteMode();
  const { streak } = useStreak();
  const { history, clear } = useHistory();
  const { favorites } = useFavorites();
  const { language, setLanguage, t } = useLanguage();
  const isPremium = user?.plan === 'premium';
  const admin = isAdmin(user);
  const [points, setPoints] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadProfileData = () => {
    if (!user) return;
    getPoints(user.id)
      .then(setPoints)
      .catch(() => {});
    if (admin) {
      fetchPendingSubmissions()
        .then((list) => setPendingCount(list.length))
        .catch(() => {});
    }
  };

  useEffect(loadProfileData, [user, admin]);

  const badges = useMemo(
    () =>
      computeBadges({
        isPremium,
        claimedAchievements: user?.claimedAchievements ?? [],
        points,
        scansCount: history.length,
      }),
    [isPremium, user?.claimedAchievements, points, history.length]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshPlan();
      loadProfileData();
    } finally {
      setRefreshing(false);
    }
  };

  const onRedeemPoints = () => {
    const days = Math.floor(points / POINTS_PER_PREMIUM_DAY);
    const minPoints = MIN_REDEEMABLE_DAYS * POINTS_PER_PREMIUM_DAY;
    if (days < MIN_REDEEMABLE_DAYS) {
      Alert.alert(t('profileRedeemNotEnoughTitle'), t('profileRedeemNotEnoughBody').replace('{n}', String(minPoints)));
      return;
    }
    Alert.alert(
      t('profileRedeemConfirmTitle'),
      t('profileRedeemConfirmBody')
        .replace('{days}', String(days))
        .replace('{points}', String(days * POINTS_PER_PREMIUM_DAY)),
      [
        { text: t('profileRedeemCancel'), style: 'cancel' },
        {
          text: t('profileRedeemConfirmButton'),
          onPress: async () => {
            try {
              const redeemedDays = await redeemPointsForPremium();
              Alert.alert(t('profileRedeemSuccessTitle'), t('profileRedeemSuccessBody').replace('{days}', String(redeemedDays)));
              loadProfileData();
            } catch (err: any) {
              Alert.alert(t('profileRedeemErrorTitle'), err.message ?? '');
            }
          },
        },
      ]
    );
  };

  const menuItems: MenuItem[] = [
    {
      icon: 'time-outline',
      label: `${t('profileHistoryItem')} (${history.length})`,
      onPress: () => router.push('/(tabs)/products'),
    },
    {
      icon: 'heart-outline',
      label: `${t('profileFavoritesItem')} (${favorites.length})`,
      onPress: () => router.push('/favorites'),
    },
    {
      icon: 'notifications-outline',
      label: t('profileNotifications'),
      onPress: async () => {
        const token = user ? await registerForPushNotifications(user.id) : null;
        if (token) {
          Alert.alert(t('profileNotificationsOnTitle'), t('profileNotificationsOnBody'));
        } else {
          Alert.alert(t('profileNotificationsOffTitle'), t('profileNotificationsOffBody'));
        }
      },
    },
    {
      icon: 'flask-outline',
      label: t('profileEcodes'),
      onPress: () => router.push('/ecodes'),
    },
    {
      icon: 'bookmark-outline',
      label: t('profileFollowedBrands'),
      onPress: () => router.push('/followed-brands'),
    },
    {
      icon: 'nutrition-outline',
      label: t('profileDietaryProfile'),
      onPress: () => router.push('/dietary-profile'),
    },
    {
      icon: 'options-outline',
      label: t('profileNotificationPrefs'),
      onPress: () => router.push('/notification-preferences'),
    },
    {
      icon: 'trophy-outline',
      label: t('profileAchievements'),
      onPress: () => router.push('/achievements'),
    },
    {
      icon: 'globe-outline',
      label: `${t('profileLanguage')}: ${t(LANGUAGE_LABEL_KEY[language])}`,
      onPress: () =>
        Alert.alert(
          t('profileLanguageTitle'),
          undefined,
          (['az', 'en', 'ru', 'tr'] as const).map((lang) => ({
            text: t(LANGUAGE_LABEL_KEY[lang]),
            onPress: () => {
              setLanguage(lang);
              if (user) syncUserLanguage(user.id, lang);
            },
          }))
        ),
    },
    {
      icon: 'book-outline',
      label: t('profileGuide'),
      onPress: () => router.push('/guide'),
    },
    {
      icon: 'shield-checkmark-outline',
      label: t('profileCertifiers'),
      onPress: () => router.push('/certifiers'),
    },
    {
      icon: 'gift-outline',
      label: t('profileInvite'),
      onPress: () => router.push('/referrals'),
    },
    {
      icon: 'chatbox-ellipses-outline',
      label: t('profileFeedback'),
      onPress: () => router.push('/feedback'),
    },
    ...(admin
      ? [
          {
            icon: 'shield-half-outline' as const,
            label: `${t('profileAdminPending')} (${pendingCount})`,
            onPress: () => router.push('/admin'),
          },
        ]
      : []),
    {
      icon: 'trash-outline',
      label: t('profileClearHistory'),
      onPress: () => clear(),
    },
    {
      icon: 'log-out-outline',
      label: t('profileSignOut'),
      onPress: async () => {
        await signOut();
        router.replace('/(auth)/welcome');
      },
      danger: true,
    },
    {
      icon: 'person-remove-outline',
      label: t('profileDeleteAccount'),
      onPress: () => {
        if (!user) return;
        Alert.alert(t('profileDeleteAccountConfirmTitle'), t('profileDeleteAccountConfirmBody'), [
          { text: t('productCancel'), style: 'cancel' },
          {
            text: t('profileDeleteAccountConfirmCta'),
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteAccount(user.id);
                await signOut();
                router.replace('/(auth)/welcome');
              } catch (err: any) {
                Alert.alert(t('profileDeleteAccountFailedTitle'), err.message ?? t('profileDeleteAccountFailedTitle'));
              }
            },
          },
        ]);
      },
      danger: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <Text style={styles.title}>{t('profileTitle')}</Text>

        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name ?? '?').slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{user?.name}</Text>
              {isPremium && (
                <View style={styles.premiumBadge}>
                  <Ionicons name="star" size={11} color={colors.white} />
                  <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                </View>
              )}
            </View>
            <Text style={styles.email}>{user?.email}</Text>
            {isPremium && user?.premiumExpiresAt && (
              <Text style={styles.premiumExpiry}>
                {t('profilePremiumExpiryLine').replace('{date}', formatExpiryDate(user.premiumExpiresAt, language))}
              </Text>
            )}
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Pressable style={styles.pointsBadge} onPress={onRedeemPoints}>
              <Ionicons name="trophy" size={14} color={colors.primaryDark} />
              <Text style={styles.pointsText}>{points}</Text>
            </Pressable>
            {streak > 0 && (
              <View style={styles.streakBadge}>
                <Ionicons name="flame" size={13} color={colors.accent} />
                <Text style={styles.streakText}>{streak}</Text>
              </View>
            )}
          </View>
        </View>

        {badges.length > 0 && (
          <View style={styles.badgeRow}>
            {badges.map((id) => (
              <View key={id} style={styles.badgeChip}>
                <Ionicons name={BADGE_ICON[id] as keyof typeof Ionicons.glyphMap} size={14} color={colors.primaryDark} />
                <Text style={styles.badgeChipText}>{t(BADGE_LABEL_KEY[id])}</Text>
              </View>
            ))}
          </View>
        )}

        {!isPremium && (
          <Pressable onPress={() => router.push('/subscription')}>
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.planCard}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.planLabel}>{t('profileFreePlan')}</Text>
                <Text style={styles.planDesc}>{t('profileFreePlanDesc')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={colors.white} />
            </LinearGradient>
          </Pressable>
        )}

        <View style={styles.menu}>
          {menuItems.map((item) => (
            <Pressable key={item.label} style={styles.menuRow} onPress={item.onPress}>
              <Ionicons
                name={item.icon}
                size={20}
                color={item.danger ? colors.danger : colors.primaryDark}
              />
              <Text style={[styles.menuLabel, item.danger && { color: colors.danger }]}>
                {item.label}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.grayLight} />
            </Pressable>
          ))}
        </View>

        <View style={styles.liteModeRow}>
          <Ionicons name="cellular-outline" size={20} color={colors.primaryDark} />
          <View style={{ flex: 1 }}>
            <Text style={styles.liteModeLabel}>{t('profileLiteMode')}</Text>
            <Text style={styles.liteModeSub}>{t('profileLiteModeSub')}</Text>
          </View>
          <Switch
            value={liteMode}
            onValueChange={setLiteMode}
            trackColor={{ false: colors.grayLight, true: colors.primary }}
          />
        </View>

        <Text style={styles.version}>Halalzur v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, paddingHorizontal: spacing.lg },
  title: { ...typography.h1, color: colors.primaryDark, marginTop: spacing.md, marginBottom: spacing.lg },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.h2, color: colors.primaryDark },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  name: { ...typography.h3, color: colors.black },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  premiumBadgeText: { color: colors.white, fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  email: { ...typography.small, color: colors.gray, marginTop: 2 },
  premiumExpiry: { ...typography.small, color: colors.primaryDark, marginTop: 2, fontWeight: '600' },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  pointsText: { ...typography.small, color: colors.primaryDark, fontWeight: '800' },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  streakText: { ...typography.small, color: colors.black, fontWeight: '700' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.lg },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  badgeChipText: { ...typography.small, color: colors.primaryDark, fontWeight: '700' },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  planLabel: { ...typography.h3, color: colors.white },
  planDesc: { ...typography.small, color: colors.surface, marginTop: 2 },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(10,77,46,0.08)',
  },
  menuLabel: { flex: 1, ...typography.body, color: colors.black, fontWeight: '600' },
  liteModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  liteModeLabel: { ...typography.body, color: colors.black, fontWeight: '700' },
  liteModeSub: { ...typography.small, color: colors.gray, marginTop: 2 },
  version: { textAlign: 'center', color: colors.grayLight, marginTop: spacing.lg, fontSize: typography.small.fontSize },
});

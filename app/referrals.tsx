import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Share,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth-context';
import { useLanguage } from '../lib/i18n-context';
import {
  getOrCreateReferralCode,
  hasRedeemedReferral,
  redeemReferralCode,
  getMyReferrals,
  REFERRAL_BONUS_POINTS,
  REFERRAL_MILESTONES,
  ReferralEntry,
} from '../lib/referrals';
import { Button } from '../components/Button';
import { colors, radius, spacing, typography } from '../constants/theme';

export default function ReferralsScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState<string | null>(null);
  const [redeemed, setRedeemed] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [myReferrals, setMyReferrals] = useState<ReferralEntry[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([getOrCreateReferralCode(user.id), hasRedeemedReferral(user.id), getMyReferrals(user.id)])
      .then(([c, r, invites]) => {
        setCode(c);
        setRedeemed(r);
        setMyReferrals(invites);
      })
      .catch((err) => Alert.alert(t('referralsErrorTitle'), err.message ?? t('referralsErrorBody')))
      .finally(() => setLoading(false));
  }, [user]);

  const nextMilestone = REFERRAL_MILESTONES.find((m) => m.count > myReferrals.length);

  const onShare = async () => {
    if (!code) return;
    try {
      const link = `https://halalzur.com/invite.html?code=${code}`;
      await Share.share({
        message: `${t('referralsShareMessage').replace('{n}', String(REFERRAL_BONUS_POINTS))} ${code}\n${link}`,
      });
    } catch {
      // user cancelled the share sheet — nothing to do
    }
  };

  const onRedeem = async () => {
    if (!user) return;
    setRedeeming(true);
    try {
      await redeemReferralCode(user.id, user.name, inputCode);
      setRedeemed(true);
      setInputCode('');
      Alert.alert(t('referralsSuccessTitle'), `${REFERRAL_BONUS_POINTS} ${t('referralsSuccessBody')}`);
    } catch (err: any) {
      Alert.alert(t('referralsFailedTitle'), err.message ?? t('referralsFailedBody'));
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.black} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('referralsTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg }}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <Text style={styles.intro}>{t('referralsIntro').replace('{n}', String(REFERRAL_BONUS_POINTS))}</Text>

          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>{t('referralsYourCode')}</Text>
            <Text style={styles.codeValue}>{code}</Text>
          </View>
          <Button title={t('referralsShare')} onPress={onShare} style={{ marginTop: spacing.md }} />

          {nextMilestone && (
            <Text style={styles.milestoneHint}>
              {t('referralsMilestoneHint')
                .replace('{count}', String(nextMilestone.count))
                .replace('{days}', String(nextMilestone.premiumDays))}
            </Text>
          )}

          <View style={styles.myInvitesBox}>
            <Text style={styles.sectionTitle}>{t('referralsMyInvitesTitle')}</Text>
            {myReferrals.length > 0 && (
              <Text style={styles.myInvitesCount}>
                {t('referralsMyInvitesCount').replace('{n}', String(myReferrals.length))}
              </Text>
            )}
            {myReferrals.length === 0 ? (
              <Text style={styles.myInvitesEmpty}>{t('referralsMyInvitesEmpty')}</Text>
            ) : (
              myReferrals.map((entry) => (
                <View key={entry.id} style={styles.myInviteRow}>
                  <Ionicons name="person-circle-outline" size={20} color={colors.primary} />
                  <Text style={styles.myInviteName} numberOfLines={1}>
                    {entry.name || t('referralsMyInvitesUnnamed')}
                  </Text>
                  <Text style={styles.myInviteDate}>
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.divider} />

          {redeemed ? (
            <View style={styles.redeemedBox}>
              <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
              <Text style={styles.redeemedText}>{t('referralsAlreadyRedeemed')}</Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>{t('referralsEnterCodeTitle')}</Text>
              <TextInput
                value={inputCode}
                onChangeText={(txt) => setInputCode(txt.toUpperCase())}
                placeholder={t('referralsCodePlaceholder')}
                placeholderTextColor={colors.gray}
                autoCapitalize="characters"
                autoCorrect={false}
                style={styles.input}
              />
              <Button
                title={redeeming ? t('referralsSending') : t('referralsConfirm')}
                onPress={onRedeem}
                loading={redeeming}
                disabled={!inputCode.trim()}
                style={{ marginTop: spacing.md }}
              />
            </>
          )}
        </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  intro: { ...typography.small, color: colors.gray, lineHeight: 19, marginBottom: spacing.lg },
  codeBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  codeLabel: { ...typography.small, color: colors.gray },
  codeValue: {
    ...typography.h1,
    color: colors.primaryDark,
    letterSpacing: 4,
    marginTop: spacing.xs,
  },
  divider: { height: 1, backgroundColor: colors.grayLight, marginVertical: spacing.xl, opacity: 0.5 },
  sectionTitle: { ...typography.h3, color: colors.black, marginBottom: spacing.sm },
  milestoneHint: {
    ...typography.small,
    color: colors.primaryDark,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.md,
  },
  myInvitesBox: { marginTop: spacing.xl },
  myInvitesCount: { ...typography.small, color: colors.gray, marginTop: -spacing.xs, marginBottom: spacing.sm },
  myInvitesEmpty: { ...typography.small, color: colors.gray },
  myInviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  myInviteName: { ...typography.body, color: colors.black, flex: 1 },
  myInviteDate: { ...typography.caption, color: colors.gray },
  input: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.grayLight,
    paddingHorizontal: spacing.md,
    fontSize: typography.body.fontSize,
    letterSpacing: 2,
    color: colors.black,
    backgroundColor: colors.surface,
  },
  redeemedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  redeemedText: { ...typography.small, color: colors.black, flex: 1 },
});

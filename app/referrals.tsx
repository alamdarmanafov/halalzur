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
  Linking,
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
import { getPoints } from '../lib/submissions';
import { giftPremiumFromPoints, POINTS_PER_PREMIUM_DAY } from '../lib/points';
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
  const [points, setPoints] = useState(0);
  const [giftCode, setGiftCode] = useState('');
  const [giftDays, setGiftDays] = useState(3);
  const [gifting, setGifting] = useState(false);
  const GIFT_DAY_OPTIONS = [3, 7, 30];

  useEffect(() => {
    if (!user) return;
    Promise.all([getOrCreateReferralCode(user.id), hasRedeemedReferral(user.id), getMyReferrals(user.id), getPoints(user.id)])
      .then(([c, r, invites, p]) => {
        setCode(c);
        setRedeemed(r);
        setMyReferrals(invites);
        setPoints(p);
      })
      .catch((err) => Alert.alert(t('referralsErrorTitle'), err.message ?? t('referralsErrorBody')))
      .finally(() => setLoading(false));
  }, [user]);

  const onGift = async () => {
    if (!user || !giftCode.trim()) return;
    setGifting(true);
    try {
      const result = await giftPremiumFromPoints(user.id, giftCode, giftDays);
      setPoints((p) => p - giftDays * POINTS_PER_PREMIUM_DAY);
      setGiftCode('');
      Alert.alert(
        t('giftSuccessTitle'),
        t('giftSuccessBody').replace('{name}', result.toName || '—').replace('{days}', String(giftDays))
      );
    } catch (err: any) {
      Alert.alert(t('giftFailedTitle'), err.message ?? t('giftFailedBody'));
    } finally {
      setGifting(false);
    }
  };

  const nextMilestone = REFERRAL_MILESTONES.find((m) => m.count > myReferrals.length);

  const referralMessage = () =>
    `${t('referralsShareMessage').replace('{n}', String(REFERRAL_BONUS_POINTS))} ${code}\nhttps://halalzur.com/invite.html?code=${code}`;

  const onShare = async () => {
    if (!code) return;
    try {
      await Share.share({ message: referralMessage() });
    } catch {
      // user cancelled the share sheet — nothing to do
    }
  };

  // WhatsApp's own URL scheme prefills its own compose box directly,
  // skipping the generic OS share sheet — Instagram Story sharing has no
  // text-only equivalent (it only accepts an image via the system
  // pasteboard, which would need a new native dependency and a fresh
  // build); the existing image-based "Share result card" flow on the
  // product screen already reaches Instagram Story through the OS share
  // sheet today, so nothing extra is needed there.
  const onShareWhatsApp = async () => {
    if (!code) return;
    const url = `whatsapp://send?text=${encodeURIComponent(referralMessage())}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      Linking.openURL(url);
    } else {
      Alert.alert(t('referralsWhatsAppNotInstalledTitle'), t('referralsWhatsAppNotInstalledBody'));
    }
  };

  const onRedeem = async () => {
    if (!user) return;
    setRedeeming(true);
    try {
      await redeemReferralCode(user.id, inputCode);
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
          <Pressable style={styles.whatsappBtn} onPress={onShareWhatsApp}>
            <Ionicons name="logo-whatsapp" size={18} color={colors.white} />
            <Text style={styles.whatsappBtnText}>{t('referralsShareWhatsApp')}</Text>
          </Pressable>

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

          <Text style={styles.sectionTitle}>{t('giftTitle')}</Text>
          <Text style={styles.giftIntro}>{t('giftIntro').replace('{points}', String(points))}</Text>
          <View style={styles.giftDayRow}>
            {GIFT_DAY_OPTIONS.map((d) => (
              <Pressable
                key={d}
                style={[styles.giftDayChip, giftDays === d && styles.giftDayChipActive]}
                onPress={() => setGiftDays(d)}
              >
                <Text style={[styles.giftDayChipText, giftDays === d && styles.giftDayChipTextActive]}>
                  {d} {t('giftDaysUnit')} · {d * POINTS_PER_PREMIUM_DAY} {t('giftPointsUnit')}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            value={giftCode}
            onChangeText={(txt) => setGiftCode(txt.toUpperCase())}
            placeholder={t('giftCodePlaceholder')}
            placeholderTextColor={colors.gray}
            autoCapitalize="characters"
            autoCorrect={false}
            style={styles.input}
          />
          <Button
            title={gifting ? t('giftSending') : t('giftSend')}
            onPress={onGift}
            loading={gifting}
            disabled={!giftCode.trim() || points < giftDays * POINTS_PER_PREMIUM_DAY}
            style={{ marginTop: spacing.md }}
          />

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
  giftIntro: { ...typography.small, color: colors.gray, marginBottom: spacing.sm, lineHeight: 18 },
  giftDayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  giftDayChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.grayLight,
  },
  giftDayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  giftDayChipText: { ...typography.small, color: colors.black, fontWeight: '700' },
  giftDayChipTextActive: { color: colors.white },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: '#25D366',
    marginTop: spacing.sm,
  },
  whatsappBtnText: { color: colors.white, fontWeight: '700', fontSize: typography.body.fontSize },
});

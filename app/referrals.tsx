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
import {
  getOrCreateReferralCode,
  hasRedeemedReferral,
  redeemReferralCode,
  REFERRAL_BONUS_POINTS,
} from '../lib/referrals';
import { Button } from '../components/Button';
import { colors, radius, spacing, typography } from '../constants/theme';

export default function ReferralsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState<string | null>(null);
  const [redeemed, setRedeemed] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([getOrCreateReferralCode(user.id), hasRedeemedReferral(user.id)])
      .then(([c, r]) => {
        setCode(c);
        setRedeemed(r);
      })
      .catch((err) => Alert.alert('Xəta', err.message ?? 'Dəvət kodu yüklənmədi.'))
      .finally(() => setLoading(false));
  }, [user]);

  const onShare = async () => {
    if (!code) return;
    try {
      await Share.share({
        message: `Halalzur — halal sertifikatlı məhsulları barkoddan yoxla! Mənim dəvət kodumla qeydiyyatdan keç, ikimiz də ${REFERRAL_BONUS_POINTS} xal qazanaq: ${code}`,
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
      Alert.alert('Uğurlu!', `${REFERRAL_BONUS_POINTS} xal qazandınız.`);
    } catch (err: any) {
      Alert.alert('Olmadı', err.message ?? 'Kod istifadə edilmədi.');
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
        <Text style={styles.headerTitle}>Dostunu dəvət et</Text>
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
          <Text style={styles.intro}>
            Dostunu dəvət et, o qeydiyyatdan keçib sənin kodunu daxil etsin — ikiniz də{' '}
            {REFERRAL_BONUS_POINTS} xal qazanın.
          </Text>

          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>Sənin kodun</Text>
            <Text style={styles.codeValue}>{code}</Text>
          </View>
          <Button title="Paylaş" onPress={onShare} style={{ marginTop: spacing.md }} />

          <View style={styles.divider} />

          {redeemed ? (
            <View style={styles.redeemedBox}>
              <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
              <Text style={styles.redeemedText}>Siz artıq bir dəvət kodu istifadə etmisiniz.</Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Dəvət kodu daxil et</Text>
              <TextInput
                value={inputCode}
                onChangeText={(t) => setInputCode(t.toUpperCase())}
                placeholder="Məsələn: AB23CD"
                placeholderTextColor={colors.gray}
                autoCapitalize="characters"
                autoCorrect={false}
                style={styles.input}
              />
              <Button
                title={redeeming ? 'Göndərilir…' : 'Təsdiqlə'}
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

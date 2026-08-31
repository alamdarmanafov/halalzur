import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from '../../components/Logo';
import { AppleSignInButton } from '../../components/AppleSignInButton';
import { GoogleSignInButton } from '../../components/GoogleSignInButton';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { useAuth, GoogleSignInUnavailableError } from '../../lib/auth-context';
import { useLanguage } from '../../lib/i18n-context';
import { colors, spacing, typography } from '../../constants/theme';

export default function LoginScreen() {
  const { signInWithApple, signInWithGoogle, signInWithEmail } = useAuth();
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const goToTabs = () => router.replace('/(tabs)/products');

  const onApple = async () => {
    setError(null);
    try {
      await signInWithApple();
      goToTabs();
    } catch {
      setError(t('authAppleFailed'));
    }
  };

  const onGoogle = async () => {
    setError(null);
    try {
      await signInWithGoogle();
      goToTabs();
    } catch (err) {
      if (err instanceof GoogleSignInUnavailableError) {
        Alert.alert(t('authGoogleSoonTitle'), t('authGoogleSoonLoginBody'));
      } else {
        setError(t('authGoogleFailed'));
      }
    }
  };

  const onEmailLogin = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError(t('authFieldsRequired'));
      return;
    }
    setSubmitting(true);
    try {
      await signInWithEmail(email.trim(), password);
      goToTabs();
    } catch (err: any) {
      setError(err.message ?? t('authLoginFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.black} />
        </Pressable>

        <View style={styles.logoWrap}>
          <Logo size={64} />
          <Text style={styles.title}>{t('authLoginTitle')}</Text>
          <Text style={styles.subtitle}>{t('authLoginSubtitle')}</Text>
        </View>

        <AppleSignInButton onPress={onApple} />
        <View style={{ height: spacing.sm }} />
        <GoogleSignInButton onPress={onGoogle} />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('authOr')}</Text>
          <View style={styles.dividerLine} />
        </View>

        <TextField
          label={t('authEmail')}
          value={email}
          onChangeText={setEmail}
          placeholder={t('authEmailPlaceholder')}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />
        <TextField
          label={t('authPassword')}
          value={password}
          onChangeText={setPassword}
          placeholder={t('authPasswordPlaceholderYours')}
          secureTextEntry
        />
        <Button
          title={submitting ? t('authLoginSubmitting') : t('authLoginSubmit')}
          onPress={onEmailLogin}
          loading={submitting}
          style={{ marginTop: spacing.xs }}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>{t('authNoAccount')}</Text>
          <Link href="/(auth)/register" replace style={styles.footerLink}>
            {t('welcomeRegister')}
          </Link>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  scroll: { flexGrow: 1, padding: spacing.lg, paddingTop: 60 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoWrap: { alignItems: 'center', marginBottom: spacing.xl },
  title: { ...typography.h2, color: colors.black, marginTop: spacing.md },
  subtitle: { ...typography.body, color: colors.gray, marginTop: 2 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.grayLight },
  dividerText: { color: colors.gray, fontSize: typography.small.fontSize, fontWeight: '600' },
  error: { color: colors.danger, marginTop: spacing.md, textAlign: 'center', fontSize: typography.small.fontSize },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl, paddingBottom: spacing.md },
  footerText: { color: colors.gray },
  footerLink: { color: colors.primary, fontWeight: '700' },
});

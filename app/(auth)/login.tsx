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
import { colors, spacing, typography } from '../../constants/theme';

export default function LoginScreen() {
  const { signInWithApple, signInWithGoogle, signInWithEmail } = useAuth();
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
      setError('Apple ilə giriş alınmadı, yenidən cəhd edin.');
    }
  };

  const onGoogle = async () => {
    setError(null);
    try {
      await signInWithGoogle();
      goToTabs();
    } catch (err) {
      if (err instanceof GoogleSignInUnavailableError) {
        Alert.alert('Tezliklə', 'Google ilə giriş hələ əlçatan deyil — indilik Apple ilə daxil olun.');
      } else {
        setError('Google ilə giriş alınmadı, yenidən cəhd edin.');
      }
    }
  };

  const onEmailLogin = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Email və şifrə tələb olunur.');
      return;
    }
    setSubmitting(true);
    try {
      await signInWithEmail(email.trim(), password);
      goToTabs();
    } catch (err: any) {
      setError(err.message ?? 'Giriş alınmadı, email/şifrəni yoxlayın.');
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
          <Text style={styles.title}>Xoş gəldiniz</Text>
          <Text style={styles.subtitle}>Hesabınıza daxil olun</Text>
        </View>

        <AppleSignInButton onPress={onApple} />
        <View style={{ height: spacing.sm }} />
        <GoogleSignInButton onPress={onGoogle} />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>və ya</Text>
          <View style={styles.dividerLine} />
        </View>

        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="email@nümunə.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />
        <TextField
          label="Şifrə"
          value={password}
          onChangeText={setPassword}
          placeholder="Şifrəniz"
          secureTextEntry
        />
        <Button
          title={submitting ? 'Daxil olunur…' : 'Daxil ol'}
          onPress={onEmailLogin}
          loading={submitting}
          style={{ marginTop: spacing.xs }}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Hesabınız yoxdur? </Text>
          <Link href="/(auth)/register" replace style={styles.footerLink}>
            Qeydiyyatdan keçin
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

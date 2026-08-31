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

export default function RegisterScreen() {
  const { signInWithApple, signInWithGoogle, signUpWithEmail } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
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
      setError('Apple ilə qeydiyyat alınmadı, yenidən cəhd edin.');
    }
  };

  const onGoogle = async () => {
    setError(null);
    try {
      await signInWithGoogle();
      goToTabs();
    } catch (err) {
      if (err instanceof GoogleSignInUnavailableError) {
        Alert.alert('Tezliklə', 'Google ilə qeydiyyat hələ əlçatan deyil — indilik Apple ilə davam edin.');
      } else {
        setError('Google ilə qeydiyyat alınmadı, yenidən cəhd edin.');
      }
    }
  };

  const onEmailRegister = async () => {
    setError(null);
    if (!name.trim() || !email.trim() || !password) {
      setError('Ad, email və şifrə tələb olunur.');
      return;
    }
    if (password.length < 6) {
      setError('Şifrə ən azı 6 simvol olmalıdır.');
      return;
    }
    setSubmitting(true);
    try {
      await signUpWithEmail(email.trim(), password, name.trim());
      goToTabs();
    } catch (err: any) {
      setError(err.message ?? 'Qeydiyyat alınmadı, yenidən cəhd edin.');
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
          <Text style={styles.title}>Hesab yaradın</Text>
          <Text style={styles.subtitle}>Apple, Google və ya email ilə başlayın</Text>
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
          label="Ad"
          value={name}
          onChangeText={setName}
          placeholder="Adınız"
          autoCapitalize="words"
        />
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
          placeholder="Ən azı 6 simvol"
          secureTextEntry
        />
        <Button
          title={submitting ? 'Qeydiyyat gedir…' : 'Qeydiyyatdan keç'}
          onPress={onEmailRegister}
          loading={submitting}
          style={{ marginTop: spacing.xs }}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Artıq hesabınız var? </Text>
          <Link href="/(auth)/login" replace style={styles.footerLink}>
            Daxil olun
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
  title: { ...typography.h2, color: colors.black, marginTop: spacing.md, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.gray, marginTop: 2, textAlign: 'center' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.grayLight },
  dividerText: { color: colors.gray, fontSize: typography.small.fontSize, fontWeight: '600' },
  error: { color: colors.danger, marginTop: spacing.md, textAlign: 'center', fontSize: typography.small.fontSize },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl, paddingBottom: spacing.md },
  footerText: { color: colors.gray },
  footerLink: { color: colors.primary, fontWeight: '700' },
});

import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from '../../components/Logo';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { AppleSignInButton } from '../../components/AppleSignInButton';
import { GoogleSignInButton } from '../../components/GoogleSignInButton';
import { useAuth, GoogleSignInUnavailableError } from '../../lib/auth-context';
import { colors, spacing, typography } from '../../constants/theme';

export default function RegisterScreen() {
  const { signUp, signInWithApple, signInWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goToTabs = () => router.replace('/(tabs)');

  const onSubmit = async () => {
    if (!name || !email || !password) {
      setError('Bütün sahələri doldurun.');
      return;
    }
    if (password.length < 6) {
      setError('Şifrə ən azı 6 simvol olmalıdır.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signUp(name, email, password);
      goToTabs();
    } finally {
      setLoading(false);
    }
  };

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
    try {
      await signInWithGoogle();
      goToTabs();
    } catch (err) {
      if (err instanceof GoogleSignInUnavailableError) {
        Alert.alert('Tezliklə', 'Google ilə qeydiyyat hələ əlçatan deyil — indilik e-poçt və ya Apple ilə davam edin.');
      }
    }
  };

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.black} />
          </Pressable>

          <View style={styles.logoWrap}>
            <Logo size={64} />
            <Text style={styles.title}>Hesab yaradın</Text>
            <Text style={styles.subtitle}>Pulsuz başlayın, istədiyiniz zaman Premium-a keçin</Text>
          </View>

          <AppleSignInButton onPress={onApple} />
          <View style={{ height: spacing.sm }} />
          <GoogleSignInButton onPress={onGoogle} />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>və ya</Text>
            <View style={styles.dividerLine} />
          </View>

          <TextField label="Ad Soyad" placeholder="Adınız" value={name} onChangeText={setName} />
          <TextField
            label="E-poçt"
            placeholder="siz@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextField
            label="Şifrə"
            placeholder="Ən azı 6 simvol"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Button title="Qeydiyyatdan keç" onPress={onSubmit} loading={loading} style={{ marginTop: spacing.sm }} />

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
  logoWrap: { alignItems: 'center', marginBottom: spacing.lg },
  title: { ...typography.h2, color: colors.black, marginTop: spacing.md, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.gray, marginTop: 2, textAlign: 'center' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.grayLight },
  dividerText: { color: colors.gray, fontSize: typography.small.fontSize },
  error: { color: colors.danger, marginBottom: spacing.sm, fontSize: typography.small.fontSize },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg, paddingBottom: spacing.md },
  footerText: { color: colors.gray },
  footerLink: { color: colors.primary, fontWeight: '700' },
});

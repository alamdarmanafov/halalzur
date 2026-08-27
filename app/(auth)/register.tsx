import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Logo } from '../../components/Logo';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { useAuth } from '../../lib/auth-context';
import { colors, spacing, typography } from '../../constants/theme';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.header}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <Logo size={72} />
            <Text style={styles.brand}>Halalzur-a qoşulun</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Hesab yaradın</Text>
            <Text style={styles.subtitle}>Pulsuz başlayın, istədiyiniz zaman Premium-a keçin</Text>

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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'flex-end' },
  logoWrap: { alignItems: 'center', paddingTop: 50, paddingBottom: spacing.lg },
  brand: { ...typography.h2, color: colors.white, marginTop: spacing.sm, textAlign: 'center' },
  card: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: { ...typography.h2, color: colors.black },
  subtitle: { ...typography.body, color: colors.gray, marginBottom: spacing.lg, marginTop: 2 },
  error: { color: colors.danger, marginBottom: spacing.sm, fontSize: typography.small.fontSize },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg, paddingBottom: spacing.md },
  footerText: { color: colors.gray },
  footerLink: { color: colors.primary, fontWeight: '700' },
});

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from '../../components/Logo';
import { AppleSignInButton } from '../../components/AppleSignInButton';
import { GoogleSignInButton } from '../../components/GoogleSignInButton';
import { useAuth, GoogleSignInUnavailableError } from '../../lib/auth-context';
import { colors, spacing, typography } from '../../constants/theme';

export default function LoginScreen() {
  const { signInWithApple, signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const goToTabs = () => router.replace('/(tabs)');

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

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
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

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Hesabınız yoxdur? </Text>
          <Link href="/(auth)/register" replace style={styles.footerLink}>
            Qeydiyyatdan keçin
          </Link>
        </View>
      </ScrollView>
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
  error: { color: colors.danger, marginTop: spacing.md, textAlign: 'center', fontSize: typography.small.fontSize },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl, paddingBottom: spacing.md },
  footerText: { color: colors.gray },
  footerLink: { color: colors.primary, fontWeight: '700' },
});

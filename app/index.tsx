import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../lib/auth-context';
import { hasSeenOnboarding } from '../lib/onboarding';
import { Logo } from '../components/Logo';
import { colors } from '../constants/theme';

export default function Index() {
  const { user, isLoading } = useAuth();
  const [seenOnboarding, setSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    hasSeenOnboarding().then(setSeenOnboarding);
  }, []);

  if (isLoading || seenOnboarding === null) {
    return (
      <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.splash}>
        <Logo size={96} variant="mark" />
        <ActivityIndicator color={colors.white} style={{ marginTop: 24 }} />
      </LinearGradient>
    );
  }

  if (!seenOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href={user ? '/(tabs)' : '/(auth)/welcome'} />;
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

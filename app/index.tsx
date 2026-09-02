import { useEffect, useState } from 'react';
import { Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '../lib/auth-context';
import { hasSeenOnboarding } from '../lib/onboarding';
import { Logo } from '../components/Logo';
import { colors, spacing, typography } from '../constants/theme';

export default function Index() {
  const { user, isLoading } = useAuth();
  const [seenOnboarding, setSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    hasSeenOnboarding().then(setSeenOnboarding);
  }, []);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  if (isLoading || seenOnboarding === null) {
    return (
      <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.splash}>
        <Logo size={128} variant="mark" />
        <Text style={styles.splashWordmark}>Halalzur</Text>
        <ActivityIndicator color={colors.white} style={{ marginTop: 32 }} />
      </LinearGradient>
    );
  }

  if (!seenOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  // Targeting the bare group path here resolved to (tabs)/index.tsx (the
  // Scan camera tab) regardless of the Tabs navigator's initialRouteName —
  // expo-router resolves an unqualified group href to its literal `index`
  // file by routing convention, which wins over that runtime hint. Naming
  // the tab explicitly is what actually makes Products the landing tab.
  return <Redirect href={user ? '/(tabs)/products' : '/(auth)/welcome'} />;
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  splashWordmark: {
    ...typography.h2,
    color: colors.white,
    marginTop: spacing.md,
    letterSpacing: 1,
  },
});

import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../lib/auth-context';
import { Logo } from '../components/Logo';
import { colors } from '../constants/theme';

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.splash}>
        <Logo size={96} variant="mark" />
        <ActivityIndicator color={colors.white} style={{ marginTop: 24 }} />
      </LinearGradient>
    );
  }

  return <Redirect href={user ? '/(tabs)' : '/(auth)/login'} />;
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

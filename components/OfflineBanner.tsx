import { View, Text, StyleSheet } from 'react-native';
import { useNetworkState } from 'expo-network';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../lib/i18n-context';
import { colors, spacing, typography } from '../constants/theme';

/**
 * Always-mounted banner: certification results must come from a live
 * lookup, so the app makes the offline state impossible to miss rather
 * than silently falling back to cached/mock data.
 */
export function OfflineBanner() {
  const network = useNetworkState();
  const { t } = useLanguage();
  const isOffline = network.isConnected === false || network.isInternetReachable === false;

  if (!isOffline) return null;

  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline" size={15} color={colors.white} />
      <Text style={styles.text}>{t('offlineBannerText')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: colors.danger,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingTop: 54,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  text: { color: colors.white, fontWeight: '700', fontSize: typography.small.fontSize, textAlign: 'center' },
});

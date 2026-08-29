import { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Logo } from '../../components/Logo';
import { Button } from '../../components/Button';
import { useAuth } from '../../lib/auth-context';
import { useHistory } from '../../lib/history-context';
import { lookupBarcode } from '../../lib/certification';
import { hasInternetConnection } from '../../lib/network';
import { colors, radius, spacing, typography } from '../../constants/theme';

const FREE_DAILY_SCAN_LIMIT = 3;
const DEMO_BARCODES = ['8690504048068', '8690506042027', '4006381333931', '5449000000996'];

export default function ScanScreen() {
  const { user, incrementScanCount } = useAuth();
  const { addScan } = useHistory();
  const [permission, requestPermission] = useCameraPermissions();
  const [isBusy, setIsBusy] = useState(false);
  const lockRef = useRef(false);

  const isPremium = user?.plan === 'premium';
  const today = new Date().toISOString().slice(0, 10);
  const scansToday = user?.lastScanDate === today ? user?.scansToday ?? 0 : 0;
  const limitReached = !isPremium && scansToday >= FREE_DAILY_SCAN_LIMIT;

  const handleBarcode = useCallback(
    async (barcode: string) => {
      if (lockRef.current || isBusy) return;
      if (limitReached) {
        router.push('/subscription');
        return;
      }
      lockRef.current = true;
      setIsBusy(true);
      try {
        const online = await hasInternetConnection();
        if (!online) {
          Alert.alert(
            'İnternet yoxdur',
            'Halallıq sertifikatını yoxlamaq üçün internetə qoşulun — nəticə heç vaxt offline keşdən göstərilmir.'
          );
          return;
        }
        const result = await lookupBarcode(barcode);
        await addScan(result);
        if (!isPremium) await incrementScanCount();
        router.push({ pathname: '/product/[id]', params: { id: result.barcode } });
      } finally {
        setIsBusy(false);
        setTimeout(() => {
          lockRef.current = false;
        }, 1200);
      }
    },
    [isBusy, limitReached, addScan, incrementScanCount, isPremium]
  );

  const onScanned = useCallback(
    (result: BarcodeScanningResult) => {
      handleBarcode(result.data);
    },
    [handleBarcode]
  );

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.permissionWrap}>
        <Logo size={72} />
        <Text style={styles.permissionTitle}>Kameraya icazə lazımdır</Text>
        <Text style={styles.permissionBody}>
          Məhsulun barkodunu skan edib halallıq statusunu dərhal görmək üçün kameraya icazə verin.
        </Text>
        <Button title="İcazə ver" onPress={requestPermission} style={{ marginTop: spacing.lg, width: '100%' }} />
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr', 'code128'],
        }}
        onBarcodeScanned={isBusy ? undefined : onScanned}
      />

      <LinearGradient
        colors={['rgba(10,77,46,0.85)', 'transparent']}
        style={styles.topOverlay}
      >
        <View style={styles.headerRow}>
          <Logo size={34} />
          <Text style={styles.headerTitle}>Halalzur</Text>
        </View>
        <Text style={styles.headerSubtitle}>Barkodu çərçivəyə salın</Text>
      </LinearGradient>

      <View style={styles.frameWrap} pointerEvents="none">
        <View style={styles.frame} />
        {isBusy && (
          <View style={styles.busyBadge}>
            <ActivityIndicator color={colors.white} size="small" />
            <Text style={styles.busyText}>Sertifikat yoxlanılır…</Text>
          </View>
        )}
      </View>

      <LinearGradient colors={['transparent', 'rgba(10,77,46,0.9)']} style={styles.bottomOverlay}>
        {!isPremium && (
          <Text style={styles.quota}>
            Bu gün {scansToday}/{FREE_DAILY_SCAN_LIMIT} pulsuz skan istifadə olunub
          </Text>
        )}
        <Text style={styles.demoLabel}>Nümunə üçün toxunun:</Text>
        <View style={styles.demoRow}>
          {DEMO_BARCODES.map((code) => (
            <Pressable key={code} style={styles.demoChip} onPress={() => handleBarcode(code)}>
              <Text style={styles.demoChipText}>{code.slice(-4)}</Text>
            </Pressable>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  permissionWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  permissionTitle: { ...typography.h2, color: colors.white, marginTop: spacing.lg, textAlign: 'center' },
  permissionBody: {
    ...typography.body,
    color: colors.surface,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 60, paddingBottom: 24, paddingHorizontal: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitle: { ...typography.h2, color: colors.white },
  headerSubtitle: { ...typography.small, color: colors.surface, marginTop: 4 },
  frameWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: {
    width: 240,
    height: 150,
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: colors.accent,
  },
  busyBadge: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(10,77,46,0.85)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  busyText: { color: colors.white, fontWeight: '600' },
  bottomOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.lg, paddingBottom: spacing.xl },
  quota: { color: colors.surface, textAlign: 'center', marginBottom: spacing.sm, fontSize: typography.small.fontSize },
  demoLabel: { color: colors.surface, fontSize: typography.small.fontSize, marginBottom: spacing.xs, textAlign: 'center' },
  demoRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  demoChip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  demoChipText: { color: colors.white, fontWeight: '700' },
});

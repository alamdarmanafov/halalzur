import { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from '../../components/Logo';
import { Button } from '../../components/Button';
import { BrandModal } from '../../components/BrandModal';
import { useAuth } from '../../lib/auth-context';
import { useHistory } from '../../lib/history-context';
import { useStreak } from '../../lib/streak-context';
import { useLanguage } from '../../lib/i18n-context';
import { lookupBarcode } from '../../lib/certification';
import { logScanEvent } from '../../lib/scanEvents';
import { hasInternetConnection } from '../../lib/network';
import { hapticForStatus } from '../../lib/haptics';
import { colors, radius, spacing, typography } from '../../constants/theme';

const FREE_DAILY_SCAN_LIMIT = 3;
const DEMO_BARCODES = ['8690504048068', '8690506042027', '4006381333931', '5449000000996'];

export default function ScanScreen() {
  const { user, incrementScanCount } = useAuth();
  const { addScan, history } = useHistory();
  const { recordScan } = useStreak();
  const { t } = useLanguage();
  const [permission, requestPermission] = useCameraPermissions();
  const [isBusy, setIsBusy] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const lockRef = useRef(false);

  const isPremium = user?.plan === 'premium';
  const today = new Date().toISOString().slice(0, 10);
  const scansToday = user?.lastScanDate === today ? user?.scansToday ?? 0 : 0;
  const limitReached = !isPremium && scansToday >= FREE_DAILY_SCAN_LIMIT;

  const handleBarcode = useCallback(
    async (barcode: string) => {
      if (lockRef.current || isBusy) return;
      if (limitReached) {
        setShowLimitModal(true);
        return;
      }
      lockRef.current = true;
      setIsBusy(true);
      try {
        const online = await hasInternetConnection();
        if (!online) {
          // Last-100-scans cache: a product already looked up once (even
          // on a previous, connected session) doesn't need network to
          // show again — history already carries the full result, not
          // just the barcode, so this is a real cache hit, not a stub.
          const cached = history.find((h) => h.barcode === barcode);
          if (!cached) {
            Alert.alert(t('scanOfflineTitle'), t('scanOfflineBody'));
            return;
          }
          hapticForStatus(cached.status);
          await addScan(cached);
          recordScan();
          if (!isPremium) await incrementScanCount();
          router.push({ pathname: '/product/[id]', params: { id: cached.barcode } });
          return;
        }
        const result = await lookupBarcode(barcode);
        hapticForStatus(result.status);
        await addScan(result);
        recordScan();
        logScanEvent(result);
        if (!isPremium) await incrementScanCount();
        router.push({ pathname: '/product/[id]', params: { id: result.barcode } });
      } finally {
        setIsBusy(false);
        setTimeout(() => {
          lockRef.current = false;
        }, 1200);
      }
    },
    [isBusy, limitReached, addScan, incrementScanCount, isPremium, history]
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
        <Text style={styles.permissionTitle}>{t('scanPermissionTitle')}</Text>
        <Text style={styles.permissionBody}>{t('scanPermissionBody')}</Text>
        <Button title={t('scanGrantPermission')} onPress={requestPermission} style={{ marginTop: spacing.lg, width: '100%' }} />
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torchOn}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'],
        }}
        onBarcodeScanned={isBusy ? undefined : onScanned}
      />

      <LinearGradient
        colors={['rgba(10,77,46,0.85)', 'transparent']}
        style={styles.topOverlay}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Logo size={34} />
            <Text style={styles.headerTitle}>Halalzur</Text>
          </View>
          <Pressable
            style={[styles.torchBtn, torchOn && styles.torchBtnActive]}
            onPress={() => setTorchOn((v) => !v)}
            accessibilityLabel={t('a11yTorch')}
            accessibilityRole="button"
          >
            <Ionicons name={torchOn ? 'flash' : 'flash-outline'} size={18} color={torchOn ? colors.primaryDark : colors.white} />
          </Pressable>
        </View>
        <Text style={styles.headerSubtitle}>{t('scanFrameHint')}</Text>
        <Pressable
          style={styles.shoppingBtn}
          onPress={() => router.push(isPremium ? '/shopping-scan' : '/subscription')}
        >
          <Ionicons name="cart-outline" size={20} color={colors.white} />
          <Text style={styles.shoppingBtnText}>{t('subFeatureShoppingScan')}</Text>
          {!isPremium && <Ionicons name="lock-closed" size={14} color={colors.white} />}
        </Pressable>
      </LinearGradient>

      <View style={styles.frameWrap} pointerEvents="none">
        <View style={styles.frame} />
        {isBusy && (
          <View style={styles.busyBadge}>
            <ActivityIndicator color={colors.white} size="small" />
            <Text style={styles.busyText}>{t('scanChecking')}</Text>
          </View>
        )}
      </View>

      <LinearGradient colors={['transparent', 'rgba(10,77,46,0.9)']} style={styles.bottomOverlay}>
        {!isPremium && (
          <Text style={styles.quota}>
            {t('scanQuota').replace('{used}', String(scansToday)).replace('{limit}', String(FREE_DAILY_SCAN_LIMIT))}
          </Text>
        )}
        <Pressable
          style={styles.manualEntryBtn}
          onPress={() => {
            setManualBarcode('');
            setShowManualEntry(true);
          }}
          accessibilityLabel={t('manualBarcodeBtn')}
          accessibilityRole="button"
        >
          <Ionicons name="keypad-outline" size={18} color={colors.primaryDark} />
          <Text style={styles.manualEntryBtnText}>{t('manualBarcodeBtn')}</Text>
        </Pressable>
        <Text style={styles.demoLabel}>{t('scanTryDemo')}</Text>
        <View style={styles.demoRow}>
          {DEMO_BARCODES.map((code) => (
            <Pressable key={code} style={styles.demoChip} onPress={() => handleBarcode(code)}>
              <Text style={styles.demoChipText}>{code.slice(-4)}</Text>
            </Pressable>
          ))}
        </View>
      </LinearGradient>

      <BrandModal
        visible={showLimitModal}
        title={t('scanLimitReachedTitle')}
        body={t('scanLimitReachedBody')}
        ctaLabel={t('scanBuyPremium')}
        onCta={() => {
          setShowLimitModal(false);
          router.push('/subscription');
        }}
        onClose={() => setShowLimitModal(false)}
      />

      <Modal
        visible={showManualEntry}
        animationType="fade"
        transparent
        onRequestClose={() => setShowManualEntry(false)}
      >
        <KeyboardAvoidingView style={styles.manualBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.manualCard}>
            <Text style={styles.manualTitle}>{t('manualBarcodeModalTitle')}</Text>
            <TextInput
              value={manualBarcode}
              onChangeText={setManualBarcode}
              placeholder={t('manualBarcodePlaceholder')}
              placeholderTextColor={colors.gray}
              keyboardType="number-pad"
              autoFocus
              style={styles.manualInput}
            />
            <View style={styles.manualActions}>
              <Pressable style={styles.manualCancelBtn} onPress={() => setShowManualEntry(false)}>
                <Text style={styles.manualCancelText}>{t('manualBarcodeCancel')}</Text>
              </Pressable>
              <Button
                title={t('manualBarcodeSubmit')}
                onPress={() => {
                  const code = manualBarcode.trim();
                  if (!/^\d{6,}$/.test(code)) {
                    Alert.alert(t('manualBarcodeModalTitle'), t('manualBarcodeInvalid'));
                    return;
                  }
                  setShowManualEntry(false);
                  handleBarcode(code);
                }}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitle: { ...typography.h2, color: colors.white },
  shoppingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  shoppingBtnText: { color: colors.white, fontWeight: '700', fontSize: typography.body.fontSize },
  torchBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  torchBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
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
  manualEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  manualEntryBtnText: { color: colors.primaryDark, fontWeight: '700', fontSize: typography.body.fontSize },
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
  manualBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(11,19,16,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  manualCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  manualTitle: { ...typography.h3, color: colors.black, marginBottom: spacing.sm },
  manualInput: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.grayLight,
    paddingHorizontal: spacing.md,
    fontSize: typography.body.fontSize,
    color: colors.black,
    backgroundColor: colors.surface,
  },
  manualActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  manualCancelBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.surface },
  manualCancelText: { ...typography.body, color: colors.gray, fontWeight: '600' },
});

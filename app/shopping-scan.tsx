import { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, FlatList } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Logo } from '../components/Logo';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../lib/auth-context';
import { useHistory } from '../lib/history-context';
import { lookupBarcode } from '../lib/certification';
import { logScanEvent } from '../lib/scanEvents';
import { hasInternetConnection } from '../lib/network';
import { hapticForStatus } from '../lib/haptics';
import { CertificationResult } from '../lib/types';
import { colors, radius, spacing, typography } from '../constants/theme';

/**
 * Premium-only: scan a whole basket of products in one continuous
 * session, then see a single Halal/Şübhəli/Tövsiyə edilmir tally instead
 * of checking each product one at a time. Route access itself is gated
 * from app/(tabs)/index.tsx (routes to /subscription if not premium);
 * this screen assumes it's already talking to a premium user.
 */
export default function ShoppingScanScreen() {
  const { incrementScanCount } = useAuth();
  const { addScan } = useHistory();
  const [permission, requestPermission] = useCameraPermissions();
  const [items, setItems] = useState<CertificationResult[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [finished, setFinished] = useState(false);
  const lockRef = useRef(false);

  const handleBarcode = useCallback(
    async (barcode: string) => {
      if (lockRef.current || isBusy) return;
      if (items.some((i) => i.barcode === barcode)) return;
      lockRef.current = true;
      setIsBusy(true);
      try {
        const online = await hasInternetConnection();
        if (!online) return;
        const result = await lookupBarcode(barcode);
        hapticForStatus(result.status);
        setItems((prev) => [...prev, result]);
        await addScan(result);
        logScanEvent(result);
        incrementScanCount();
      } finally {
        setIsBusy(false);
        setTimeout(() => {
          lockRef.current = false;
        }, 900);
      }
    },
    [isBusy, items, addScan, incrementScanCount]
  );

  const onScanned = useCallback(
    (result: BarcodeScanningResult) => {
      handleBarcode(result.data);
    },
    [handleBarcode]
  );

  const halalCount = items.filter((i) => i.status === 'halal').length;
  // 'unknown' reads as mushbooh everywhere else in the app — same here.
  const mushboohCount = items.filter((i) => i.status === 'mushbooh' || i.status === 'unknown').length;
  const haramCount = items.filter((i) => i.status === 'haram').length;

  const resetTrip = () => {
    setItems([]);
    setFinished(false);
  };

  if (finished) {
    return (
      <SafeAreaView style={styles.summaryContainer} edges={['top']}>
        <View style={styles.summaryHeader}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="close" size={22} color={colors.black} />
          </Pressable>
          <Text style={styles.summaryTitle}>Alış-veriş nəticəsi</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.tallyRow}>
          <View style={[styles.tallyCard, { backgroundColor: '#E8F7ED' }]}>
            <Text style={styles.tallyEmoji}>🟢</Text>
            <Text style={[styles.tallyNum, { color: colors.primary }]}>{halalCount}</Text>
            <Text style={styles.tallyLabel}>Halal</Text>
          </View>
          <View style={[styles.tallyCard, { backgroundColor: '#FBF2DE' }]}>
            <Text style={styles.tallyEmoji}>🟡</Text>
            <Text style={[styles.tallyNum, { color: colors.warning }]}>{mushboohCount}</Text>
            <Text style={styles.tallyLabel}>Şübhəli</Text>
          </View>
          <View style={[styles.tallyCard, { backgroundColor: '#FBE9E9' }]}>
            <Text style={styles.tallyEmoji}>🔴</Text>
            <Text style={[styles.tallyNum, { color: colors.danger }]}>{haramCount}</Text>
            <Text style={styles.tallyLabel}>Tövsiyə{'\n'}edilmir</Text>
          </View>
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => item.barcode}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => (
            <Pressable
              style={styles.itemRow}
              onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.barcode } })}
            >
              <Text style={styles.itemEmoji}>{item.imageEmoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.productName}
                </Text>
                <Text style={styles.itemBrand} numberOfLines={1}>
                  {item.brand}
                </Text>
              </View>
              <StatusBadge status={item.status} size="sm" />
            </Pressable>
          )}
        />

        <View style={styles.summaryFooter}>
          <Button
            title="Məhsullara keç"
            onPress={() => router.replace('/(tabs)/products')}
            style={{ marginBottom: spacing.sm }}
          />
          <Pressable onPress={resetTrip}>
            <Text style={styles.doneLink}>Yeni alış-veriş</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

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
        <Button title="İcazə ver" onPress={requestPermission} style={{ marginTop: spacing.lg, width: '100%' }} />
        <Pressable onPress={() => router.back()} style={{ marginTop: spacing.md }}>
          <Text style={styles.permissionCancel}>Ləğv et</Text>
        </Pressable>
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

      <LinearGradient colors={['rgba(10,77,46,0.85)', 'transparent']} style={styles.topOverlay}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.white} />
          </Pressable>
          <View style={styles.cartBadge}>
            <Ionicons name="cart" size={14} color={colors.white} />
            <Text style={styles.cartBadgeText}>Shopping Scan · {items.length}</Text>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>Bir-bir bütün məhsulları skan edin</Text>
      </LinearGradient>

      <View style={styles.frameWrap} pointerEvents="none">
        <View style={styles.frame} />
        {isBusy && (
          <View style={styles.busyBadge}>
            <ActivityIndicator color={colors.white} size="small" />
            <Text style={styles.busyText}>Yoxlanılır…</Text>
          </View>
        )}
      </View>

      <LinearGradient colors={['transparent', 'rgba(10,77,46,0.9)']} style={styles.bottomOverlay}>
        {items.length > 0 && (
          <View style={styles.miniTallyRow}>
            <Text style={styles.miniTally}>🟢 {halalCount}</Text>
            <Text style={styles.miniTally}>🟡 {mushboohCount}</Text>
            <Text style={styles.miniTally}>🔴 {haramCount}</Text>
          </View>
        )}
        <Button
          title={`Bitir${items.length > 0 ? ` (${items.length})` : ''}`}
          onPress={() => setFinished(true)}
          disabled={items.length === 0}
          style={{ width: '100%' }}
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  permissionWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  permissionTitle: { ...typography.h2, color: colors.white, marginTop: spacing.lg, textAlign: 'center' },
  permissionCancel: { color: colors.surface, fontWeight: '600' },
  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 60, paddingBottom: 24, paddingHorizontal: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  cartBadgeText: { color: colors.white, fontWeight: '700', fontSize: 12 },
  headerSubtitle: { ...typography.small, color: colors.surface, marginTop: spacing.sm, textAlign: 'center' },
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
  miniTallyRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg, marginBottom: spacing.md },
  miniTally: { color: colors.white, fontWeight: '700', fontSize: 15 },

  summaryContainer: { flex: 1, backgroundColor: colors.white },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: { ...typography.h3, color: colors.black },
  tallyRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginVertical: spacing.lg },
  tallyCard: { flex: 1, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center' },
  tallyEmoji: { fontSize: 22 },
  tallyNum: { ...typography.h1, marginTop: 4 },
  tallyLabel: { ...typography.small, color: colors.gray, textAlign: 'center', marginTop: 2 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  itemEmoji: { fontSize: 26 },
  itemName: { ...typography.body, color: colors.black, fontWeight: '700' },
  itemBrand: { ...typography.small, color: colors.gray, marginTop: 2 },
  summaryFooter: { padding: spacing.lg },
  doneLink: { textAlign: 'center', color: colors.gray, fontWeight: '600' },
});

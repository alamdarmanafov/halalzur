import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, TextInput, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { lookupBarcode } from '../../lib/certification';
import { extractECodesFromText } from '../../lib/eCodes';
import { recognizeIngredientText } from '../../lib/ocr';
import { CertificationResult } from '../../lib/types';
import { StatusBadge } from '../../components/StatusBadge';
import { ECodeCard } from '../../components/ECodeCard';
import { colors, radius, spacing, typography } from '../../constants/theme';

const STATUS_TINT: Record<CertificationResult['status'], string> = {
  halal: colors.primary,
  haram: colors.danger,
  mushbooh: colors.warning,
  unknown: colors.gray,
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<CertificationResult | null>(null);
  const [manualIngredients, setManualIngredients] = useState('');
  const [ingredientPhoto, setIngredientPhoto] = useState<string | null>(null);
  const [scanningPhoto, setScanningPhoto] = useState(false);

  useEffect(() => {
    if (!id) return;
    lookupBarcode(id).then(setProduct);
  }, [id]);

  const hasKnownIngredients = (product?.ingredients.length ?? 0) > 0;
  const detectedECodes = useMemo(
    () =>
      extractECodesFromText(
        hasKnownIngredients ? product!.ingredients.join(', ') : manualIngredients
      ),
    [hasKnownIngredients, product, manualIngredients]
  );

  const captureIngredientPhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('İcazə lazımdır', 'Tərkib şəklini çəkmək üçün kameraya icazə verin.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    });
    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;
    setIngredientPhoto(uri);
    setScanningPhoto(true);
    try {
      const recognizedText = await recognizeIngredientText(uri);
      if (recognizedText) {
        setManualIngredients((prev) => (prev ? `${prev}\n${recognizedText}` : recognizedText));
      }
    } finally {
      setScanningPhoto(false);
    }
  };

  if (!product) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  const tint = STATUS_TINT[product.status];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.black} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <View style={styles.hero}>
          <Text style={styles.emoji}>{product.imageEmoji}</Text>
          <Text style={styles.name}>{product.productName}</Text>
          <Text style={styles.brand}>
            {product.brand} · {product.category}
          </Text>
          <View style={{ marginTop: spacing.sm }}>
            <StatusBadge status={product.status} />
          </View>
        </View>

        <View style={[styles.certifierCard, { borderColor: tint }]}>
          <Ionicons name="shield-checkmark" size={22} color={tint} />
          <View style={{ flex: 1 }}>
            <Text style={styles.certifierTitle}>
              {product.certifier ? product.certifier.shortName : 'Sertifikat tapılmadı'}
            </Text>
            <Text style={styles.certifierBody}>
              {product.certifier
                ? `${product.certifier.name} (${product.certifier.country})`
                : 'Bu məhsul üçün tanınan halallıq sertifikat orqanından təsdiq tapılmadı.'}
            </Text>
            {product.certificateNumber && (
              <Text style={styles.certNumber}>Sertifikat №: {product.certificateNumber}</Text>
            )}
            {product.verifiedAt && (
              <Text style={styles.certNumber}>Yoxlanma tarixi: {product.verifiedAt}</Text>
            )}
          </View>
        </View>

        {product.notes && (
          <View style={styles.noteCard}>
            <Ionicons name="information-circle" size={18} color={colors.warning} />
            <Text style={styles.noteText}>{product.notes}</Text>
          </View>
        )}

        {product.ingredients.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tərkib</Text>
            <View style={styles.ingredientWrap}>
              {product.ingredients.map((ing) => (
                <View key={ing} style={styles.ingredientChip}>
                  <Text style={styles.ingredientText}>{ing}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {!hasKnownIngredients && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tərkibi yoxlayın</Text>
            <Text style={styles.eCodeIntro}>
              Bu barkod bazamızda yoxdur. Məhsulun qablaşdırmasındakı tərkib hissəsinin şəklini
              çəkin — tərkibdəki E-kodları tapıb sertifikat orqanlarının onlar haqqında dediyini
              göstərəcəyik.
            </Text>

            <Pressable style={styles.photoBtn} onPress={captureIngredientPhoto}>
              <Ionicons name="camera" size={18} color={colors.primaryDark} />
              <Text style={styles.photoBtnText}>
                {ingredientPhoto ? 'Yenidən şəkil çək' : 'Tərkib şəklini çək'}
              </Text>
            </Pressable>

            {ingredientPhoto && (
              <View style={styles.photoPreviewWrap}>
                <Image source={{ uri: ingredientPhoto }} style={styles.photoPreview} />
                {scanningPhoto && (
                  <View style={styles.photoPreviewOverlay}>
                    <ActivityIndicator color={colors.white} />
                    <Text style={styles.photoPreviewOverlayText}>Mətn tanınır…</Text>
                  </View>
                )}
              </View>
            )}

            <Text style={styles.manualLabel}>
              {ingredientPhoto
                ? 'Şəkildəki tərkibi (xüsusilə E-kodları) buraya yazın:'
                : 'Yaxud tərkibi əl ilə yazın:'}
            </Text>
            <TextInput
              value={manualIngredients}
              onChangeText={setManualIngredients}
              placeholder="Məs: Şəkər, Bitki yağı, E471, E120, Vanil aromatı…"
              placeholderTextColor={colors.gray}
              multiline
              style={styles.manualInput}
            />
          </View>
        )}

        {detectedECodes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>E-kodlar üçün sertifikat orqanlarının fikri</Text>
            <Text style={styles.eCodeIntro}>
              Bunlar AI qərarı deyil — halal sertifikat orqanlarının öz dərc etdiyi E-kod
              təsnifatından götürülüb.
            </Text>
            {detectedECodes.map((entry) => (
              <ECodeCard key={entry.code} entry={entry} />
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Barkod</Text>
          <Text style={styles.barcode}>{product.barcode}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { alignItems: 'center', paddingVertical: spacing.lg },
  emoji: { fontSize: 56 },
  name: { ...typography.h1, color: colors.black, marginTop: spacing.sm, textAlign: 'center', paddingHorizontal: spacing.lg },
  brand: { ...typography.body, color: colors.gray, marginTop: 4 },
  certifierCard: {
    flexDirection: 'row',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: spacing.md,
  },
  certifierTitle: { ...typography.h3, color: colors.black },
  certifierBody: { ...typography.small, color: colors.gray, marginTop: 2 },
  certNumber: { ...typography.small, color: colors.primaryDark, marginTop: spacing.xs, fontWeight: '600' },
  noteCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: '#FBF3DF',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noteText: { flex: 1, ...typography.small, color: '#7A5B10' },
  section: { marginHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionTitle: { ...typography.h3, color: colors.black, marginBottom: spacing.sm },
  eCodeIntro: { ...typography.small, color: colors.gray, marginBottom: spacing.sm, lineHeight: 18 },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    height: 46,
    marginBottom: spacing.sm,
  },
  photoBtnText: { ...typography.body, color: colors.primaryDark, fontWeight: '700' },
  photoPreviewWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    position: 'relative',
  },
  photoPreview: { width: '100%', height: 160, backgroundColor: colors.surface },
  photoPreviewOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10,77,46,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  photoPreviewOverlayText: { color: colors.white, fontWeight: '700', fontSize: typography.small.fontSize },
  manualLabel: { ...typography.small, color: colors.primaryDark, fontWeight: '700', marginBottom: spacing.xs },
  manualInput: {
    minHeight: 84,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.grayLight,
    padding: spacing.md,
    fontSize: typography.body.fontSize,
    color: colors.black,
    textAlignVertical: 'top',
    backgroundColor: colors.surface,
  },
  ingredientWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  ingredientChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  ingredientText: { ...typography.small, color: colors.primaryDark },
  barcode: { ...typography.body, color: colors.gray, letterSpacing: 2 },
});

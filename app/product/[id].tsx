import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  TextInput,
  Image,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { lookupBarcode, statusDescription, getHalalAlternatives, getDistinctBrands } from '../../lib/certification';
import { PRODUCT_CATEGORIES } from '../../lib/categories';
import { extractECodesFromText, searchECodes, eCodeStatusLabel } from '../../lib/eCodes';
import { recognizeIngredientText } from '../../lib/ocr';
import { hasInternetConnection } from '../../lib/network';
import { useFavorites } from '../../lib/favorites-context';
import { useHistory } from '../../lib/history-context';
import { useAuth } from '../../lib/auth-context';
import { submitProduct, hasSubmittedProduct } from '../../lib/submissions';
import { sendPushNotification } from '../../lib/pushNotify';
import { CertificationResult } from '../../lib/types';
import { StatusBadge } from '../../components/StatusBadge';
import { ECodeCard } from '../../components/ECodeCard';
import { Button } from '../../components/Button';
import { colors, radius, spacing, typography } from '../../constants/theme';

// unknown shares mushbooh's yellow tint — see components/StatusBadge.tsx
const STATUS_TINT: Record<CertificationResult['status'], string> = {
  halal: colors.primary,
  haram: colors.danger,
  mushbooh: colors.warning,
  unknown: colors.warning,
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const isPremium = user?.plan === 'premium';
  const { isFavorite, toggleFavorite } = useFavorites();
  const { history, removeScan } = useHistory();
  const [product, setProduct] = useState<CertificationResult | null>(null);
  const [alternatives, setAlternatives] = useState<CertificationResult[]>([]);
  const [manualIngredients, setManualIngredients] = useState('');
  const [ingredientPhoto, setIngredientPhoto] = useState<string | null>(null);
  const [scanningPhoto, setScanningPhoto] = useState(false);
  const [offline, setOffline] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);
  const [submitName, setSubmitName] = useState('');
  const [submitBrand, setSubmitBrand] = useState('');
  const [submitCategory, setSubmitCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ecodePickerVisible, setEcodePickerVisible] = useState(false);
  const [ecodeQuery, setEcodeQuery] = useState('');
  const [fieldPicker, setFieldPicker] = useState<'brand' | 'category' | null>(null);
  const [fieldPickerQuery, setFieldPickerQuery] = useState('');
  const [brandOptions, setBrandOptions] = useState<string[]>([]);

  useEffect(() => {
    getDistinctBrands()
      .then(setBrandOptions)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setOffline(false);
    hasInternetConnection().then((online) => {
      if (cancelled) return;
      if (!online) {
        setOffline(true);
        return;
      }
      lookupBarcode(id).then((result) => {
        if (!cancelled) setProduct(result);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [id, reloadTick]);

  useEffect(() => {
    if (!user || !id) return;
    let cancelled = false;
    setSubmitted(false);
    hasSubmittedProduct(user.id, id)
      .then((exists) => {
        if (!cancelled && exists) setSubmitted(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user, id]);

  useEffect(() => {
    if (!product || product.status === 'halal' || !isPremium) {
      setAlternatives([]);
      return;
    }
    let cancelled = false;
    getHalalAlternatives(product.category, product.barcode).then((results) => {
      if (!cancelled) setAlternatives(results);
    });
    return () => {
      cancelled = true;
    };
  }, [product, isPremium]);

  const hasKnownIngredients = (product?.ingredients.length ?? 0) > 0;
  const detectedECodes = useMemo(
    () =>
      extractECodesFromText(
        hasKnownIngredients ? product!.ingredients.join(', ') : manualIngredients
      ),
    [hasKnownIngredients, product, manualIngredients]
  );

  const hasECode = (code: string) =>
    manualIngredients
      .split(',')
      .map((s) => s.trim().toUpperCase().replace(/\s+/g, ''))
      .includes(code.toUpperCase());

  const toggleECode = (code: string) => {
    const parts = manualIngredients.split(',').map((s) => s.trim()).filter(Boolean);
    const norm = (s: string) => s.toUpperCase().replace(/\s+/g, '');
    const next = hasECode(code)
      ? parts.filter((p) => norm(p) !== norm(code))
      : [...parts, code];
    setManualIngredients(next.join(', '));
  };

  const fieldPickerOptions = fieldPicker === 'brand' ? brandOptions : [...PRODUCT_CATEGORIES];
  const filteredFieldPickerOptions = fieldPickerOptions.filter((o) =>
    o.toLowerCase().includes(fieldPickerQuery.trim().toLowerCase())
  );
  const fieldPickerExactMatch = filteredFieldPickerOptions.some(
    (o) => o.toLowerCase() === fieldPickerQuery.trim().toLowerCase()
  );

  const openFieldPicker = (which: 'brand' | 'category') => {
    setFieldPicker(which);
    setFieldPickerQuery(which === 'brand' ? submitBrand : submitCategory);
  };

  const selectFieldPickerValue = (value: string) => {
    if (fieldPicker === 'brand') setSubmitBrand(value);
    if (fieldPicker === 'category') setSubmitCategory(value);
    setFieldPicker(null);
    setFieldPickerQuery('');
  };

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

  const handleSubmitProduct = async () => {
    if (!user || !product) return;
    if (!submitName.trim() || !submitBrand.trim()) {
      Alert.alert('Doldurun', 'Məhsulun adı və markası tələb olunur.');
      return;
    }
    setSubmitting(true);
    try {
      await submitProduct({
        userId: user.id,
        userName: user.name,
        barcode: product.barcode,
        productName: submitName.trim(),
        brand: submitBrand.trim(),
        category: submitCategory.trim(),
        // Halal status is never a user self-declaration — admin decides
        // it in the admin panel's Təkliflər review before approving.
        suggestedStatus: 'unknown',
        ingredients: manualIngredients
          ? manualIngredients.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        notes: manualIngredients,
      });
      setSubmitted(true);
      sendPushNotification(
        user.id,
        'Təklif göndərildi ✅',
        `"${submitName.trim()}" təklifiniz baxılmaq üçün göndərildi.`
      );
    } catch (err: any) {
      Alert.alert('Göndərilmədi', err.message ?? 'Xəta baş verdi, yenidən cəhd edin.');
    } finally {
      setSubmitting(false);
    }
  };

  if (offline) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.gray} />
        <Text style={styles.offlineTitle}>İnternet bağlantısı yoxdur</Text>
        <Text style={styles.offlineBody}>
          Sertifikat nəticəsi keşdən göstərilmir — yoxlamaq üçün internetə qoşulun.
        </Text>
        <Button
          title="Yenidən cəhd et"
          onPress={() => setReloadTick((n) => n + 1)}
          style={{ marginTop: spacing.lg, width: 200 }}
        />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  const tint = STATUS_TINT[product.status];
  const isInHistory = history.some((h) => h.barcode === product.barcode);

  const handleDeleteFromHistory = () => {
    Alert.alert(
      'Tarixçədən sil',
      'Bu məhsul səhv tanınıbsa, onu skan tarixçənizdən silə bilərsiniz.',
      [
        { text: 'Ləğv et', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            await removeScan(product.barcode);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.black} />
        </Pressable>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {isInHistory && (
            <Pressable onPress={handleDeleteFromHistory} style={styles.backBtn}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          )}
          <Pressable onPress={() => toggleFavorite(product)} style={styles.backBtn}>
            <Ionicons
              name={isFavorite(product.barcode) ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite(product.barcode) ? colors.danger : colors.black}
            />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.productImage} resizeMode="contain" />
          ) : (
            <Text style={styles.emoji}>{product.imageEmoji}</Text>
          )}
          <Text style={styles.name}>{product.productName}</Text>
          <Text style={styles.brand}>
            {product.brand} · {product.category}
          </Text>
          <View style={{ marginTop: spacing.sm }}>
            <StatusBadge status={product.status} />
          </View>
          <Text style={styles.statusDesc}>{statusDescription[product.status]}</Text>
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

        {product.status !== 'halal' && isPremium && alternatives.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="leaf" size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Halal Alternatives</Text>
            </View>
            <Text style={styles.eCodeIntro}>
              Bu məhsul əvəzinə {alternatives.length} halal alternativ tapdıq.
            </Text>
            {alternatives.map((alt) => (
              <Pressable
                key={alt.barcode}
                style={styles.altCard}
                onPress={() => router.push({ pathname: '/product/[id]', params: { id: alt.barcode } })}
              >
                <Text style={styles.altEmoji}>{alt.imageEmoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.altName} numberOfLines={1}>
                    {alt.productName}
                  </Text>
                  <Text style={styles.altBrand} numberOfLines={1}>
                    {alt.brand}
                  </Text>
                </View>
                <StatusBadge status={alt.status} size="sm" />
              </Pressable>
            ))}
          </View>
        )}

        {product.status !== 'halal' && !isPremium && (
          <View style={styles.section}>
            <Pressable style={styles.lockedCard} onPress={() => router.push('/subscription')}>
              <Ionicons name="leaf" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.lockedTitle}>Halal Alternatives</Text>
                <Text style={styles.lockedBody}>
                  Bu kateqoriyada halal alternativləri görmək üçün Premium-a keçin.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.grayLight} />
            </Pressable>
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

            <Pressable style={styles.ecodePickerBtn} onPress={() => setEcodePickerVisible(true)}>
              <Ionicons name="flask-outline" size={16} color={colors.primaryDark} />
              <Text style={styles.ecodePickerBtnText}>Siyahıdan E-kod seç</Text>
            </Pressable>

            <View style={styles.submitDivider} />

            {submitted ? (
              <View style={styles.submittedBox}>
                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                <Text style={styles.submittedText}>
                  Təklifiniz göndərildi! Baxılıb təsdiqlənəndə xal qazanacaqsınız.
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Bu məhsulu icmaya təklif edin</Text>
                <Text style={styles.eCodeIntro}>
                  Məhsulu özünüz yoxlamısınızsa, təklif edin — komandamız baxıb təsdiqləyəndə
                  bazaya əlavə olunur və siz xal qazanırsınız.
                </Text>
                <TextInput
                  value={submitName}
                  onChangeText={setSubmitName}
                  placeholder="Məhsulun adı"
                  placeholderTextColor={colors.gray}
                  style={styles.submitInput}
                />
                <Pressable style={styles.submitPicker} onPress={() => openFieldPicker('brand')}>
                  <Text style={submitBrand ? styles.submitPickerText : styles.submitPickerPlaceholder}>
                    {submitBrand || 'Marka seçin və ya yeni yazın'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={colors.gray} />
                </Pressable>
                <Pressable style={styles.submitPicker} onPress={() => openFieldPicker('category')}>
                  <Text style={submitCategory ? styles.submitPickerText : styles.submitPickerPlaceholder}>
                    {submitCategory || 'Kateqoriya seçin və ya yeni yazın'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={colors.gray} />
                </Pressable>
                <Text style={styles.eCodeIntro}>
                  Halallıq statusunu özünüz seçmirsiniz — komandamız yoxlayıb qərar verəcək.
                </Text>
                <Button
                  title={submitting ? 'Göndərilir…' : 'Təklif et'}
                  onPress={handleSubmitProduct}
                  loading={submitting}
                  style={{ marginTop: spacing.sm }}
                />
              </>
            )}
          </View>
        )}

        {detectedECodes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="flask" size={18} color={colors.primaryDark} />
              <Text style={styles.sectionTitle}>Deep Ingredient Check</Text>
            </View>
            {isPremium ? (
              <>
                <Text style={styles.eCodeIntro}>
                  Bunlar AI qərarı deyil — halal sertifikat orqanlarının öz dərc etdiyi E-kod
                  təsnifatından götürülüb.
                </Text>
                {detectedECodes.map((entry) => (
                  <ECodeCard key={entry.code} entry={entry} />
                ))}
              </>
            ) : (
              <Pressable style={styles.lockedCard} onPress={() => router.push('/subscription')}>
                <Ionicons name="lock-closed" size={20} color={colors.primaryDark} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.lockedTitle}>
                    {detectedECodes.length} tərkib komponenti araşdırılıb
                  </Text>
                  <Text style={styles.lockedBody}>
                    Hansı komponentin niyə şübhəli olduğunu görmək üçün Premium-a keçin.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.grayLight} />
              </Pressable>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Barkod</Text>
          <Text style={styles.barcode}>{product.barcode}</Text>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={ecodePickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEcodePickerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>E-kod seç</Text>
              <Pressable onPress={() => setEcodePickerVisible(false)}>
                <Ionicons name="close" size={22} color={colors.gray} />
              </Pressable>
            </View>
            <TextInput
              value={ecodeQuery}
              onChangeText={setEcodeQuery}
              placeholder="Kod, ad və ya kateqoriya axtar (məs. E471, jelatin)"
              placeholderTextColor={colors.gray}
              style={styles.ecodeSearchInput}
            />
            <FlatList
              data={searchECodes(ecodeQuery)}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => {
                const selected = hasECode(item.code);
                return (
                  <Pressable style={styles.ecodeRow} onPress={() => toggleECode(item.code)}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ecodeRowCode}>
                        {item.code} · {item.name}
                      </Text>
                      <Text style={styles.ecodeRowMeta}>
                        {item.category} · {eCodeStatusLabel[item.status]}
                      </Text>
                    </View>
                    <Ionicons
                      name={selected ? 'checkmark-circle' : 'add-circle-outline'}
                      size={22}
                      color={selected ? colors.primary : colors.grayLight}
                    />
                  </Pressable>
                );
              }}
              style={{ maxHeight: 360 }}
            />
            <Text style={[styles.eCodeIntro, { marginTop: spacing.sm, marginBottom: 0 }]}>
              Seçdiyiniz kodlar yuxarıdakı tərkib sahəsinə əlavə olunur — admin baxıb doğruluğunu
              yoxlayacaq.
            </Text>
          </View>
        </View>
      </Modal>

      <Modal
        visible={fieldPicker !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setFieldPicker(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {fieldPicker === 'brand' ? 'Marka seç' : 'Kateqoriya seç'}
              </Text>
              <Pressable onPress={() => setFieldPicker(null)}>
                <Ionicons name="close" size={22} color={colors.gray} />
              </Pressable>
            </View>
            <TextInput
              value={fieldPickerQuery}
              onChangeText={setFieldPickerQuery}
              placeholder={fieldPicker === 'brand' ? 'Marka axtar və ya yeni yazın' : 'Kateqoriya axtar və ya yeni yazın'}
              placeholderTextColor={colors.gray}
              style={styles.ecodeSearchInput}
              autoFocus
            />
            <FlatList
              data={filteredFieldPickerOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable style={styles.ecodeRow} onPress={() => selectFieldPickerValue(item)}>
                  <Text style={styles.ecodeRowCode}>{item}</Text>
                </Pressable>
              )}
              style={{ maxHeight: 280 }}
              ListEmptyComponent={
                <Text style={[styles.eCodeIntro, { marginTop: spacing.sm }]}>
                  Uyğun nəticə tapılmadı — aşağıdan yenisini əlavə edə bilərsiniz.
                </Text>
              }
            />
            {fieldPickerQuery.trim().length > 0 && !fieldPickerExactMatch && (
              <Pressable
                style={styles.addNewRow}
                onPress={() => selectFieldPickerValue(fieldPickerQuery.trim())}
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={styles.addNewRowText}>"{fieldPickerQuery.trim()}" əlavə et (yeni)</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  offlineTitle: { ...typography.h3, color: colors.black, marginTop: spacing.md, textAlign: 'center' },
  offlineBody: { ...typography.small, color: colors.gray, marginTop: spacing.xs, textAlign: 'center' },
  header: {
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
  hero: { alignItems: 'center', paddingVertical: spacing.lg },
  emoji: { fontSize: 56 },
  productImage: { width: 120, height: 120, borderRadius: radius.lg },
  name: { ...typography.h1, color: colors.black, marginTop: spacing.sm, textAlign: 'center', paddingHorizontal: spacing.lg },
  brand: { ...typography.body, color: colors.gray, marginTop: 4 },
  statusDesc: {
    ...typography.small,
    color: colors.gray,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    lineHeight: 18,
  },
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
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  lockedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    padding: spacing.md,
  },
  lockedTitle: { ...typography.body, color: colors.black, fontWeight: '700' },
  lockedBody: { ...typography.small, color: colors.gray, marginTop: 2, lineHeight: 17 },
  altCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  altEmoji: { fontSize: 24 },
  altName: { ...typography.body, color: colors.black, fontWeight: '700' },
  altBrand: { ...typography.small, color: colors.gray },
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
  ecodePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  ecodePickerBtnText: { ...typography.small, color: colors.primaryDark, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: { ...typography.h2, color: colors.black },
  ecodeSearchInput: {
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.grayLight,
    paddingHorizontal: spacing.md,
    fontSize: typography.body.fontSize,
    color: colors.black,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  ecodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  ecodeRowCode: { ...typography.body, color: colors.black, fontWeight: '700' },
  ecodeRowMeta: { ...typography.small, color: colors.gray, marginTop: 2 },
  submitDivider: { height: 1, backgroundColor: colors.surface, marginVertical: spacing.lg },
  submitInput: {
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.grayLight,
    paddingHorizontal: spacing.md,
    fontSize: typography.body.fontSize,
    color: colors.black,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  submitPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.grayLight,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  submitPickerText: { ...typography.body, color: colors.black },
  submitPickerPlaceholder: { ...typography.body, color: colors.gray },
  addNewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  addNewRowText: { ...typography.small, color: colors.primaryDark, fontWeight: '700' },
  submittedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  submittedText: { flex: 1, ...typography.small, color: colors.primaryDark, lineHeight: 18 },
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

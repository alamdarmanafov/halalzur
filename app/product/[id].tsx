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
  Linking,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { lookupBarcode, STATUS_DESC_KEY, getHalalAlternatives, getDistinctBrands } from '../../lib/certification';
import { PRODUCT_CATEGORIES, getProductCategories } from '../../lib/categories';
import { extractECodesFromText, searchECodes, ECODE_STATUS_LABEL_KEY } from '../../lib/eCodes';
import { extractHaramKeywords } from '../../lib/haramKeywords';
import { recognizeIngredientText } from '../../lib/ocr';
import { hasInternetConnection } from '../../lib/network';
import { useFavorites } from '../../lib/favorites-context';
import { useHistory } from '../../lib/history-context';
import { useAuth } from '../../lib/auth-context';
import { useLanguage } from '../../lib/i18n-context';
import { translateIngredientTerm } from '../../lib/ingredientGlossary';
import { submitProduct, hasSubmittedProduct } from '../../lib/submissions';
import { getRecommendCount, hasRecommended, toggleRecommend } from '../../lib/recommendations';
import { getRatingSummary, getMyRating, setRating, RatingSummary } from '../../lib/ratings';
import { isFollowingBrand, followBrand, unfollowBrand } from '../../lib/brandFollows';
import { useLiteMode } from '../../lib/liteMode-context';
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
  const { t, language } = useLanguage();
  const { liteMode } = useLiteMode();
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
  const [categoryOptions, setCategoryOptions] = useState<string[]>([...PRODUCT_CATEGORIES]);
  const [recommended, setRecommended] = useState(false);
  const [recommendCount, setRecommendCount] = useState(0);
  const [recommending, setRecommending] = useState(false);
  const [followingBrand, setFollowingBrand] = useState(false);
  const [ratingSummary, setRatingSummary] = useState<RatingSummary>({ average: 0, count: 0 });
  const [myRating, setMyRating] = useState(0);

  useEffect(() => {
    getDistinctBrands()
      .then(setBrandOptions)
      .catch(() => {});
  }, []);

  useEffect(() => {
    getProductCategories()
      .then(setCategoryOptions)
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
        if (cancelled) return;
        setProduct(result);
        // External lookups (Open Food Facts/UPCitemdb) often already know
        // the name/brand/category even when they don't know the halal
        // status — prefilling these saves retyping what we already have.
        if (result.status === 'unknown') {
          if (result.productName && result.productName !== 'Naməlum məhsul') {
            setSubmitName((prev) => prev || result.productName);
          }
          if (result.brand && result.brand !== '—') {
            setSubmitBrand((prev) => prev || result.brand);
          }
          if (result.category && result.category !== '—') {
            setSubmitCategory((prev) => prev || result.category);
          }
        }
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
    if (!id) return;
    let cancelled = false;
    getRecommendCount(id).then((n) => {
      if (!cancelled) setRecommendCount(n);
    });
    if (user) {
      hasRecommended(user.id, id).then((yes) => {
        if (!cancelled) setRecommended(yes);
      });
    } else {
      setRecommended(false);
    }
    return () => {
      cancelled = true;
    };
  }, [id, user]);

  useEffect(() => {
    if (!user || !product) {
      setFollowingBrand(false);
      return;
    }
    let cancelled = false;
    isFollowingBrand(user.id, product.brand).then((yes) => {
      if (!cancelled) setFollowingBrand(yes);
    });
    return () => {
      cancelled = true;
    };
  }, [user, product?.brand]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getRatingSummary(id).then((summary) => {
      if (!cancelled) setRatingSummary(summary);
    });
    if (user) {
      getMyRating(user.id, id).then((r) => {
        if (!cancelled) setMyRating(r);
      });
    } else {
      setMyRating(0);
    }
    return () => {
      cancelled = true;
    };
  }, [id, user]);

  const onRateProduct = async (rating: number) => {
    if (!product) return;
    if (!user) {
      Alert.alert(t('productRecommendSignInTitle'), t('productRecommendSignInBody'));
      return;
    }
    const previous = myRating;
    setMyRating(rating);
    try {
      await setRating(user.id, product.barcode, rating);
      const summary = await getRatingSummary(product.barcode);
      setRatingSummary(summary);
    } catch (err: any) {
      setMyRating(previous);
      Alert.alert(t('productSubmitFailedTitle'), err.message ?? t('productSubmitFailedBody'));
    }
  };

  const onToggleFollowBrand = async () => {
    if (!user || !product) {
      Alert.alert(t('productRecommendSignInTitle'), t('productRecommendSignInBody'));
      return;
    }
    const next = !followingBrand;
    setFollowingBrand(next);
    if (next) await followBrand(user.id, product.brand);
    else await unfollowBrand(user.id, product.brand);
  };

  const onToggleRecommend = async () => {
    if (!product) return;
    if (!user) {
      Alert.alert(t('productRecommendSignInTitle'), t('productRecommendSignInBody'));
      return;
    }
    setRecommending(true);
    const next = !recommended;
    try {
      await toggleRecommend(user.id, product.barcode, recommended);
      setRecommended(next);
      setRecommendCount((n) => n + (next ? 1 : -1));
    } catch (err: any) {
      Alert.alert(t('productSubmitFailedTitle'), err.message ?? t('productSubmitFailedBody'));
    } finally {
      setRecommending(false);
    }
  };

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
  const ingredientText = hasKnownIngredients ? product!.ingredients.join(', ') : manualIngredients;
  const detectedECodes = useMemo(() => extractECodesFromText(ingredientText), [ingredientText]);
  // Named ingredients (not E-codes) that are haram/source-dependent —
  // catches "gelatin" or "donuz yağı" written out by name, which the
  // E-code regex above never sees since it only matches "E" + digits.
  const detectedKeywords = useMemo(() => extractHaramKeywords(ingredientText), [ingredientText]);
  // Which detected E-codes/keywords actually explain a mushbooh/haram
  // verdict — shown as the "why" next to the certifier card so a
  // flagged status isn't just a bare badge with no visible reason.
  // Includes "depends" codes too (E_CODES has no data with status
  // "mushbooh" at all — every yellow/cautionary code in the real table
  // is "depends"), not just the earlier haram-only version.
  const flaggedIngredients = useMemo(
    () => [
      ...detectedECodes
        .filter((e) => e.status === 'haram' || e.status === 'mushbooh' || e.status === 'depends')
        .map((e) => `${e.code} (${e.name})`),
      ...detectedKeywords.map((k) => k.keyword),
    ],
    [detectedECodes, detectedKeywords]
  );
  // A halal-status product can still contain a source-dependent
  // ("yellow") E-code or named ingredient — E471, E322, gelatin, etc. —
  // that isn't itself grounds for a haram/mushbooh verdict but is worth
  // a heads-up. Only shown when the product ISN'T already haram/mushbooh
  // (that case gets the fuller "why this status" card above via
  // flaggedIngredients) and there's no haram signal mixed in (a real
  // haram code/keyword always takes the reason-card path, not this
  // softer caution note).
  const cautionIngredients = useMemo(
    () => [
      ...detectedECodes.filter((e) => e.status === 'mushbooh' || e.status === 'depends').map((e) => `${e.code} (${e.name})`),
      ...detectedKeywords.filter((k) => k.status === 'mushbooh').map((k) => k.keyword),
    ],
    [detectedECodes, detectedKeywords]
  );
  const hasHaramIngredient = useMemo(
    () => detectedECodes.some((e) => e.status === 'haram') || detectedKeywords.some((k) => k.status === 'haram'),
    [detectedECodes, detectedKeywords]
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

  const fieldPickerOptions = fieldPicker === 'brand' ? brandOptions : categoryOptions;
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
      Alert.alert(t('productPermissionNeededTitle'), t('productPermissionNeededBody'));
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
    if (!submitName.trim() || !submitBrand.trim() || !submitCategory.trim()) {
      Alert.alert(t('productFillRequiredTitle'), t('productFillRequiredBody'));
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
        t('productSubmittedPushTitle'),
        `"${submitName.trim()}" ${t('productSubmittedPushBody')}`,
        { route: `/product/${product.barcode}` }
      );
    } catch (err: any) {
      Alert.alert(t('productSubmitFailedTitle'), err.message ?? t('productSubmitFailedBody'));
    } finally {
      setSubmitting(false);
    }
  };

  if (offline) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.gray} />
        <Text style={styles.offlineTitle}>{t('productOfflineTitle')}</Text>
        <Text style={styles.offlineBody}>{t('productOfflineBody')}</Text>
        <Button
          title={t('productRetry')}
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

  // Web link works for anyone (shows a preview + "open in app" button on
  // website/product.html); someone who already has the app installed gets
  // routed straight in via the app.json "halalzur" scheme instead — expo-
  // router maps halalzur://product/<id> to this exact screen automatically.
  const onShareProduct = async () => {
    try {
      await Share.share({
        message: `${product.productName} (${product.brand}) — ${t('productShareMessage')}\nhttps://halalzur.com/product.html?barcode=${product.barcode}`,
      });
    } catch {
      // user cancelled the share sheet — nothing to do
    }
  };

  const handleDeleteFromHistory = () => {
    Alert.alert(
      t('productDeleteFromHistoryTitle'),
      t('productDeleteFromHistoryBody'),
      [
        { text: t('productCancel'), style: 'cancel' },
        {
          text: t('productDelete'),
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
          <Pressable onPress={onShareProduct} style={styles.backBtn}>
            <Ionicons name="share-outline" size={22} color={colors.black} />
          </Pressable>
          <Pressable onPress={() => toggleFavorite(product)} style={styles.backBtn}>
            <Ionicons
              name={isFavorite(product.barcode) ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite(product.barcode) ? colors.danger : colors.black}
            />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.hero}>
          {product.imageUrl && !liteMode ? (
            <Image source={{ uri: product.imageUrl }} style={styles.productImage} resizeMode="contain" />
          ) : (
            <Text style={styles.emoji}>{product.imageEmoji}</Text>
          )}
          <Text style={styles.name}>{product.productName}</Text>
          <View style={styles.brandRow}>
            <Text style={styles.brand}>
              {product.brand} · {product.category}
            </Text>
            <Pressable onPress={onToggleFollowBrand} hitSlop={8}>
              <Ionicons
                name={followingBrand ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={followingBrand ? colors.primary : colors.gray}
              />
            </Pressable>
          </View>
          <View style={{ marginTop: spacing.sm }}>
            <StatusBadge status={product.status} />
          </View>
          <Text style={styles.statusDesc}>{t(STATUS_DESC_KEY[product.status])}</Text>
          <Pressable
            onPress={onToggleRecommend}
            disabled={recommending}
            style={[styles.recommendPill, recommended && styles.recommendPillActive]}
          >
            <Ionicons
              name={recommended ? 'thumbs-up' : 'thumbs-up-outline'}
              size={16}
              color={recommended ? colors.white : colors.primaryDark}
            />
            <Text style={[styles.recommendPillText, recommended && styles.recommendPillTextActive]}>
              {recommended ? t('productRecommended') : t('productRecommend')}
              {recommendCount > 0 ? ` · ${recommendCount}` : ''}
            </Text>
          </Pressable>

          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => onRateProduct(n)} hitSlop={6}>
                <Ionicons
                  name={n <= myRating ? 'star' : 'star-outline'}
                  size={22}
                  color={n <= myRating ? colors.accent : colors.grayLight}
                />
              </Pressable>
            ))}
            {ratingSummary.count > 0 && (
              <Text style={styles.starSummary}>
                {ratingSummary.average.toFixed(1)} · {ratingSummary.count}
              </Text>
            )}
          </View>
        </View>

        <View style={[styles.certifierCard, { borderColor: tint }]}>
          <Ionicons name="shield-checkmark" size={22} color={tint} />
          <View style={{ flex: 1 }}>
            <Text style={styles.certifierTitle}>
              {product.certifier ? product.certifier.shortName : t('productCertifierNotFoundTitle')}
            </Text>
            <Text style={styles.certifierBody}>
              {product.certifier
                ? `${product.certifier.name} (${product.certifier.country})`
                : t('productCertifierNotFoundBody')}
            </Text>
            {product.certificateNumber && (
              <Text style={styles.certNumber}>{t('productCertificateNumber')} {product.certificateNumber}</Text>
            )}
            {product.verifiedAt && (
              <Text style={styles.certNumber}>{t('productVerifiedAt')} {product.verifiedAt}</Text>
            )}
            {product.certifier?.sourceUrl && (
              <Pressable onPress={() => Linking.openURL(product.certifier!.sourceUrl!)} hitSlop={8}>
                <Text style={styles.sourceLink}>{t('productViewSource')}</Text>
              </Pressable>
            )}
          </View>
        </View>

        {(product.status === 'haram' || product.status === 'mushbooh') && flaggedIngredients.length > 0 && (
          <View style={styles.reasonCard}>
            <Ionicons name="alert-circle" size={18} color={STATUS_TINT[product.status]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.reasonTitle}>{t('productWhyFlaggedTitle')}</Text>
              <Text style={styles.reasonText}>{flaggedIngredients.join(', ')}</Text>
            </View>
          </View>
        )}

        {product.status !== 'haram' &&
          product.status !== 'mushbooh' &&
          !hasHaramIngredient &&
          cautionIngredients.length > 0 && (
            <View style={styles.reasonCard}>
              <Ionicons name="warning" size={18} color={colors.warning} />
              <View style={{ flex: 1 }}>
                <Text style={styles.reasonTitle}>{t('productCautionTitle')}</Text>
                <Text style={styles.reasonText}>
                  {t('productCautionBody')} ({cautionIngredients.join(', ')})
                </Text>
              </View>
            </View>
          )}

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
              <Text style={styles.sectionTitle}>{t('productHalalAlternativesTitle')}</Text>
            </View>
            <Text style={styles.eCodeIntro}>
              {t('productHalalAlternativesFound').replace('{n}', String(alternatives.length))}
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
                <Text style={styles.lockedTitle}>{t('productHalalAlternativesTitle')}</Text>
                <Text style={styles.lockedBody}>{t('productHalalAlternativesLockedBody')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.grayLight} />
            </Pressable>
          </View>
        )}

        {product.ingredients.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('productIngredientsTitle')}</Text>
            <View style={styles.ingredientWrap}>
              {product.ingredients.map((ing, index) => (
                <View key={`${ing}-${index}`} style={styles.ingredientChip}>
                  <Text style={styles.ingredientText}>{translateIngredientTerm(ing, language)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {product.status === 'unknown' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('productCheckIngredientsTitle')}</Text>
            <Text style={styles.eCodeIntro}>{t('productCheckIngredientsIntro')}</Text>

            <Pressable style={styles.photoBtn} onPress={captureIngredientPhoto}>
              <Ionicons name="camera" size={18} color={colors.primaryDark} />
              <Text style={styles.photoBtnText}>
                {ingredientPhoto ? t('productRetakePhoto') : t('productTakeIngredientPhoto')}
              </Text>
            </Pressable>

            {ingredientPhoto && (
              <View style={styles.photoPreviewWrap}>
                <Image source={{ uri: ingredientPhoto }} style={styles.photoPreview} />
                {scanningPhoto && (
                  <View style={styles.photoPreviewOverlay}>
                    <ActivityIndicator color={colors.white} />
                    <Text style={styles.photoPreviewOverlayText}>{t('productRecognizingText')}</Text>
                  </View>
                )}
              </View>
            )}

            <Text style={styles.manualLabel}>
              {ingredientPhoto ? t('productManualLabelWithPhoto') : t('productManualLabelNoPhoto')}
            </Text>
            <TextInput
              value={manualIngredients}
              onChangeText={setManualIngredients}
              placeholder={t('productIngredientsPlaceholder')}
              placeholderTextColor={colors.gray}
              multiline
              style={styles.manualInput}
            />

            <Pressable style={styles.ecodePickerBtn} onPress={() => setEcodePickerVisible(true)}>
              <Ionicons name="flask-outline" size={16} color={colors.primaryDark} />
              <Text style={styles.ecodePickerBtnText}>{t('productPickECodeFromList')}</Text>
            </Pressable>

            <View style={styles.submitDivider} />

            {submitted ? (
              <View style={styles.submittedBox}>
                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                <Text style={styles.submittedText}>{t('productSubmittedBoxText')}</Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionTitle}>{t('productSuggestToCommunityTitle')}</Text>
                <Text style={styles.eCodeIntro}>{t('productSuggestToCommunityIntro')}</Text>
                <TextInput
                  value={submitName}
                  onChangeText={setSubmitName}
                  placeholder={t('productNamePlaceholder')}
                  placeholderTextColor={colors.gray}
                  style={styles.submitInput}
                />
                <Pressable style={styles.submitPicker} onPress={() => openFieldPicker('brand')}>
                  <Text style={submitBrand ? styles.submitPickerText : styles.submitPickerPlaceholder}>
                    {submitBrand || t('productBrandPickerPlaceholder')}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={colors.gray} />
                </Pressable>
                <Pressable style={styles.submitPicker} onPress={() => openFieldPicker('category')}>
                  <Text style={submitCategory ? styles.submitPickerText : styles.submitPickerPlaceholder}>
                    {submitCategory || t('productCategoryPickerPlaceholder')}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={colors.gray} />
                </Pressable>
                <Text style={styles.eCodeIntro}>{t('productStatusDecidedByTeam')}</Text>
                <Button
                  title={submitting ? t('productSuggestSending') : t('productSuggest')}
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
              <Text style={styles.sectionTitle}>{t('productDeepIngredientCheckTitle')}</Text>
            </View>
            {isPremium ? (
              <>
                <Text style={styles.eCodeIntro}>{t('productDeepIngredientCheckIntro')}</Text>
                {detectedECodes.map((entry) => (
                  <ECodeCard key={entry.code} entry={entry} />
                ))}
              </>
            ) : (
              <Pressable style={styles.lockedCard} onPress={() => router.push('/subscription')}>
                <Ionicons name="lock-closed" size={20} color={colors.primaryDark} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.lockedTitle}>
                    {detectedECodes.length} {t('productComponentsAnalyzed')}
                  </Text>
                  <Text style={styles.lockedBody}>{t('productComponentsLockedBody')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.grayLight} />
              </Pressable>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('productBarcodeTitle')}</Text>
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
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('productPickECodeTitle')}</Text>
              <Pressable onPress={() => setEcodePickerVisible(false)}>
                <Ionicons name="close" size={22} color={colors.gray} />
              </Pressable>
            </View>
            <TextInput
              value={ecodeQuery}
              onChangeText={setEcodeQuery}
              placeholder={t('productECodeSearchPlaceholder')}
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
                        {item.category} · {t(ECODE_STATUS_LABEL_KEY[item.status])}
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
              {t('productECodePickerHint')}
            </Text>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={fieldPicker !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setFieldPicker(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {fieldPicker === 'brand' ? t('productPickBrandTitle') : t('productPickCategoryTitle')}
              </Text>
              <Pressable onPress={() => setFieldPicker(null)}>
                <Ionicons name="close" size={22} color={colors.gray} />
              </Pressable>
            </View>
            <TextInput
              value={fieldPickerQuery}
              onChangeText={setFieldPickerQuery}
              placeholder={
                fieldPicker === 'brand' ? t('productBrandSearchPlaceholder') : t('productCategorySearchPlaceholder')
              }
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
                <Text style={[styles.eCodeIntro, { marginTop: spacing.sm }]}>{t('productNoMatchFound')}</Text>
              }
            />
            {fieldPickerQuery.trim().length > 0 && !fieldPickerExactMatch && (
              <Pressable
                style={styles.addNewRow}
                onPress={() => selectFieldPickerValue(fieldPickerQuery.trim())}
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={styles.addNewRowText}>
                  "{fieldPickerQuery.trim()}" {t('productAddNew')}
                </Text>
              </Pressable>
            )}
          </View>
        </KeyboardAvoidingView>
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
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 4 },
  brand: { ...typography.body, color: colors.gray },
  statusDesc: {
    ...typography.small,
    color: colors.gray,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    lineHeight: 18,
  },
  recommendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  recommendPillActive: { backgroundColor: colors.primary },
  recommendPillText: { ...typography.small, color: colors.primaryDark, fontWeight: '700' },
  recommendPillTextActive: { color: colors.white },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  starSummary: { ...typography.small, color: colors.gray, marginLeft: spacing.xs, fontWeight: '600' },
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
  sourceLink: {
    ...typography.small,
    color: colors.primaryDark,
    marginTop: spacing.xs,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  reasonCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  reasonTitle: { ...typography.small, color: colors.black, fontWeight: '700' },
  reasonText: { ...typography.small, color: colors.gray, marginTop: 2 },
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

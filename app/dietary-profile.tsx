import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../lib/i18n-context';
import { useDietaryProfile } from '../lib/dietaryProfile-context';
import { DietaryTag, AllergenTag, DIETARY_TAG_LABEL_KEY, ALLERGEN_TAG_LABEL_KEY } from '../lib/dietaryKeywords';
import { colors, radius, spacing, typography } from '../constants/theme';

const DIET_TAGS: DietaryTag[] = ['vegan', 'dairy_free', 'sugar_free', 'gluten_free'];
const ALLERGEN_TAGS: AllergenTag[] = ['nuts', 'milk', 'gluten', 'eggs', 'soy', 'fish'];

export default function DietaryProfileScreen() {
  const { t } = useLanguage();
  const { dietaryTags, allergenTags, blockedBrands, toggleDietaryTag, toggleAllergenTag, addBlockedBrand, removeBlockedBrand } =
    useDietaryProfile();
  const [brandInput, setBrandInput] = useState('');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.black} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('dietaryProfileTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={styles.intro}>{t('dietaryProfileIntro')}</Text>

        <Text style={styles.sectionTitle}>{t('dietaryProfileDietSection')}</Text>
        <View style={styles.chipWrap}>
          {DIET_TAGS.map((tag) => {
            const active = dietaryTags.includes(tag);
            return (
              <Pressable key={tag} style={[styles.chip, active && styles.chipActive]} onPress={() => toggleDietaryTag(tag)}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{t(DIETARY_TAG_LABEL_KEY[tag])}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>{t('dietaryProfileAllergenSection')}</Text>
        <View style={styles.chipWrap}>
          {ALLERGEN_TAGS.map((tag) => {
            const active = allergenTags.includes(tag);
            return (
              <Pressable key={tag} style={[styles.chip, active && styles.chipActiveDanger]} onPress={() => toggleAllergenTag(tag)}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{t(ALLERGEN_TAG_LABEL_KEY[tag])}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>{t('dietaryProfileBlockedBrandsSection')}</Text>
        <View style={styles.brandInputRow}>
          <TextInput
            value={brandInput}
            onChangeText={setBrandInput}
            placeholder={t('dietaryProfileBlockedBrandsPlaceholder')}
            placeholderTextColor={colors.gray}
            style={styles.brandInput}
          />
          <Pressable
            style={styles.brandAddBtn}
            onPress={() => {
              addBlockedBrand(brandInput);
              setBrandInput('');
            }}
          >
            <Text style={styles.brandAddBtnText}>{t('dietaryProfileBlockedBrandsAdd')}</Text>
          </Pressable>
        </View>

        {blockedBrands.length === 0 ? (
          <Text style={styles.emptyText}>{t('dietaryProfileBlockedBrandsEmpty')}</Text>
        ) : (
          blockedBrands.map((brand) => (
            <View key={brand} style={styles.brandRow}>
              <Ionicons name="ban-outline" size={16} color={colors.danger} />
              <Text style={styles.brandRowText}>{brand}</Text>
              <Pressable onPress={() => removeBlockedBrand(brand)} hitSlop={8}>
                <Ionicons name="close-circle" size={20} color={colors.grayLight} />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.h3, color: colors.black },
  intro: { ...typography.small, color: colors.gray, lineHeight: 19, marginBottom: spacing.lg },
  sectionTitle: { ...typography.h3, color: colors.black, marginTop: spacing.lg, marginBottom: spacing.sm },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.grayLight,
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipActiveDanger: { backgroundColor: colors.danger, borderColor: colors.danger },
  chipText: { ...typography.small, color: colors.black, fontWeight: '700' },
  chipTextActive: { color: colors.white },
  brandInputRow: { flexDirection: 'row', gap: spacing.sm },
  brandInput: {
    flex: 1,
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.grayLight,
    paddingHorizontal: spacing.md,
    fontSize: typography.body.fontSize,
    color: colors.black,
    backgroundColor: colors.surface,
  },
  brandAddBtn: { paddingHorizontal: spacing.md, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  brandAddBtnText: { color: colors.white, fontWeight: '700' },
  emptyText: { ...typography.small, color: colors.gray, marginTop: spacing.sm },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  brandRowText: { flex: 1, ...typography.body, color: colors.black, fontWeight: '600' },
});

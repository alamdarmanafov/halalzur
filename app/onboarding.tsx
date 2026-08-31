import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from '../components/Logo';
import { ScanIllustration } from '../components/onboarding/ScanIllustration';
import { CheckIllustration } from '../components/onboarding/CheckIllustration';
import { TrustIllustration } from '../components/onboarding/TrustIllustration';
import { markOnboardingSeen } from '../lib/onboarding';
import { useLanguage } from '../lib/i18n-context';
import { TranslationKey } from '../lib/i18n';
import { colors, radius, spacing, typography } from '../constants/theme';

const SLIDE_META = [
  { step: '01', eyebrow: 'SCAN', titleKey: 'onboard1Title', descKey: 'onboard1Desc', Illustration: ScanIllustration },
  { step: '02', eyebrow: 'CHECK', titleKey: 'onboard2Title', descKey: 'onboard2Desc', Illustration: CheckIllustration },
  { step: '03', eyebrow: 'TRUST', titleKey: 'onboard3Title', descKey: 'onboard3Desc', Illustration: TrustIllustration },
] as const satisfies { step: string; eyebrow: string; titleKey: TranslationKey; descKey: TranslationKey; Illustration: any }[];

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const { t } = useLanguage();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const SLIDES = SLIDE_META.map((s) => ({ ...s, title: t(s.titleKey), desc: t(s.descKey) }));
  const isLast = index === SLIDES.length - 1;

  const finish = async () => {
    await markOnboardingSeen();
    router.replace('/(auth)/welcome');
  };

  const goTo = (next: number) => {
    scrollRef.current?.scrollTo({ x: next * width, animated: true });
    setIndex(next);
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Logo size={30} />
        <View>
          <Text style={styles.brand}>
            Halal<Text style={{ color: colors.primary }}>zur</Text>
          </Text>
          <Text style={styles.tag}>SCAN · CHECK · TRUST</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
      >
        {SLIDES.map((slide) => (
          <View key={slide.step} style={[styles.slide, { width }]}>
            <Text style={styles.step}>{slide.step}</Text>
            <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.desc}>{slide.desc}</Text>
            <View style={styles.illustrationWrap}>
              <slide.Illustration />
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottom}>
        {!isLast && (
          <View style={styles.navRow}>
            <Pressable onPress={finish}>
              <Text style={styles.skip}>{t('onboardSkip')}</Text>
            </Pressable>
            <View style={styles.dotsRow}>
              {SLIDES.map((_, i) => (
                <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
              ))}
            </View>
            <Pressable style={styles.nextBtn} onPress={() => goTo(index + 1)}>
              <Ionicons name="arrow-forward" size={20} color={colors.white} />
            </Pressable>
          </View>
        )}

        {isLast && (
          <>
            <View style={[styles.dotsRow, { marginBottom: spacing.md }]}>
              {SLIDES.map((_, i) => (
                <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
              ))}
            </View>
            <Pressable style={styles.startBtn} onPress={finish}>
              <Text style={styles.startBtnText}>{t('onboardStart')}</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.white} />
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  brand: { ...typography.h3, color: colors.primaryDark },
  tag: { fontSize: 9, letterSpacing: 2, color: colors.gray, marginTop: 1 },
  slide: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, alignItems: 'flex-start' },
  step: { ...typography.h1, fontSize: 36, color: colors.primary, fontWeight: '800' },
  eyebrow: {
    ...typography.caption,
    color: colors.primaryDark,
    letterSpacing: 2,
    marginTop: -4,
    marginBottom: spacing.sm,
  },
  title: { ...typography.h1, fontSize: 28, color: colors.black, lineHeight: 34 },
  desc: { ...typography.body, color: colors.gray, marginTop: spacing.sm, maxWidth: 280 },
  illustrationWrap: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
  bottom: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skip: { ...typography.body, color: colors.gray, fontWeight: '600' },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.grayLight },
  dotActive: { backgroundColor: colors.primary, width: 20 },
  nextBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  startBtnText: { ...typography.h3, color: colors.white },
});

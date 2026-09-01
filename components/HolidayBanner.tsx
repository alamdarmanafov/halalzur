import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getActiveHoliday } from '../lib/islamicCalendar';
import { useLanguage } from '../lib/i18n-context';
import { colors, radius, spacing, typography } from '../constants/theme';

const DISMISS_KEY = 'halalzur.dismissedHolidayBanner';

export function HolidayBanner() {
  const { language } = useLanguage();
  const [visible, setVisible] = useState(false);
  const holiday = getActiveHoliday();

  useEffect(() => {
    if (!holiday) {
      setVisible(false);
      return;
    }
    AsyncStorage.getItem(DISMISS_KEY).then((dismissedId) => {
      setVisible(dismissedId !== holiday.id);
    });
  }, [holiday?.id]);

  if (!holiday || !visible) return null;

  const onDismiss = () => {
    setVisible(false);
    AsyncStorage.setItem(DISMISS_KEY, holiday.id);
  };

  return (
    <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.banner}>
      <Text style={styles.emoji}>{holiday.emoji}</Text>
      <Text style={styles.text} numberOfLines={2}>
        {language === 'en' ? holiday.messageEn : holiday.messageAz}
      </Text>
      <Pressable onPress={onDismiss} hitSlop={8}>
        <Ionicons name="close" size={16} color={colors.white} />
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  emoji: { fontSize: 18 },
  text: { flex: 1, ...typography.small, color: colors.white, fontWeight: '700', lineHeight: 17 },
});

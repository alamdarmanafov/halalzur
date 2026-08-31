import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth-context';
import { submitFeedback } from '../lib/feedback';
import { Button } from '../components/Button';
import { colors, radius, spacing, typography } from '../constants/theme';

export default function FeedbackScreen() {
  const { user } = useAuth();
  const { screenshot } = useLocalSearchParams<{ screenshot?: string }>();
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Boşdur', 'Zəhmət olmasa problemi və ya rəyinizi yazın.');
      return;
    }
    setSubmitting(true);
    try {
      await submitFeedback(user?.id ?? null, user?.name ?? null, message, screenshot ?? null);
      setSent(true);
      setMessage('');
    } catch (err: any) {
      Alert.alert('Göndərilmədi', err.message ?? 'Xəta baş verdi, yenidən cəhd edin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.black} />
        </Pressable>
        <Text style={styles.headerTitle}>Xəta bildir / Rəy</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {sent ? (
          <View style={styles.sentBox}>
            <Ionicons name="checkmark-circle" size={28} color={colors.primary} />
            <Text style={styles.sentTitle}>Təşəkkürlər!</Text>
            <Text style={styles.sentBody}>Mesajınız göndərildi — komandamız baxacaq.</Text>
            <Button title="Bağla" onPress={() => router.back()} style={{ marginTop: spacing.lg, width: 160 }} />
          </View>
        ) : (
          <>
            <Text style={styles.intro}>
              Bir xəta ilə qarşılaşdınız, ya da təklifiniz var? Aşağıda yazın — birbaşa komandamıza gedəcək.
              Telefonu silkələməklə də bu ekranı istənilən vaxt aça bilərsiniz.
            </Text>
            {screenshot && (
              <View style={styles.screenshotBox}>
                <Image source={{ uri: screenshot }} style={styles.screenshot} resizeMode="cover" />
                <Text style={styles.screenshotCaption}>Bu ekranın şəkli mesajınızla göndəriləcək</Text>
              </View>
            )}
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Nə baş verdi, ya da nə təklif edirsiniz?"
              placeholderTextColor={colors.gray}
              multiline
              style={styles.input}
            />
            <Button
              title={submitting ? 'Göndərilir…' : 'Göndər'}
              onPress={onSubmit}
              loading={submitting}
              style={{ marginTop: spacing.md }}
            />
          </>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...typography.h3, color: colors.black },
  intro: { ...typography.small, color: colors.gray, lineHeight: 19, marginBottom: spacing.lg },
  screenshotBox: { marginBottom: spacing.lg },
  screenshot: {
    width: '100%',
    height: 220,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  screenshotCaption: { ...typography.small, color: colors.gray, marginTop: spacing.xs, textAlign: 'center' },
  input: {
    minHeight: 140,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.grayLight,
    padding: spacing.md,
    fontSize: typography.body.fontSize,
    color: colors.black,
    textAlignVertical: 'top',
    backgroundColor: colors.surface,
  },
  sentBox: { alignItems: 'center', marginTop: spacing.xl, gap: spacing.xs },
  sentTitle: { ...typography.h3, color: colors.black, marginTop: spacing.sm },
  sentBody: { ...typography.small, color: colors.gray, textAlign: 'center' },
});

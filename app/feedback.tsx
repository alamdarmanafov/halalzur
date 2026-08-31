import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../lib/auth-context';
import { useLanguage } from '../lib/i18n-context';
import { submitFeedback } from '../lib/feedback';
import { Button } from '../components/Button';
import { colors, radius, spacing, typography } from '../constants/theme';

export default function FeedbackScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { screenshot } = useLocalSearchParams<{ screenshot?: string }>();
  const [message, setMessage] = useState('');
  const [image, setImage] = useState<string | null>(screenshot ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('feedbackPermissionTitle'), t('feedbackPermissionBody'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
      allowsEditing: true,
    });
    if (result.canceled || !result.assets[0]) return;
    setImage(result.assets[0].uri);
  };

  const onSubmit = async () => {
    if (!message.trim()) {
      Alert.alert(t('feedbackEmptyTitle'), t('feedbackEmptyBody'));
      return;
    }
    setSubmitting(true);
    try {
      await submitFeedback(user?.id ?? null, user?.name ?? null, message, image);
      setSent(true);
      setMessage('');
    } catch (err: any) {
      Alert.alert(t('feedbackFailedTitle'), err.message ?? t('feedbackFailedBody'));
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
        <Text style={styles.headerTitle}>{t('feedbackTitle')}</Text>
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
            <Text style={styles.sentTitle}>{t('feedbackThanksTitle')}</Text>
            <Text style={styles.sentBody}>{t('feedbackThanksBody')}</Text>
            <Button title={t('feedbackClose')} onPress={() => router.back()} style={{ marginTop: spacing.lg, width: 160 }} />
          </View>
        ) : (
          <>
            <Text style={styles.intro}>{t('feedbackIntro')}</Text>
            {image && (
              <View style={styles.screenshotBox}>
                <Image source={{ uri: image }} style={styles.screenshot} resizeMode="contain" />
                {!!screenshot && image === screenshot && (
                  <Text style={styles.screenshotCaption}>{t('feedbackScreenshotCaption')}</Text>
                )}
              </View>
            )}
            <View style={styles.photoActions}>
              <Pressable onPress={pickImage} style={styles.photoActionBtn}>
                <Ionicons name="image-outline" size={18} color={colors.primaryDark} />
                <Text style={styles.photoActionText}>
                  {image ? t('feedbackChangePhoto') : t('feedbackAddPhoto')}
                </Text>
              </Pressable>
              {image && (
                <Pressable onPress={() => setImage(null)} style={styles.photoActionBtn}>
                  <Ionicons name="trash-outline" size={18} color={colors.gray} />
                  <Text style={[styles.photoActionText, { color: colors.gray }]}>
                    {t('feedbackRemovePhoto')}
                  </Text>
                </Pressable>
              )}
            </View>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder={t('feedbackPlaceholder')}
              placeholderTextColor={colors.gray}
              multiline
              style={styles.input}
            />
            <Button
              title={submitting ? t('feedbackSending') : t('feedbackSend')}
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
    height: 340,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  screenshotCaption: { ...typography.small, color: colors.gray, marginTop: spacing.xs, textAlign: 'center' },
  photoActions: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  photoActionBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  photoActionText: { ...typography.small, color: colors.primaryDark, fontWeight: '600' },
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

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth-context';
import { useLanguage } from '../lib/i18n-context';
import { getMyFeedback, FeedbackItem } from '../lib/feedback';
import { colors, radius, spacing, typography } from '../constants/theme';

const STATUS_LABEL: Record<FeedbackItem['status'], string> = {
  open: '🟡',
  in_progress: '🔵',
  resolved: '🟢',
};

export default function FeedbackHistoryScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    getMyFeedback(user.id).then((rows) => {
      setItems(rows);
      setLoading(false);
    });
  }, [user]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.black} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('feedbackHistoryTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          {items.length === 0 ? (
            <Text style={styles.empty}>{t('feedbackHistoryEmpty')}</Text>
          ) : (
            items.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.status}>{STATUS_LABEL[item.status]}</Text>
                  <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.message}>{item.message}</Text>
                {item.adminReply && (
                  <View style={styles.replyBox}>
                    <Text style={styles.replyLabel}>{t('feedbackHistoryReplyLabel')}</Text>
                    <Text style={styles.replyText}>{item.adminReply}</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.h3, color: colors.black },
  empty: { ...typography.small, color: colors.gray, textAlign: 'center', marginTop: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  status: { fontSize: 14 },
  date: { ...typography.small, color: colors.gray },
  message: { ...typography.body, color: colors.black, lineHeight: 20 },
  replyBox: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.grayLight },
  replyLabel: { ...typography.small, color: colors.primaryDark, fontWeight: '700' },
  replyText: { ...typography.small, color: colors.black, marginTop: 2, lineHeight: 18 },
});

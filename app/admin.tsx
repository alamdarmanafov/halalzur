import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth-context';
import { useLanguage } from '../lib/i18n-context';
import { isAdmin } from '../lib/admin';
import { fetchPendingSubmissions, approveSubmission, rejectSubmission } from '../lib/submissions';
import { ProductSubmission } from '../lib/types';
import { StatusBadge } from '../components/StatusBadge';
import { colors, radius, spacing, typography } from '../constants/theme';

export default function AdminScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [submissions, setSubmissions] = useState<ProductSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPendingSubmissions();
      setSubmissions(data);
    } catch (err: any) {
      Alert.alert(t('adminErrorTitle'), err.message ?? t('adminListFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (isAdmin(user)) load();
  }, [user, load]);

  const onApprove = async (submission: ProductSubmission) => {
    setBusyId(submission.id);
    try {
      await approveSubmission(submission);
      setSubmissions((prev) => prev.filter((s) => s.id !== submission.id));
      Alert.alert(
        t('adminApprovedTitle'),
        `${submission.productName} ${t('adminApprovedBody')} ${submission.submittedByName ?? t('adminUnknownUser')} ${t('adminApprovedBodyEnd')}`
      );
    } catch (err: any) {
      Alert.alert(t('adminErrorTitle'), err.message ?? t('adminApproveFailed'));
    } finally {
      setBusyId(null);
    }
  };

  const onReject = async (submission: ProductSubmission) => {
    setBusyId(submission.id);
    try {
      await rejectSubmission(submission.id, null);
      setSubmissions((prev) => prev.filter((s) => s.id !== submission.id));
    } catch (err: any) {
      Alert.alert(t('adminErrorTitle'), err.message ?? t('adminRejectFailed'));
    } finally {
      setBusyId(null);
    }
  };

  if (!isAdmin(user)) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="lock-closed-outline" size={40} color={colors.gray} />
        <Text style={styles.deniedText}>{t('adminDeniedText')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.black} />
        </Pressable>
        <Text style={styles.title}>{t('adminTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={submissions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.md }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-done-outline" size={36} color={colors.grayLight} />
              <Text style={styles.emptyText}>{t('adminEmpty')}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.productName}>{item.productName}</Text>
                <StatusBadge status={item.suggestedStatus} size="sm" />
              </View>
              <Text style={styles.meta}>
                {item.brand} · {item.category ?? '—'} · {item.barcode}
              </Text>
              <Text style={styles.submitter}>
                {t('adminSubmittedBy')} {item.submittedByName ?? item.submittedBy}
              </Text>
              {item.notes && (
                <Text style={styles.notes} numberOfLines={4}>
                  {item.notes}
                </Text>
              )}

              <View style={styles.actionsRow}>
                <Pressable
                  style={[styles.actionBtn, styles.rejectBtn]}
                  onPress={() => onReject(item)}
                  disabled={busyId === item.id}
                >
                  {busyId === item.id ? (
                    <ActivityIndicator color={colors.danger} size="small" />
                  ) : (
                    <Text style={styles.rejectText}>{t('adminReject')}</Text>
                  )}
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, styles.approveBtn]}
                  onPress={() => onApprove(item)}
                  disabled={busyId === item.id}
                >
                  {busyId === item.id ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={styles.approveText}>{t('adminApprove')}</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg },
  deniedText: { ...typography.body, color: colors.gray, textAlign: 'center' },
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
  title: { ...typography.h3, color: colors.primaryDark },
  empty: { alignItems: 'center', marginTop: spacing.xl, gap: spacing.sm },
  emptyText: { color: colors.gray },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  productName: { ...typography.h3, color: colors.black, flex: 1 },
  meta: { ...typography.small, color: colors.gray, marginTop: 4 },
  submitter: { ...typography.small, color: colors.primaryDark, fontWeight: '600', marginTop: 4 },
  notes: { ...typography.small, color: colors.black, marginTop: spacing.sm, lineHeight: 18 },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionBtn: { flex: 1, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  rejectBtn: { borderWidth: 1.5, borderColor: colors.danger },
  rejectText: { color: colors.danger, fontWeight: '700' },
  approveBtn: { backgroundColor: colors.primary },
  approveText: { color: colors.white, fontWeight: '700' },
});

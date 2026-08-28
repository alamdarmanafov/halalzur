import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth-context';
import { isAdmin } from '../lib/admin';
import { fetchPendingSubmissions, approveSubmission, rejectSubmission } from '../lib/submissions';
import { ProductSubmission } from '../lib/types';
import { StatusBadge } from '../components/StatusBadge';
import { colors, radius, spacing, typography } from '../constants/theme';

export default function AdminScreen() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<ProductSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPendingSubmissions();
      setSubmissions(data);
    } catch (err: any) {
      Alert.alert('Xəta', err.message ?? 'Siyahı yüklənmədi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin(user)) load();
  }, [user, load]);

  const onApprove = async (submission: ProductSubmission) => {
    setBusyId(submission.id);
    try {
      await approveSubmission(submission);
      setSubmissions((prev) => prev.filter((s) => s.id !== submission.id));
      Alert.alert('Təsdiqləndi', `${submission.productName} bazaya əlavə olundu, ${submission.submittedByName ?? 'istifadəçi'} xal qazandı.`);
    } catch (err: any) {
      Alert.alert('Xəta', err.message ?? 'Təsdiqlənmədi.');
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
      Alert.alert('Xəta', err.message ?? 'Rədd edilmədi.');
    } finally {
      setBusyId(null);
    }
  };

  if (!isAdmin(user)) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="lock-closed-outline" size={40} color={colors.gray} />
        <Text style={styles.deniedText}>Bu ekran yalnız admin üçündür.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.black} />
        </Pressable>
        <Text style={styles.title}>Təsdiq gözləyənlər</Text>
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
              <Text style={styles.emptyText}>Gözləyən təklif yoxdur</Text>
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
                Göndərən: {item.submittedByName ?? item.submittedBy}
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
                    <Text style={styles.rejectText}>Rədd et</Text>
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
                    <Text style={styles.approveText}>Təsdiqlə</Text>
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

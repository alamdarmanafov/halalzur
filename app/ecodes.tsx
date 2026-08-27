import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { searchECodes } from '../lib/eCodes';
import { ECodeCard } from '../components/ECodeCard';
import { colors, radius, spacing, typography } from '../constants/theme';

export default function ECodesScreen() {
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchECodes(query), [query]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.black} />
        </Pressable>
        <Text style={styles.title}>E-kod bələdçisi</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.intro}>
        Halal sertifikat orqanlarının (GIMDES tipli bələdçilər) özlərinin dərc etdiyi E-kod
        təsnifatı — AI qərarı deyil, sabit istinad cədvəlidir.
      </Text>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.gray} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Kod, ad və ya kateqoriya axtar (məs. E441)"
          placeholderTextColor={colors.gray}
          style={styles.searchInput}
          autoCapitalize="characters"
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.code}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        renderItem={({ item }) => <ECodeCard entry={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={32} color={colors.grayLight} />
            <Text style={styles.emptyText}>Nəticə tapılmadı</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, paddingHorizontal: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
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
  intro: { ...typography.small, color: colors.gray, marginTop: spacing.md, lineHeight: 18 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 46,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  searchInput: { flex: 1, fontSize: typography.body.fontSize, color: colors.black },
  empty: { alignItems: 'center', marginTop: spacing.xl, gap: spacing.sm },
  emptyText: { color: colors.gray },
});

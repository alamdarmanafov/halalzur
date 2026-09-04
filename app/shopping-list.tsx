import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../lib/i18n-context';
import { useShoppingList } from '../lib/shoppingList-context';
import { colors, radius, spacing, typography } from '../constants/theme';

export default function ShoppingListScreen() {
  const { t } = useLanguage();
  const { items, toggleBought, removeItem, clearBought } = useShoppingList();
  const boughtCount = items.filter((i) => i.bought).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.black} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('shoppingListTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.barcode}
        contentContainerStyle={{ padding: spacing.lg }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cart-outline" size={32} color={colors.grayLight} />
            <Text style={styles.emptyText}>{t('shoppingListEmpty')}</Text>
          </View>
        }
        ListFooterComponent={
          boughtCount > 0 ? (
            <Pressable style={styles.clearBtn} onPress={clearBought}>
              <Text style={styles.clearBtnText}>{t('shoppingListClearBought')}</Text>
            </Pressable>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.barcode } })}
          >
            <Pressable onPress={() => toggleBought(item.barcode)} hitSlop={8}>
              <Ionicons
                name={item.bought ? 'checkbox' : 'square-outline'}
                size={24}
                color={item.bought ? colors.primary : colors.grayLight}
              />
            </Pressable>
            <Text style={styles.emoji}>{item.imageEmoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, item.bought && styles.nameBought]} numberOfLines={1}>
                {item.productName}
              </Text>
              <Text style={styles.brand} numberOfLines={1}>
                {item.brand}
              </Text>
            </View>
            <Pressable onPress={() => removeItem(item.barcode)} hitSlop={8}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </Pressable>
          </Pressable>
        )}
      />
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
  empty: { alignItems: 'center', marginTop: spacing.xl, gap: spacing.sm },
  emptyText: { ...typography.small, color: colors.gray },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  emoji: { fontSize: 24 },
  name: { ...typography.body, color: colors.black, fontWeight: '700' },
  nameBought: { textDecorationLine: 'line-through', color: colors.gray },
  brand: { ...typography.small, color: colors.gray },
  clearBtn: { alignItems: 'center', marginTop: spacing.md, padding: spacing.sm },
  clearBtnText: { ...typography.small, color: colors.primaryDark, fontWeight: '700' },
});

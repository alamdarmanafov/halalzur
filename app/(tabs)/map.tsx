import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppleMaps } from 'expo-maps';
import { getPlacesByCategory, PLACE_CATEGORY_LABEL, PLACE_CATEGORY_ICON, Place, PlaceCategory } from '../../lib/places';
import { StatusBadge } from '../../components/StatusBadge';
import { colors, radius, spacing, typography } from '../../constants/theme';

const FILTERS: { key: PlaceCategory | 'hamısı'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'hamısı', label: 'Hamısı', icon: 'apps-outline' },
  { key: 'restoran', label: PLACE_CATEGORY_LABEL.restoran, icon: PLACE_CATEGORY_ICON.restoran as any },
  { key: 'kafe', label: PLACE_CATEGORY_LABEL.kafe, icon: PLACE_CATEGORY_ICON.kafe as any },
  { key: 'coffee_shop', label: PLACE_CATEGORY_LABEL.coffee_shop, icon: PLACE_CATEGORY_ICON.coffee_shop as any },
];

const STATUS_TINT: Record<Place['status'], string> = {
  halal: colors.primary,
  haram: colors.danger,
  mushbooh: colors.warning,
  unknown: colors.warning,
};

const BAKU_CENTER = { latitude: 40.3777, longitude: 49.892 };

export default function MapScreen() {
  const [filter, setFilter] = useState<PlaceCategory | 'hamısı'>('hamısı');
  const [selected, setSelected] = useState<Place | null>(null);
  const places = useMemo(() => getPlacesByCategory(filter), [filter]);

  const markers = useMemo(
    () =>
      places.map((p) => ({
        id: p.id,
        coordinates: { latitude: p.latitude, longitude: p.longitude },
        title: p.name,
        tintColor: STATUS_TINT[p.status],
      })),
    [places]
  );

  const openInAppleMaps = (place: Place) => {
    const query = encodeURIComponent(place.name);
    Linking.openURL(`maps://?q=${query}&ll=${place.latitude},${place.longitude}`);
  };

  return (
    <View style={styles.container}>
      <AppleMaps.View
        style={StyleSheet.absoluteFill}
        cameraPosition={{ coordinates: BAKU_CENTER, zoom: 12 }}
        markers={markers}
        onMarkerClick={(marker) => {
          const found = places.find((p) => p.id === marker.id);
          if (found) setSelected(found);
        }}
      />

      <SafeAreaView edges={['top']} style={styles.topOverlay} pointerEvents="box-none">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg }}
        >
          {FILTERS.map((f) => {
            const active = f.key === filter;
            return (
              <Pressable
                key={f.key}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => {
                  setFilter(f.key);
                  setSelected(null);
                }}
              >
                <Ionicons name={f.icon} size={14} color={active ? colors.white : colors.primaryDark} />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      {selected && (
        <SafeAreaView edges={['bottom']} style={styles.bottomCard} pointerEvents="box-none">
          <View style={styles.card}>
            <Pressable style={styles.closeBtn} onPress={() => setSelected(null)}>
              <Ionicons name="close" size={18} color={colors.gray} />
            </Pressable>
            <Text style={styles.placeName}>{selected.name}</Text>
            <Text style={styles.address}>
              {PLACE_CATEGORY_LABEL[selected.category]} · {selected.address}
            </Text>
            <View style={{ marginTop: spacing.xs }}>
              <StatusBadge status={selected.status} size="sm" />
            </View>
            {selected.note && <Text style={styles.note}>{selected.note}</Text>}
            <Pressable style={styles.directionsBtn} onPress={() => openInAppleMaps(selected)}>
              <Ionicons name="navigate" size={16} color={colors.white} />
              <Text style={styles.directionsBtnText}>Apple Maps-də aç</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    marginTop: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { ...typography.small, color: colors.primaryDark, fontWeight: '700' },
  chipTextActive: { color: colors.white },
  bottomCard: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: spacing.lg },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  closeBtn: { position: 'absolute', top: spacing.sm, right: spacing.sm, padding: spacing.xs },
  placeName: { ...typography.h3, color: colors.black, paddingRight: spacing.xl },
  address: { ...typography.small, color: colors.gray, marginTop: 2, marginBottom: spacing.xs },
  note: { ...typography.small, color: colors.gray, marginTop: spacing.xs, lineHeight: 17 },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 10,
    marginTop: spacing.md,
  },
  directionsBtnText: { color: colors.white, fontWeight: '700', fontSize: typography.small.fontSize },
});

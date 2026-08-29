import { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getActiveAnnouncement, Announcement } from '../lib/announcements';
import { Button } from './Button';
import { Logo } from './Logo';
import { colors, radius, spacing, typography } from '../constants/theme';

const LAST_SEEN_KEY = 'halalzur_last_seen_announcement_id';

export function AnnouncementModal() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const found = await getActiveAnnouncement();
      if (!found || !active) return;
      const lastSeenId = await AsyncStorage.getItem(LAST_SEEN_KEY);
      if (found.id !== lastSeenId) setAnnouncement(found);
    })();
    return () => {
      active = false;
    };
  }, []);

  const dismiss = async () => {
    if (announcement) await AsyncStorage.setItem(LAST_SEEN_KEY, announcement.id);
    setAnnouncement(null);
  };

  const handleCta = async () => {
    const route = announcement?.ctaRoute;
    await dismiss();
    if (route) router.push(route as never);
  };

  if (!announcement) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Pressable style={styles.closeBtn} onPress={dismiss}>
            <Ionicons name="close" size={20} color={colors.gray} />
          </Pressable>
          <Logo size={44} />
          <Text style={styles.title}>{announcement.title}</Text>
          <Text style={styles.body}>{announcement.body}</Text>
          {announcement.ctaLabel && (
            <Button title={announcement.ctaLabel} onPress={handleCta} style={{ width: '100%', marginTop: spacing.md }} />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11,19,16,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  closeBtn: { position: 'absolute', top: spacing.md, right: spacing.md, padding: spacing.xs },
  title: { ...typography.h2, color: colors.primaryDark, marginTop: spacing.md, textAlign: 'center' },
  body: { ...typography.body, color: colors.gray, textAlign: 'center', marginTop: spacing.sm, lineHeight: 21 },
});

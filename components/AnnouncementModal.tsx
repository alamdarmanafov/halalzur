import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getActiveAnnouncement, Announcement } from '../lib/announcements';
import { BrandModal } from './BrandModal';

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

  return (
    <BrandModal
      visible={!!announcement}
      title={announcement?.title ?? ''}
      body={announcement?.body ?? ''}
      ctaLabel={announcement?.ctaLabel}
      onCta={handleCta}
      onClose={dismiss}
    />
  );
}

import { supabase, isSupabaseConfigured } from './supabase';

export type Announcement = {
  id: string;
  title: string;
  body: string;
  ctaLabel: string | null;
  ctaRoute: string | null;
};

type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  cta_label: string | null;
  cta_route: string | null;
};

export async function getActiveAnnouncement(): Promise<Announcement | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from('announcements')
    .select('id, title, body, cta_label, cta_route')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<AnnouncementRow>();

  if (error || !data) return null;

  return {
    id: data.id,
    title: data.title,
    body: data.body,
    ctaLabel: data.cta_label,
    ctaRoute: data.cta_route,
  };
}

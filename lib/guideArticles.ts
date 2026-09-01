import { supabase, isSupabaseConfigured } from './supabase';

export type GuideArticle = {
  id: string;
  title: string;
  body: string;
};

export async function getGuideArticles(): Promise<GuideArticle[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from('guide_articles')
    .select('id, title, body')
    .order('order_index', { ascending: true });
  if (error || !data) return [];
  return data.map((row) => ({ id: row.id as string, title: row.title as string, body: row.body as string }));
}

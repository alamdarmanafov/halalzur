import { supabase, isSupabaseConfigured } from './supabase';
import { getOrClaimSyncToken } from './syncToken';

export type ReviewComment = {
  id: string;
  userId: string;
  userName: string | null;
  comment: string;
  createdAt: string;
};

type ReviewCommentRow = {
  id: string;
  user_id: string;
  user_name: string | null;
  comment: string;
  created_at: string;
};

const mapRow = (row: ReviewCommentRow): ReviewComment => ({
  id: row.id,
  userId: row.user_id,
  userName: row.user_name,
  comment: row.comment,
  createdAt: row.created_at,
});

export async function getReviewComments(barcode: string): Promise<ReviewComment[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from('product_review_comments')
    .select('id, user_id, user_name, comment, created_at')
    .eq('barcode', barcode)
    .order('created_at', { ascending: false })
    .limit(50)
    .returns<ReviewCommentRow[]>();
  if (error || !data) return [];
  return data.map(mapRow);
}

export async function addReviewComment(
  userId: string,
  userName: string | null,
  barcode: string,
  comment: string
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase qoşulmayıb.');
  const trimmed = comment.trim();
  if (!trimmed) return;
  const token = await getOrClaimSyncToken(userId);
  if (!token) throw new Error('Sinxronizasiya hazır deyil, bir az sonra cəhd edin.');
  const { error } = await supabase.rpc('review_comment_add', {
    p_user_id: userId,
    p_token: token,
    p_user_name: userName,
    p_barcode: barcode,
    p_comment: trimmed,
  });
  if (error) throw error;
}

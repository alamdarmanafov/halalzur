import { supabase, isSupabaseConfigured } from './supabase';

export async function submitFeedback(userId: string | null, userName: string | null, message: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase qoşulmayıb — rəy göndərilə bilmir.');
  }
  const trimmed = message.trim();
  if (!trimmed) throw new Error('Mesaj boşdur.');

  const { error } = await supabase.from('feedback_reports').insert({
    user_id: userId,
    user_name: userName,
    message: trimmed,
  });
  if (error) throw error;
}

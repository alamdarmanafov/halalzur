import { supabase, isSupabaseConfigured } from './supabase';
import { sendPushNotification } from './pushNotify';
import { ADMIN_EMAIL } from './admin';

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

  notifyAdmin(userName, trimmed);
}

// Best-effort — never blocks or fails the actual feedback submission if
// the admin's own account has no registered push token yet.
function notifyAdmin(userName: string | null, message: string) {
  if (!supabase) return;
  supabase
    .from('users')
    .select('id')
    .eq('email', ADMIN_EMAIL)
    .maybeSingle()
    .then(({ data }) => {
      if (data?.id) {
        sendPushNotification(
          data.id,
          'Yeni Xəta/Rəy mesajı',
          `${userName ?? 'Naməlum istifadəçi'}: ${message.slice(0, 100)}`
        );
      }
    });
}

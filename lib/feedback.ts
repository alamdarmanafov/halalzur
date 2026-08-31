import { supabase, isSupabaseConfigured } from './supabase';
import { sendPushNotification } from './pushNotify';
import { ADMIN_EMAIL } from './admin';

export async function submitFeedback(
  userId: string | null,
  userName: string | null,
  message: string,
  screenshotUri?: string | null
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase qoşulmayıb — rəy göndərilə bilmir.');
  }
  const trimmed = message.trim();
  if (!trimmed) throw new Error('Mesaj boşdur.');

  const screenshotUrl = screenshotUri ? await uploadScreenshot(screenshotUri) : null;

  const { error } = await supabase.from('feedback_reports').insert({
    user_id: userId,
    user_name: userName,
    message: trimmed,
    screenshot_url: screenshotUrl,
  });
  if (error) throw error;

  notifyAdmin(userName, trimmed);
}

// Best-effort — a screenshot upload failing should never block the actual
// feedback message from being submitted.
async function uploadScreenshot(uri: string): Promise<string | null> {
  if (!supabase) return null;
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const { error } = await supabase.storage
      .from('feedback-screenshots')
      .upload(path, blob, { contentType: 'image/jpeg' });
    if (error) {
      console.warn('uploadScreenshot failed:', error.message);
      return null;
    }
    return supabase.storage.from('feedback-screenshots').getPublicUrl(path).data.publicUrl;
  } catch (err) {
    console.warn('uploadScreenshot failed:', err);
    return null;
  }
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

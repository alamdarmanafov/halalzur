import { supabase, isSupabaseConfigured } from './supabase';
import { sendPushNotification } from './pushNotify';

export type FeedbackItem = {
  id: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  adminReply: string | null;
  createdAt: string;
};

/** Read-back side of submitFeedback — Profile > "Mesajlarım" (feedback-history.tsx). */
export async function getMyFeedback(userId: string): Promise<FeedbackItem[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from('feedback_reports')
    .select('id, message, status, admin_reply, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .returns<{ id: string; message: string; status: string; admin_reply: string | null; created_at: string }[]>();
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    message: row.message,
    status: (row.status as FeedbackItem['status']) || 'open',
    adminReply: row.admin_reply,
    createdAt: row.created_at,
  }));
}

const API_BASE = process.env.EXPO_PUBLIC_ADMIN_API_URL;
const NOTIFY_SECRET = process.env.EXPO_PUBLIC_NOTIFY_SECRET;

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

  const { data: inserted, error } = await supabase
    .from('feedback_reports')
    .insert({
      user_id: userId,
      user_name: userName,
      message: trimmed,
      screenshot_url: screenshotUrl,
    })
    .select('id')
    .single();
  if (error) throw error;

  notifyAdmin(userName, trimmed);
  createGithubIssue(inserted.id, userName, trimmed, screenshotUrl);
}

// Best-effort — mirrors the report as a GitHub Issue so it's trackable
// outside the admin panel too. Never blocks or fails the submission.
function createGithubIssue(
  feedbackId: string,
  userName: string | null,
  message: string,
  screenshotUrl: string | null
) {
  if (!API_BASE || !supabase) return;
  fetch(`${API_BASE.replace(/\/$/, '')}/api/github-issue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-notify-secret': NOTIFY_SECRET ?? '' },
    body: JSON.stringify({ action: 'create', message, userName, screenshotUrl }),
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((issue: { number: number; url: string } | null) => {
      if (!issue || !supabase) return;
      // set_feedback_github_issue is the only write path left on this
      // table for a non-admin caller — see
      // migration_2026_09_05_feedback_reports_lockdown.sql.
      return supabase.rpc('set_feedback_github_issue', {
        p_feedback_id: feedbackId,
        p_issue_number: issue.number,
        p_issue_url: issue.url,
      });
    })
    .catch(() => {
      // best-effort
    });
}

// Best-effort — a screenshot upload failing should never block the actual
// feedback message from being submitted.
async function uploadScreenshot(uri: string): Promise<string | null> {
  if (!supabase) return null;
  try {
    // React Native's fetch()+Blob can silently hand back truncated bytes
    // for a local file (a known gotcha, not specific to this app) — going
    // straight to response.arrayBuffer() skips Blob entirely, which is
    // the reliable path.
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const { error } = await supabase.storage
      .from('feedback-screenshots')
      .upload(path, arrayBuffer, { contentType: 'image/jpeg' });
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
// the admin's own account has no registered push token yet. Goes through
// the get_admin_user_id() RPC rather than a direct `users` query filtered
// by email — users.email is no longer readable by the anon/authenticated
// roles (see supabase/migration_2026_09_04_security_hardening.sql), so a
// raw `.eq('email', ...)` would just come back empty.
function notifyAdmin(userName: string | null, message: string) {
  if (!supabase) return;
  supabase
    .rpc('get_admin_user_id')
    .then(({ data }: { data: string | null }) => {
      if (data) {
        sendPushNotification(
          data,
          'Yeni Xəta/Rəy mesajı',
          `${userName ?? 'Naməlum istifadəçi'}: ${message.slice(0, 100)}`
        );
      }
    });
}

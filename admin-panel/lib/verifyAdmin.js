import { createClient } from '@supabase/supabase-js';

// Verifies a request actually comes from a logged-in admin, by checking the
// Authorization: Bearer <token> header against Supabase Auth and then
// confirming that user has an admin_profiles row — the same check the
// database's own RLS policies make via is_admin().
//
// This replaces the old "x-app-key must equal SUPABASE_ANON_KEY" pattern
// used across these endpoints: the anon key is, by Supabase's own design,
// PUBLIC — it's embedded directly in admin-panel/index.html's page source,
// readable by anyone who loads that page without ever logging in. That
// pattern was never real authentication, just a "this came from our own
// frontend" filter; this checks the admin's actual session instead.
//
// Returns the admin_profiles row ({ id, email, role }) on success, or null
// if the token is missing/invalid or doesn't belong to an admin. Never
// throws — callers just check for a falsy return.
export async function verifyAdmin(req) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (!token) return null;
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData || !userData.user) return null;

    const { data: profile, error: profileError } = await supabase
      .from('admin_profiles')
      .select('id, email, role')
      .eq('id', userData.user.id)
      .maybeSingle();
    if (profileError || !profile) return null;

    return profile;
  } catch (err) {
    console.error('verifyAdmin: unexpected error', err);
    return null;
  }
}

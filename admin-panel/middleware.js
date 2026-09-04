// Vercel Edge Middleware — restricts who can even LOAD the admin panel UI
// (index.html) to an IP allowlist, as an extra layer in front of the
// existing Supabase Auth admin login.
//
// Scope is deliberately narrow: this matcher covers ONLY the admin UI
// page itself, never /api/*. Several files under admin-panel/api/ are
// called by the end-user MOBILE APP from anywhere in the world (verify-
// purchase.js, verify-purchase-android.js — real purchases from real
// users' phones, gated by NOTIFY_SECRET, not by who's loading the admin
// UI) — IP-restricting those would break purchase verification for every
// paying user outside the allowlist. The admin-facing API routes
// (send-broadcast.js, send-user-notification.js, etc.) already require a
// verified Supabase Auth admin session (lib/verifyAdmin.js), which is a
// stronger check than IP anyway. If you ever widen this matcher, make
// sure it still excludes every route real app users call.
//
// Configuration: set ADMIN_ALLOWED_IPS (Vercel → Settings → Environment
// Variables) to a comma-separated list of allowed IPs, e.g.
// "1.2.3.4,5.6.7.8". Leaving it unset disables the restriction entirely
// (fail-open) — the panel behaves exactly as before until this is set.
export const config = {
  matcher: ['/', '/index.html'],
};

export default function middleware(request) {
  const allowed = process.env.ADMIN_ALLOWED_IPS;
  if (!allowed) return; // not configured — no restriction

  const allowList = allowed
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean);
  if (!allowList.length) return;

  const forwardedFor = request.headers.get('x-forwarded-for') || '';
  const ip = forwardedFor.split(',')[0].trim() || request.ip || '';

  if (!ip || !allowList.includes(ip)) {
    return new Response('Forbidden — this IP is not on the admin access allowlist.', {
      status: 403,
      headers: { 'content-type': 'text/plain' },
    });
  }
}

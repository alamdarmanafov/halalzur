// Shared by any Vercel function that's gated only by a static shared
// secret (NOTIFY_SECRET) rather than a per-user credential — those
// secrets are, by design, the same value in every app install, so
// there's no per-caller identity to throttle against beyond IP. Backed
// by the api_rate_limits table (see
// supabase/migration_2026_09_04_security_hardening.sql) since a Vercel
// function has no in-memory state that survives between invocations.
//
// Fixed-window counter, not sliding — good enough for "stop a script
// from hammering a public-facing action", not meant to be exact.

/**
 * Returns true if the call is allowed (and records it), false if the
 * caller has hit `limit` requests within the last `windowSeconds`.
 * Fails open (returns true) on a DB error — a rate limiter that itself
 * takes the whole endpoint down on a transient DB hiccup is worse than
 * one that occasionally under-throttles.
 */
export async function checkRateLimit(supabase, { bucket, identifier, limit, windowSeconds }) {
  try {
    const now = Date.now();
    const { data: row } = await supabase
      .from('api_rate_limits')
      .select('window_start, request_count')
      .eq('bucket', bucket)
      .eq('identifier', identifier)
      .maybeSingle();

    if (!row || new Date(row.window_start).getTime() < now - windowSeconds * 1000) {
      await supabase
        .from('api_rate_limits')
        .upsert({ bucket, identifier, window_start: new Date(now).toISOString(), request_count: 1 });
      return true;
    }

    if (row.request_count >= limit) return false;

    await supabase
      .from('api_rate_limits')
      .update({ request_count: row.request_count + 1 })
      .eq('bucket', bucket)
      .eq('identifier', identifier);
    return true;
  } catch (err) {
    console.error('checkRateLimit: unexpected error, failing open', err);
    return true;
  }
}

/** Best-effort caller IP from Vercel's forwarding header. */
export function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

-- Critical: device_tokens had "Public insert"/"Public update" (using
-- (true)) — a client-supplied user_id + fcm_token pair, nothing
-- verifying the caller actually owns that device. This doesn't just
-- leak notification content (mild on its own); it completely undermines
-- two push-code "proof of device ownership" flows built earlier this
-- session on the assumption that a device_tokens row means what it says:
--
--   - admin-panel/api/delete-account.js's apple-/google- deletion path
--     pushes a one-time confirmation code to "the account's own
--     registered device(s)" as proof of ownership before deleting.
--   - admin-panel/api/sync-token.js's recovery flow does the same to
--     re-issue a lost sync_token.
--
-- Without this fix, an attacker who knows a victim's user_id (already
-- readable via the public `users` table) could directly upsert
-- {user_id: <victim>, fcm_token: <attacker's own token>} — no victim
-- device or its real token needed at all — then request either flow:
-- the "proof of ownership" code gets pushed straight to the attacker's
-- own device, letting them delete the victim's account or steal their
-- sync_token (and through it, their favorites/history/ratings/etc.)
-- entirely by knowing a public id. Both endpoints were correctly built
-- against this table's *intended* meaning; the table itself was never
-- actually locked to match.
--
-- register_device_token() requires the caller to already hold the
-- account's sync_token — the same one favorites_*/history_* etc. use —
-- so only a device that has genuinely signed in to this account (and
-- therefore already claimed or recovered that token) can register
-- itself as one of its push targets.

drop policy if exists "Public insert" on device_tokens;
drop policy if exists "Public update" on device_tokens;

create or replace function register_device_token(p_user_id text, p_token uuid, p_fcm_token text, p_platform text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into device_tokens (user_id, fcm_token, platform, updated_at)
  select p_user_id, p_fcm_token, p_platform, now()
  where exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token)
  on conflict (fcm_token) do update
    set user_id = excluded.user_id, platform = excluded.platform, updated_at = now();
$$;

grant execute on function register_device_token(text, uuid, text, text) to anon, authenticated;

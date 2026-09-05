-- Closes an open-RLS gap on `favorites` and `scan_history_backup`: both
-- tables had "Public select/insert/update/delete using (true)" policies,
-- meaning anyone holding the public anon key (shipped in every app
-- install) could read, overwrite, or delete ANY account's favorites or
-- scan history by user_id — not just their own. user_id values are not
-- secret (Apple/Google's own account ids, or derived from a Supabase
-- Auth uuid the `users` table already exposes via its own public-read
-- policy), so this was a real cross-account data exposure, same family
-- as the account-deletion IDOR fixed in
-- migration_2026_09_04_security_hardening.sql.
--
-- The underlying reason these were left open is the same one documented
-- there: 'apple-'/'google-' accounts sign in via native SDKs only
-- (lib/auth-context.tsx) and never get a Supabase Auth session, so
-- there's no auth.uid() for RLS to check against for them. 'email-'
-- accounts do have a real session and could already be protected with a
-- standard auth.uid() policy, but for a single consistent mechanism
-- across all three account kinds, this migration instead issues every
-- account a random per-account `sync_token`, claimed once by whichever
-- device signs in to that account id first, and requires it on every
-- favorites/history read or write via SECURITY DEFINER RPCs (the tables
-- themselves get no anon/authenticated policies at all — default deny).
--
-- A device that reinstalls the app (losing its locally stored token)
-- cannot just re-claim an existing account's token — that would let
-- anyone who learns the user_id re-claim it too, exactly the hole this
-- migration closes. Instead it goes through the same push-code
-- proof-of-ownership pattern as account deletion: see
-- sync_token_recovery_codes and admin-panel/api/sync-token.js below.

alter table users add column if not exists sync_token uuid;

-- Only claim_sync_token() below (and the service_role key, which bypasses
-- column privileges entirely) may set this column — the table's existing
-- "Public update using (true)" policy must NOT be able to overwrite it,
-- or anyone could reassign an already-claimed token to themselves. Same
-- column-lockdown technique as `revoke select (email) on users` in
-- migration_2026_09_04_security_hardening.sql.
revoke update (sync_token) on users from anon, authenticated;

create or replace function claim_sync_token(p_user_id text, p_token uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  with claimed as (
    update users set sync_token = p_token
      where id = p_user_id and sync_token is null
    returning 1
  )
  select exists (select 1 from claimed);
$$;

grant execute on function claim_sync_token(text, uuid) to anon, authenticated;

-- favorites: replace the open policies with default-deny + token-gated RPCs.
drop policy if exists "Public select" on favorites;
drop policy if exists "Public insert" on favorites;
drop policy if exists "Public update" on favorites;
drop policy if exists "Public delete" on favorites;

create or replace function favorites_list(p_user_id text, p_token uuid)
returns setof favorites
language sql
security definer
set search_path = public
as $$
  select f.* from favorites f
  where f.user_id = p_user_id
    and exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token)
  order by f.created_at desc;
$$;

create or replace function favorites_upsert(p_user_id text, p_token uuid, p_barcode text, p_data jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  insert into favorites (user_id, barcode, data)
  select p_user_id, p_barcode, p_data
  where exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token)
  on conflict (user_id, barcode) do update set data = excluded.data;
$$;

create or replace function favorites_delete(p_user_id text, p_token uuid, p_barcode text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from favorites f
  where f.user_id = p_user_id and f.barcode = p_barcode
    and exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token);
$$;

grant execute on function favorites_list(text, uuid) to anon, authenticated;
grant execute on function favorites_upsert(text, uuid, text, jsonb) to anon, authenticated;
grant execute on function favorites_delete(text, uuid, text) to anon, authenticated;

-- scan_history_backup: same treatment.
drop policy if exists "Public read/insert/update/delete" on scan_history_backup;

create or replace function history_list(p_user_id text, p_token uuid)
returns setof scan_history_backup
language sql
security definer
set search_path = public
as $$
  select h.* from scan_history_backup h
  where h.user_id = p_user_id
    and exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token)
  order by h.scanned_at desc
  limit 200;
$$;

create or replace function history_add(p_user_id text, p_token uuid, p_barcode text, p_data jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  insert into scan_history_backup (user_id, barcode, data, scanned_at)
  select p_user_id, p_barcode, p_data, now()
  where exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token)
  on conflict (user_id, barcode) do update set data = excluded.data, scanned_at = excluded.scanned_at;
$$;

create or replace function history_remove(p_user_id text, p_token uuid, p_barcode text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from scan_history_backup h
  where h.user_id = p_user_id and h.barcode = p_barcode
    and exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token);
$$;

create or replace function history_clear(p_user_id text, p_token uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from scan_history_backup h
  where h.user_id = p_user_id
    and exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token);
$$;

grant execute on function history_list(text, uuid) to anon, authenticated;
grant execute on function history_add(text, uuid, text, jsonb) to anon, authenticated;
grant execute on function history_remove(text, uuid, text) to anon, authenticated;
grant execute on function history_clear(text, uuid) to anon, authenticated;

-- Backs admin-panel/api/sync-token.js's request/confirm push-code flow —
-- the way a device that lost its local sync_token (reinstall, new
-- device) proves it's the legitimate account owner and gets a fresh
-- token issued, without reopening the hole this migration closes. Same
-- shape as account_deletion_codes; only ever touched by the service_role
-- key, same as that table.
create table if not exists sync_token_recovery_codes (
  user_id text primary key,
  code text not null,
  expires_at timestamptz not null
);

alter table sync_token_recovery_codes enable row level security;
-- No anon/authenticated policies — only ever touched by the service_role
-- key (admin-panel/api/sync-token.js).

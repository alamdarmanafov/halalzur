-- STAGE 1 of 2 — run this FIRST in Supabase → SQL Editor. Safe to run
-- more than once, and safe to run right now: it only ADDS a new table
-- and two helper functions, it does not change any existing table's
-- access rules. Nothing in the app or admin panel breaks from this
-- alone.
--
-- After running this, follow the "bootstrap your first admin account"
-- steps you were given separately, confirm the new admin-panel login
-- works, THEN (and only then) run
-- migration_2026_09_01_admin_roles_stage2_rls.sql.

create table if not exists admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('super_admin', 'moderator')),
  created_at timestamptz not null default now()
);
alter table admin_profiles enable row level security;
drop policy if exists "Admins can read all profiles" on admin_profiles;
create policy "Admins can read all profiles" on admin_profiles for select
  using (exists (select 1 from admin_profiles p where p.id = auth.uid()));
drop policy if exists "Super admins manage profiles" on admin_profiles;
create policy "Super admins manage profiles" on admin_profiles for all
  using (exists (select 1 from admin_profiles p where p.id = auth.uid() and p.role = 'super_admin'))
  with check (exists (select 1 from admin_profiles p where p.id = auth.uid() and p.role = 'super_admin'));

create or replace function is_admin() returns boolean
  language sql security definer stable
  set search_path = public
  as $$ select exists (select 1 from admin_profiles where id = auth.uid()); $$;

create or replace function is_super_admin() returns boolean
  language sql security definer stable
  set search_path = public
  as $$ select exists (select 1 from admin_profiles where id = auth.uid() and role = 'super_admin'); $$;

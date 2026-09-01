-- Run this in Supabase → SQL Editor. Fixes admin_profiles' own RLS
-- policies, which mistakenly queried admin_profiles directly inside
-- their own USING clause (a self-referencing policy) instead of going
-- through the is_admin()/is_super_admin() SECURITY DEFINER functions
-- (which bypass RLS internally and are exactly what those functions
-- are for) — every OTHER table's stage2 policy did this correctly,
-- only admin_profiles' own two policies had the bug. This is why
-- logging in kept saying "not an admin" even with a correct row in
-- admin_profiles.

drop policy if exists "Admins can read all profiles" on admin_profiles;
create policy "Admins can read all profiles" on admin_profiles for select
  using (is_admin());

drop policy if exists "Super admins manage profiles" on admin_profiles;
create policy "Super admins manage profiles" on admin_profiles for all
  using (is_super_admin())
  with check (is_super_admin());

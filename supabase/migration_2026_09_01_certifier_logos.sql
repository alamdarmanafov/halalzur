-- Run this in Supabase → SQL Editor. Adds certifier logo upload support:
-- a `logo_url` column on certifiers, plus a public-read / admin-write
-- Storage bucket the admin panel uploads logo images to directly from
-- the browser (no new Vercel function — this project is already at
-- Vercel's Hobby-plan 12-function cap). Safe to run more than once.

alter table certifiers add column if not exists logo_url text;

insert into storage.buckets (id, name, public)
values ('certifier-logos', 'certifier-logos', true)
on conflict (id) do nothing;

drop policy if exists "Public read certifier logos" on storage.objects;
create policy "Public read certifier logos" on storage.objects for select
  using (bucket_id = 'certifier-logos');

drop policy if exists "Admin write certifier logos" on storage.objects;
create policy "Admin write certifier logos" on storage.objects for insert
  with check (bucket_id = 'certifier-logos' and is_admin());

drop policy if exists "Admin update certifier logos" on storage.objects;
create policy "Admin update certifier logos" on storage.objects for update
  using (bucket_id = 'certifier-logos' and is_admin())
  with check (bucket_id = 'certifier-logos' and is_admin());

drop policy if exists "Admin delete certifier logos" on storage.objects;
create policy "Admin delete certifier logos" on storage.objects for delete
  using (bucket_id = 'certifier-logos' and is_admin());

-- Run this in Supabase -> SQL Editor. Adds a public-read / admin-write
-- Storage bucket the admin panel uploads product images to directly from
-- the browser (no new Vercel function — this project is already at
-- Vercel's Hobby-plan 12-function cap), same pattern as the
-- "certifier-logos" bucket (migration_2026_09_01_certifier_logos.sql).
-- The admin panel already compresses/resizes the image client-side
-- before upload, so this doesn't need its own size handling beyond RLS.
-- Safe to run more than once.

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images" on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "Admin write product images" on storage.objects;
create policy "Admin write product images" on storage.objects for insert
  with check (bucket_id = 'product-images' and is_admin());

drop policy if exists "Admin update product images" on storage.objects;
create policy "Admin update product images" on storage.objects for update
  using (bucket_id = 'product-images' and is_admin())
  with check (bucket_id = 'product-images' and is_admin());

drop policy if exists "Admin delete product images" on storage.objects;
create policy "Admin delete product images" on storage.objects for delete
  using (bucket_id = 'product-images' and is_admin());

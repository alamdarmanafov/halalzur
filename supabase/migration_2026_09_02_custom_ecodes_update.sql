-- The admin panel's "E-kodlar" section can now edit a built-in E-code
-- (creating/updating a custom_ecodes row with the same code as an
-- "override" the app prefers over its hardcoded default) in addition to
-- adding brand-new codes and deleting old ones — custom_ecodes had no
-- update policy at all, so that upsert was silently rejected by RLS.
drop policy if exists "Public update" on custom_ecodes;
create policy "Public update" on custom_ecodes for update using (true) with check (true);

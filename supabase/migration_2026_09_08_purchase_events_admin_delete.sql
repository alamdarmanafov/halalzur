-- Run this in Supabase → SQL Editor. Safe to run more than once.
--
-- purchase_events (the client-logged revenue estimate table, written by
-- app/subscription.tsx after a purchase) had no DELETE policy at all —
-- not even for admins — so a sandbox/test purchase made while testing
-- the app had no way to be removed from the admin panel's revenue
-- dashboard short of deleting the row directly in Supabase. Adds the
-- same is_admin()-gated delete every other admin-cleanup table already
-- has.
drop policy if exists "Admin delete" on purchase_events;
create policy "Admin delete" on purchase_events for delete using (is_admin());

-- audit_log had "Public insert" (using check (true)) — only admin-panel's
-- logAudit() ever writes this, so anyone with the anon key could insert
-- arbitrary rows too. An audit trail anyone can forge entries into is
-- worse than no audit trail: an attacker could plant misleading rows to
-- confuse investigation of their own activity, or spam it into
-- uselessness. Select stays public (already-existing behavior; admin
-- action history isn't sensitive enough on its own to warrant locking
-- reads down too).
drop policy if exists "Public insert" on audit_log;
create policy "Admin insert" on audit_log for insert with check (is_admin());

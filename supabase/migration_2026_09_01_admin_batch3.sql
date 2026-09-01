-- One-time migration: batch-3 admin panel enhancements (feedback status,
-- last-seen tracking, notification templates, referral click tracking,
-- product categories moved to a table). Run once in Supabase → SQL Editor.
-- Safe to re-run — every statement skips or replaces what's already there.

-- Feedback triage status — was previously binary (exists = open, delete
-- = resolved); this lets the admin mark something "baxılır" without
-- losing it, distinct from actually resolving/deleting it.
alter table feedback_reports add column if not exists status text not null default 'open' check (status in ('open', 'in_progress', 'resolved'));

-- Best-effort "when was this account last active" — set opportunistically
-- whenever the app calls syncUser() (plan/language changes, sign-in,
-- achievement grants), not a true real-time heartbeat/presence system.
alter table users add column if not exists last_seen_at timestamptz;

-- Reusable push notification copy so the admin doesn't retype the same
-- announcement text every time.
create table if not exists notification_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);
alter table notification_templates enable row level security;
drop policy if exists "Public read" on notification_templates;
create policy "Public read" on notification_templates for select using (true);
drop policy if exists "Public insert" on notification_templates;
create policy "Public insert" on notification_templates for insert with check (true);
drop policy if exists "Public delete" on notification_templates;
create policy "Public delete" on notification_templates for delete using (true);

-- One row per landing-page view (website/invite.html?code=X) — lets the
-- admin panel show a code's click-through rate alongside its actual
-- referrals (signups) count, not just the signup count alone.
create table if not exists referral_clicks (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  created_at timestamptz not null default now()
);
alter table referral_clicks enable row level security;
drop policy if exists "Public insert" on referral_clicks;
create policy "Public insert" on referral_clicks for insert with check (true);
drop policy if exists "Public read" on referral_clicks;
create policy "Public read" on referral_clicks for select using (true);

-- Product categories, moved out of the hardcoded PRODUCT_CATEGORIES
-- array (lib/categories.ts) so the admin can add/rename/reorder them
-- without a code change. The app still ships a hardcoded fallback for
-- when Supabase isn't configured.
create table if not exists product_categories (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table product_categories enable row level security;
drop policy if exists "Public read" on product_categories;
create policy "Public read" on product_categories for select using (true);
drop policy if exists "Public insert" on product_categories;
create policy "Public insert" on product_categories for insert with check (true);
drop policy if exists "Public update" on product_categories;
create policy "Public update" on product_categories for update using (true) with check (true);
drop policy if exists "Public delete" on product_categories;
create policy "Public delete" on product_categories for delete using (true);

insert into product_categories (label, sort_order)
select v.label, v.sort_order from (values
  ('Şirniyyat', 1), ('Çörək', 2), ('İçki', 3), ('Süd məhsulları', 4), ('Ət məhsulları', 5),
  ('Konservlər', 6), ('Dondurulmuş məhsullar', 7), ('Souslar', 8), ('Qəlyanaltılar', 9),
  ('Dənli məhsullar', 10), ('Uşaq qidası', 11), ('Makaron və düyü', 12), ('Yağlar', 13),
  ('Ədviyyat', 14), ('Kosmetika', 15)
) as v(label, sort_order)
where not exists (select 1 from product_categories pc where pc.label = v.label);

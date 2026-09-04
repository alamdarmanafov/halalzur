-- Text review comments (alongside the existing 1-5 star product_ratings),
-- and a lightweight per-product community Q&A. Both follow the same
-- "public insert/read, no per-row auth" pattern as product_ratings and
-- product_submissions — this app has no real Supabase Auth session for
-- end users, so RLS can't scope by row owner; user_id is carried as a
-- plain column instead, same as everywhere else in this schema.

create table if not exists product_review_comments (
  id uuid primary key default gen_random_uuid(),
  barcode text not null,
  user_id text not null,
  user_name text,
  comment text not null,
  created_at timestamptz not null default now()
);
alter table product_review_comments enable row level security;
drop policy if exists "Public read/insert" on product_review_comments;
create policy "Public read/insert" on product_review_comments for all using (true) with check (true);
create index if not exists product_review_comments_barcode_idx on product_review_comments (barcode);

create table if not exists product_qa_questions (
  id uuid primary key default gen_random_uuid(),
  barcode text not null,
  user_id text not null,
  user_name text,
  question text not null,
  created_at timestamptz not null default now()
);
alter table product_qa_questions enable row level security;
drop policy if exists "Public read/insert" on product_qa_questions;
create policy "Public read/insert" on product_qa_questions for all using (true) with check (true);
create index if not exists product_qa_questions_barcode_idx on product_qa_questions (barcode);

create table if not exists product_qa_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references product_qa_questions (id) on delete cascade,
  user_id text not null,
  user_name text,
  answer text not null,
  created_at timestamptz not null default now()
);
alter table product_qa_answers enable row level security;
drop policy if exists "Public read/insert" on product_qa_answers;
create policy "Public read/insert" on product_qa_answers for all using (true) with check (true);
create index if not exists product_qa_answers_question_id_idx on product_qa_answers (question_id);

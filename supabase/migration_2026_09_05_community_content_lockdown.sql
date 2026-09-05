-- Closes IDOR/impersonation gaps on the remaining community-content
-- tables that still had "Public insert"/"Public update"/"Public delete"
-- policies (using (true)): product_review_comments, product_qa_questions,
-- product_qa_answers, product_ratings, brand_follows. Each write took a
-- client-supplied user_id with nothing checking it belonged to the
-- caller, so anyone holding the app's public anon key could post a
-- comment/question/answer that displays as coming from any other real
-- user, overwrite or delete anyone's 1-5 star product rating, and
-- follow/unfollow brands on anyone's behalf.
--
-- These reuse the sync_token mechanism migration_2026_09_05_sync_token.sql
-- already built for favorites/scan_history_backup (every account gets one,
-- claimed by whichever device signs in first, recoverable via
-- admin-panel/api/sync-token.js's push-code flow) rather than inventing a
-- separate scheme. Unlike favorites/history, SELECT stays public here —
-- comments, ratings, Q&A, and brand follows are public-facing content by
-- design (shown to other users / aggregated), not personal history, so
-- there's no equivalent privacy reason to lock reads down too.

drop policy if exists "Public read/insert" on product_review_comments;
create policy "Public select" on product_review_comments for select using (true);

create or replace function review_comment_add(
  p_user_id text, p_token uuid, p_user_name text, p_barcode text, p_comment text
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into product_review_comments (user_id, user_name, barcode, comment)
  select p_user_id, p_user_name, p_barcode, p_comment
  where exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token);
$$;

grant execute on function review_comment_add(text, uuid, text, text, text) to anon, authenticated;

drop policy if exists "Public read/insert" on product_qa_questions;
create policy "Public select" on product_qa_questions for select using (true);

create or replace function qa_question_add(
  p_user_id text, p_token uuid, p_user_name text, p_barcode text, p_question text
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into product_qa_questions (user_id, user_name, barcode, question)
  select p_user_id, p_user_name, p_barcode, p_question
  where exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token);
$$;

grant execute on function qa_question_add(text, uuid, text, text, text) to anon, authenticated;

drop policy if exists "Public read/insert" on product_qa_answers;
create policy "Public select" on product_qa_answers for select using (true);

create or replace function qa_answer_add(
  p_user_id text, p_token uuid, p_user_name text, p_question_id uuid, p_answer text
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into product_qa_answers (user_id, user_name, question_id, answer)
  select p_user_id, p_user_name, p_question_id, p_answer
  where exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token);
$$;

grant execute on function qa_answer_add(text, uuid, text, uuid, text) to anon, authenticated;

drop policy if exists "Public read/insert/update" on product_ratings;
create policy "Public select" on product_ratings for select using (true);

create or replace function rating_upsert(p_user_id text, p_token uuid, p_barcode text, p_rating smallint)
returns void
language sql
security definer
set search_path = public
as $$
  insert into product_ratings (user_id, barcode, rating, updated_at)
  select p_user_id, p_barcode, p_rating, now()
  where exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token)
  on conflict (user_id, barcode) do update set rating = excluded.rating, updated_at = now();
$$;

grant execute on function rating_upsert(text, uuid, text, smallint) to anon, authenticated;

-- brand_follows keeps public select unchanged (admin-panel's status-change
-- push notification looks this table up across all users by brand, from
-- the admin's own already-privileged session — no reason to add is_admin()
-- gating on top for something this low-sensitivity).
drop policy if exists "Public read/insert/delete" on brand_follows;
create policy "Public select" on brand_follows for select using (true);

create or replace function brand_follow_add(p_user_id text, p_token uuid, p_brand text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into brand_follows (user_id, brand)
  select p_user_id, p_brand
  where exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token)
  on conflict (user_id, brand) do nothing;
$$;

create or replace function brand_follow_remove(p_user_id text, p_token uuid, p_brand text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from brand_follows f
  where f.user_id = p_user_id and f.brand = p_brand
    and exists (select 1 from users u where u.id = p_user_id and u.sync_token = p_token);
$$;

grant execute on function brand_follow_add(text, uuid, text) to anon, authenticated;
grant execute on function brand_follow_remove(text, uuid, text) to anon, authenticated;

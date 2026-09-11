-- Run this in Supabase → SQL Editor. Safe to run more than once
-- (idempotent — once an entry has no comma left, it won't match again).
--
-- A bug in the admin panel's "E-kod əlavə et" fields let a
-- comma-separated paste (e.g. "E420, E330, E322") get pushed into
-- certified_entries.ingredients as ONE array element ("420,330,322")
-- instead of being split into separate E-code entries. That collapsed
-- several E-codes into a single unclassified chip with no halal-status
-- color, instead of each code showing its own color like a normal
-- individually-added E-code. This splits any such comma-containing
-- element back into individual, trimmed, upper-cased pieces and
-- de-duplicates the resulting array. The admin-panel bug itself is
-- already fixed (the input fields now split on comma before saving) —
-- this is only a one-time repair of rows saved while it was broken.
update certified_entries
set ingredients = (
  select array_agg(distinct upper(trim(piece)))
  from unnest(ingredients) as elem
  cross join lateral regexp_split_to_table(elem, '\s*,\s*') as piece
  where trim(piece) <> ''
)
where exists (
  select 1 from unnest(ingredients) as elem where elem like '%,%'
);

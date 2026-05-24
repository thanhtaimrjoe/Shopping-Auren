-- Run once in Supabase Dashboard → SQL Editor (project: Shopping Memo)
-- https://supabase.com/dashboard/project/akyxznfvwogxhcwocukj/sql/new

-- 20260523120000_shopping_list_week_range.sql
ALTER TABLE public.shopping_lists
  ADD COLUMN IF NOT EXISTS week_from_date date,
  ADD COLUMN IF NOT EXISTS week_to_date date;

-- 20260524120000_add_shopping_list_snapshot.sql
ALTER TABLE public.shopping_lists
  ADD COLUMN IF NOT EXISTS snapshot_json jsonb;

COMMENT ON COLUMN public.shopping_lists.snapshot_json IS
  'Frozen item list when status becomes completed; used for history views.';

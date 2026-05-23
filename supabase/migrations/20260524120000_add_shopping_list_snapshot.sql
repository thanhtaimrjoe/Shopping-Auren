-- Shopping list history snapshots (DEC-011)
ALTER TABLE public.shopping_lists
  ADD COLUMN IF NOT EXISTS snapshot_json jsonb;

COMMENT ON COLUMN public.shopping_lists.snapshot_json IS
  'Frozen item list when status becomes completed; used for history views.';

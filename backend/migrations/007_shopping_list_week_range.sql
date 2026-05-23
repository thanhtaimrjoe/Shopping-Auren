-- Migration: 007_shopping_list_week_range
-- Description: Store user-entered week range when finishing shopping (history only)
-- Date: 2026-05-23

BEGIN;

ALTER TABLE public.shopping_lists
  ADD COLUMN IF NOT EXISTS week_from_date date,
  ADD COLUMN IF NOT EXISTS week_to_date date;

COMMIT;

-- Store weekly from-to dates on completed shopping lists (set at finish shopping)

ALTER TABLE public.shopping_lists
  ADD COLUMN IF NOT EXISTS week_from_date date,
  ADD COLUMN IF NOT EXISTS week_to_date date;

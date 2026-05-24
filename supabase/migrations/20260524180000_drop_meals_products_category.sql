-- Remove type/category from meals and products (grouping uses shopping_items.category = meal name)

ALTER TABLE public.meals DROP CONSTRAINT IF EXISTS meals_category_check;
DROP INDEX IF EXISTS public.idx_meals_category;
ALTER TABLE public.meals DROP COLUMN IF EXISTS category;

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_check;
DROP INDEX IF EXISTS public.idx_products_category;
ALTER TABLE public.products DROP COLUMN IF EXISTS category;

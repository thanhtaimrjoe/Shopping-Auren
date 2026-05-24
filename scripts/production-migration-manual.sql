-- ============================================================
-- Shopping Memo — Production Migrations (all pending)
-- Run in: https://supabase.com/dashboard/project/akyxznfvwogxhcwocukj/sql/new
-- Apply in ORDER (1 → 4). Safe to re-run thanks to IF NOT EXISTS / IF EXISTS.
-- ============================================================

-- ① 20260523120000_shopping_list_week_range.sql
-- Store weekly from-to dates on completed shopping lists (set at finish shopping)
ALTER TABLE public.shopping_lists
  ADD COLUMN IF NOT EXISTS week_from_date date,
  ADD COLUMN IF NOT EXISTS week_to_date date;

-- ② 20260524120000_add_shopping_list_snapshot.sql
-- Shopping list history snapshots (DEC-011)
ALTER TABLE public.shopping_lists
  ADD COLUMN IF NOT EXISTS snapshot_json jsonb;

COMMENT ON COLUMN public.shopping_lists.snapshot_json IS
  'Frozen item list when status becomes completed; used for history views.';

-- ③ 20260524140000_product_images_storage.sql
-- Public bucket for product images (matches production path: products/{product_id}/...)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "product_images_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "product_images_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "product_images_authenticated_delete" ON storage.objects;

CREATE POLICY "product_images_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "product_images_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'products'
  AND EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id::text = (storage.foldername(name))[2]
      AND p.user_id = auth.uid()
      AND p.deleted_at IS NULL
  )
);

CREATE POLICY "product_images_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'products'
  AND EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id::text = (storage.foldername(name))[2]
      AND p.user_id = auth.uid()
      AND p.deleted_at IS NULL
  )
);

CREATE POLICY "product_images_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'products'
  AND EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id::text = (storage.foldername(name))[2]
      AND p.user_id = auth.uid()
      AND p.deleted_at IS NULL
  )
);

-- ④ 20260524180000_drop_meals_products_category.sql
-- Remove type/category from meals and products
-- (grouping now uses shopping_items.category = meal name)
ALTER TABLE public.meals DROP CONSTRAINT IF EXISTS meals_category_check;
DROP INDEX IF EXISTS public.idx_meals_category;
ALTER TABLE public.meals DROP COLUMN IF EXISTS category;

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_check;
DROP INDEX IF EXISTS public.idx_products_category;
ALTER TABLE public.products DROP COLUMN IF EXISTS category;

-- ============================================================
-- Verification queries (run after applying above)
-- ============================================================
-- SELECT column_name FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'shopping_lists'
--   ORDER BY ordinal_position;
-- → should include: week_from_date, week_to_date, snapshot_json

-- SELECT column_name FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name IN ('meals', 'products')
--   ORDER BY table_name, ordinal_position;
-- → should NOT include: category

-- SELECT id, name, public FROM storage.buckets WHERE id = 'product-images';
-- → should return 1 row with public = true

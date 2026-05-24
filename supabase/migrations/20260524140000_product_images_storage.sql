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

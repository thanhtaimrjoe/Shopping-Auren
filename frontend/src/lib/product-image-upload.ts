import { supabase } from '@/lib/supabase';

export const PRODUCT_IMAGES_BUCKET = 'product-images';
export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

export function validateProductImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return 'Vui lòng chọn ảnh định dạng JPEG, PNG, WebP, GIF hoặc AVIF.';
  }
  if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
    return 'Kích thước ảnh phải từ 5 MB trở xuống.';
  }
  return null;
}

export function buildProductImagePath(productId: string, fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  const ext = dot >= 0 ? fileName.slice(dot) : '';
  const base = dot >= 0 ? fileName.slice(0, dot) : fileName;
  const safe =
    base
      .normalize('NFKD')
      .replace(/[^\w.-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'image';
  return `products/${productId}/${Date.now()}-${safe}${ext}`;
}

export async function uploadProductImage(productId: string, file: File): Promise<string> {
  const validationError = validateProductImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const path = buildProductImagePath(productId, file.name);
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

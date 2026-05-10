-- Migration: 002_add_columns_to_existing_tables
-- Description: Add user_id, category, deleted_at to meals and products tables
-- Author: Claude (PM)
-- Date: 2026-05-10

-- NOTE: You need to replace 'YOUR_DEFAULT_USER_ID' with actual user ID from Supabase Auth

BEGIN;

-- ============================================
-- 1. Add columns to meals table
-- ============================================

-- Add user_id (nullable first, will set NOT NULL later)
ALTER TABLE public.meals
ADD COLUMN IF NOT EXISTS user_id uuid;

-- Add category with default value
ALTER TABLE public.meals
ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'other';

-- Add deleted_at for soft delete
ALTER TABLE public.meals
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- ============================================
-- 2. Add columns to products table
-- ============================================

-- Add user_id (nullable first, will set NOT NULL later)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS user_id uuid;

-- Add category with default value
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'other';

-- Add deleted_at for soft delete
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

COMMIT;

-- ============================================
-- 3. Set default user_id for existing data
-- ============================================
-- IMPORTANT: Run this AFTER creating a user in Supabase Auth
-- Replace 'YOUR_DEFAULT_USER_ID' with the actual UUID

-- BEGIN;
--
-- UPDATE public.meals
-- SET user_id = 'YOUR_DEFAULT_USER_ID'
-- WHERE user_id IS NULL;
--
-- UPDATE public.products
-- SET user_id = 'YOUR_DEFAULT_USER_ID'
-- WHERE user_id IS NULL;
--
-- COMMIT;

-- ============================================
-- 4. Add NOT NULL constraint and FK
-- ============================================
-- IMPORTANT: Run this AFTER step 3

-- BEGIN;
--
-- -- Make user_id NOT NULL
-- ALTER TABLE public.meals
-- ALTER COLUMN user_id SET NOT NULL;
--
-- ALTER TABLE public.products
-- ALTER COLUMN user_id SET NOT NULL;
--
-- -- Add foreign key constraints
-- ALTER TABLE public.meals
-- ADD CONSTRAINT meals_user_id_fkey
-- FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- ALTER TABLE public.products
-- ADD CONSTRAINT products_user_id_fkey
-- FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- COMMIT;

-- ============================================
-- 5. Add CHECK constraints for category
-- ============================================

BEGIN;

-- meals category constraint
ALTER TABLE public.meals
ADD CONSTRAINT meals_category_check
CHECK (category IN ('japanese', 'western', 'chinese', 'other'));

-- products category constraint
ALTER TABLE public.products
ADD CONSTRAINT products_category_check
CHECK (category IN ('daily', 'consumable', 'other'));

COMMIT;

-- ============================================
-- 6. Create indexes
-- ============================================

BEGIN;

-- meals indexes
CREATE INDEX IF NOT EXISTS idx_meals_user_id_deleted_at
ON public.meals(user_id, deleted_at);

CREATE INDEX IF NOT EXISTS idx_meals_category
ON public.meals(category);

-- products indexes
CREATE INDEX IF NOT EXISTS idx_products_user_id_deleted_at
ON public.products(user_id, deleted_at);

CREATE INDEX IF NOT EXISTS idx_products_category
ON public.products(category);

COMMIT;

-- ============================================
-- Verification queries
-- ============================================

-- Check meals table structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'meals'
-- ORDER BY ordinal_position;

-- Check products table structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'products'
-- ORDER BY ordinal_position;

-- Check indexes
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename IN ('meals', 'products')
-- ORDER BY tablename, indexname;

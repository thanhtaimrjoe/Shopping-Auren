-- Migration: 004_setup_rls
-- Description: Setup Row Level Security (RLS) policies for all tables
-- Author: Claude (PM)
-- Date: 2026-05-10

BEGIN;

-- ============================================
-- 1. Enable RLS on all tables
-- ============================================

ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. Create policies for meals table
-- ============================================

-- Users can view their own meals (excluding soft-deleted)
CREATE POLICY "Users can view their own meals"
ON public.meals
FOR SELECT
USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Users can insert their own meals
CREATE POLICY "Users can insert their own meals"
ON public.meals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own meals
CREATE POLICY "Users can update their own meals"
ON public.meals
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete (soft delete) their own meals
CREATE POLICY "Users can delete their own meals"
ON public.meals
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- 3. Create policies for products table
-- ============================================

-- Users can view their own products (excluding soft-deleted)
CREATE POLICY "Users can view their own products"
ON public.products
FOR SELECT
USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Users can insert their own products
CREATE POLICY "Users can insert their own products"
ON public.products
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own products
CREATE POLICY "Users can update their own products"
ON public.products
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete (soft delete) their own products
CREATE POLICY "Users can delete their own products"
ON public.products
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- 4. Create policies for meal_plans table
-- ============================================

-- Users can view their own meal plans
CREATE POLICY "Users can view their own meal plans"
ON public.meal_plans
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own meal plans
CREATE POLICY "Users can insert their own meal plans"
ON public.meal_plans
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own meal plans
CREATE POLICY "Users can update their own meal plans"
ON public.meal_plans
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own meal plans
CREATE POLICY "Users can delete their own meal plans"
ON public.meal_plans
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- 5. Create policies for meal_plan_items table
-- ============================================

-- Users can view meal plan items for their own meal plans
CREATE POLICY "Users can view their own meal plan items"
ON public.meal_plan_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.meal_plans
    WHERE meal_plans.id = meal_plan_items.meal_plan_id
    AND meal_plans.user_id = auth.uid()
  )
);

-- Users can insert meal plan items for their own meal plans
CREATE POLICY "Users can insert their own meal plan items"
ON public.meal_plan_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.meal_plans
    WHERE meal_plans.id = meal_plan_items.meal_plan_id
    AND meal_plans.user_id = auth.uid()
  )
);

-- Users can update meal plan items for their own meal plans
CREATE POLICY "Users can update their own meal plan items"
ON public.meal_plan_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.meal_plans
    WHERE meal_plans.id = meal_plan_items.meal_plan_id
    AND meal_plans.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.meal_plans
    WHERE meal_plans.id = meal_plan_items.meal_plan_id
    AND meal_plans.user_id = auth.uid()
  )
);

-- Users can delete meal plan items for their own meal plans
CREATE POLICY "Users can delete their own meal plan items"
ON public.meal_plan_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.meal_plans
    WHERE meal_plans.id = meal_plan_items.meal_plan_id
    AND meal_plans.user_id = auth.uid()
  )
);

-- ============================================
-- 6. Create policies for shopping_lists table
-- ============================================

-- Users can view their own shopping lists
CREATE POLICY "Users can view their own shopping lists"
ON public.shopping_lists
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own shopping lists
CREATE POLICY "Users can insert their own shopping lists"
ON public.shopping_lists
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own shopping lists
CREATE POLICY "Users can update their own shopping lists"
ON public.shopping_lists
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own shopping lists
CREATE POLICY "Users can delete their own shopping lists"
ON public.shopping_lists
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- 7. Create policies for shopping_items table
-- ============================================

-- Users can view shopping items for their own shopping lists
CREATE POLICY "Users can view their own shopping items"
ON public.shopping_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shopping_lists
    WHERE shopping_lists.id = shopping_items.shopping_list_id
    AND shopping_lists.user_id = auth.uid()
  )
);

-- Users can insert shopping items for their own shopping lists
CREATE POLICY "Users can insert their own shopping items"
ON public.shopping_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shopping_lists
    WHERE shopping_lists.id = shopping_items.shopping_list_id
    AND shopping_lists.user_id = auth.uid()
  )
);

-- Users can update shopping items for their own shopping lists
CREATE POLICY "Users can update their own shopping items"
ON public.shopping_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.shopping_lists
    WHERE shopping_lists.id = shopping_items.shopping_list_id
    AND shopping_lists.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shopping_lists
    WHERE shopping_lists.id = shopping_items.shopping_list_id
    AND shopping_lists.user_id = auth.uid()
  )
);

-- Users can delete shopping items for their own shopping lists
CREATE POLICY "Users can delete their own shopping items"
ON public.shopping_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.shopping_lists
    WHERE shopping_lists.id = shopping_items.shopping_list_id
    AND shopping_lists.user_id = auth.uid()
  )
);

COMMIT;

-- ============================================
-- Verification queries
-- ============================================

-- Check RLS is enabled
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN ('meals', 'products', 'meal_plans', 'meal_plan_items', 'shopping_lists', 'shopping_items');

-- Check policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- Count policies per table
-- SELECT tablename, COUNT(*) as policy_count
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- GROUP BY tablename
-- ORDER BY tablename;

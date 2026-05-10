-- Migration: 003_create_new_tables
-- Description: Create meal_plans, meal_plan_items, shopping_lists, shopping_items tables
-- Author: Claude (PM)
-- Date: 2026-05-10

BEGIN;

-- ============================================
-- 1. Create meal_plans table
-- ============================================

CREATE TABLE IF NOT EXISTS public.meal_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_start_date date NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT meal_plans_pkey PRIMARY KEY (id),
  CONSTRAINT meal_plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT meal_plans_user_week_unique UNIQUE (user_id, week_start_date),
  CONSTRAINT meal_plans_status_check CHECK (status IN ('draft', 'active', 'completed')),
  CONSTRAINT meal_plans_week_start_monday CHECK (EXTRACT(DOW FROM week_start_date) = 1)
);

-- Create indexes for meal_plans
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_status
ON public.meal_plans(user_id, status);

CREATE INDEX IF NOT EXISTS idx_meal_plans_week_start
ON public.meal_plans(week_start_date);

-- Add comment
COMMENT ON TABLE public.meal_plans IS 'Weekly meal plans (Monday to Sunday)';

-- ============================================
-- 2. Create meal_plan_items table
-- ============================================

CREATE TABLE IF NOT EXISTS public.meal_plan_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  meal_plan_id uuid NOT NULL,
  meal_id uuid NOT NULL,
  day_of_week integer NOT NULL,
  meal_type text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT meal_plan_items_pkey PRIMARY KEY (id),
  CONSTRAINT meal_plan_items_meal_plan_id_fkey FOREIGN KEY (meal_plan_id) REFERENCES public.meal_plans(id) ON DELETE CASCADE,
  CONSTRAINT meal_plan_items_meal_id_fkey FOREIGN KEY (meal_id) REFERENCES public.meals(id) ON DELETE RESTRICT,
  CONSTRAINT meal_plan_items_unique UNIQUE (meal_plan_id, day_of_week, meal_type),
  CONSTRAINT meal_plan_items_day_check CHECK (day_of_week BETWEEN 0 AND 6),
  CONSTRAINT meal_plan_items_type_check CHECK (meal_type IN ('breakfast', 'lunch', 'dinner'))
);

-- Create indexes for meal_plan_items
CREATE INDEX IF NOT EXISTS idx_meal_plan_items_plan
ON public.meal_plan_items(meal_plan_id);

CREATE INDEX IF NOT EXISTS idx_meal_plan_items_meal
ON public.meal_plan_items(meal_id);

-- Add comment
COMMENT ON TABLE public.meal_plan_items IS 'Individual meals in a weekly plan (day_of_week: 0=Monday, 6=Sunday)';

-- ============================================
-- 3. Create shopping_lists table
-- ============================================

CREATE TABLE IF NOT EXISTS public.shopping_lists (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  meal_plan_id uuid,
  week_start_date date NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,

  CONSTRAINT shopping_lists_pkey PRIMARY KEY (id),
  CONSTRAINT shopping_lists_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT shopping_lists_meal_plan_id_fkey FOREIGN KEY (meal_plan_id) REFERENCES public.meal_plans(id) ON DELETE SET NULL,
  CONSTRAINT shopping_lists_status_check CHECK (status IN ('active', 'completed')),
  CONSTRAINT shopping_lists_completed_check CHECK (
    (status = 'completed' AND completed_at IS NOT NULL) OR
    (status != 'completed' AND completed_at IS NULL)
  )
);

-- Create indexes for shopping_lists
CREATE INDEX IF NOT EXISTS idx_shopping_lists_user_status
ON public.shopping_lists(user_id, status);

CREATE INDEX IF NOT EXISTS idx_shopping_lists_week
ON public.shopping_lists(week_start_date);

CREATE INDEX IF NOT EXISTS idx_shopping_lists_meal_plan
ON public.shopping_lists(meal_plan_id);

-- Add comment
COMMENT ON TABLE public.shopping_lists IS 'Shopping lists generated from meal plans';

-- ============================================
-- 4. Create shopping_items table
-- ============================================

CREATE TABLE IF NOT EXISTS public.shopping_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  shopping_list_id uuid NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  source_type text NOT NULL,
  source_id uuid,
  is_checked boolean NOT NULL DEFAULT false,
  checked_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT shopping_items_pkey PRIMARY KEY (id),
  CONSTRAINT shopping_items_shopping_list_id_fkey FOREIGN KEY (shopping_list_id) REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  CONSTRAINT shopping_items_source_type_check CHECK (source_type IN ('meal', 'product', 'manual'))
);

-- Create indexes for shopping_items
CREATE INDEX IF NOT EXISTS idx_shopping_items_list_checked
ON public.shopping_items(shopping_list_id, is_checked);

CREATE INDEX IF NOT EXISTS idx_shopping_items_category
ON public.shopping_items(category);

CREATE INDEX IF NOT EXISTS idx_shopping_items_source
ON public.shopping_items(source_type, source_id);

-- Add comment
COMMENT ON TABLE public.shopping_items IS 'Individual items in a shopping list (source_type: meal/product/manual)';

COMMIT;

-- ============================================
-- Verification queries
-- ============================================

-- Check all new tables exist
-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('meal_plans', 'meal_plan_items', 'shopping_lists', 'shopping_items')
-- ORDER BY table_name;

-- Check meal_plans structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'meal_plans'
-- ORDER BY ordinal_position;

-- Check constraints
-- SELECT conname, contype, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'public.meal_plans'::regclass;

-- Check indexes
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename IN ('meal_plans', 'meal_plan_items', 'shopping_lists', 'shopping_items')
-- ORDER BY tablename, indexname;

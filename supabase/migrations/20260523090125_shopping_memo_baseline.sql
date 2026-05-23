-- Shopping Memo baseline schema (matches production Supabase as of 2026-05-23)

-- ============================================
-- Core tables: meals & products
-- ============================================

CREATE TABLE public.meals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'other',
  deleted_at timestamptz,
  CONSTRAINT meals_pkey PRIMARY KEY (id),
  CONSTRAINT meals_category_check CHECK (category IN ('japanese', 'western', 'chinese', 'other'))
);

CREATE UNIQUE INDEX meals_name_unique_idx ON public.meals (lower(name));
CREATE INDEX idx_meals_user_id_deleted_at ON public.meals (user_id, deleted_at);
CREATE INDEX idx_meals_category ON public.meals (category);

CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'other',
  deleted_at timestamptz,
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_category_check CHECK (category IN ('daily', 'consumable', 'other'))
);

CREATE UNIQUE INDEX products_name_unique_idx ON public.products (lower(name));
CREATE INDEX idx_products_user_id_deleted_at ON public.products (user_id, deleted_at);
CREATE INDEX idx_products_category ON public.products (category);

-- ============================================
-- Meal plans
-- ============================================

CREATE TABLE public.meal_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date date NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT meal_plans_pkey PRIMARY KEY (id),
  CONSTRAINT meal_plans_user_week_unique UNIQUE (user_id, week_start_date),
  CONSTRAINT meal_plans_status_check CHECK (status IN ('draft', 'active', 'completed')),
  CONSTRAINT meal_plans_week_start_monday CHECK (EXTRACT(DOW FROM week_start_date) = 1)
);

CREATE INDEX idx_meal_plans_user_status ON public.meal_plans (user_id, status);
CREATE INDEX idx_meal_plans_week_start ON public.meal_plans (week_start_date);

COMMENT ON TABLE public.meal_plans IS 'Weekly meal plans (Monday to Sunday)';

CREATE TABLE public.meal_plan_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  meal_plan_id uuid NOT NULL REFERENCES public.meal_plans(id) ON DELETE CASCADE,
  meal_id uuid NOT NULL REFERENCES public.meals(id) ON DELETE RESTRICT,
  day_of_week integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT meal_plan_items_pkey PRIMARY KEY (id),
  CONSTRAINT meal_plan_items_day_check CHECK (day_of_week BETWEEN 0 AND 6)
);

CREATE INDEX idx_meal_plan_items_plan ON public.meal_plan_items (meal_plan_id);
CREATE INDEX idx_meal_plan_items_meal ON public.meal_plan_items (meal_id);

COMMENT ON TABLE public.meal_plan_items IS 'Meals in a weekly plan. Max 3 meals/day enforced in app logic.';

-- ============================================
-- Shopping lists
-- ============================================

CREATE TABLE public.shopping_lists (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_plan_id uuid REFERENCES public.meal_plans(id) ON DELETE SET NULL,
  week_start_date date NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT shopping_lists_pkey PRIMARY KEY (id),
  CONSTRAINT shopping_lists_status_check CHECK (status IN ('active', 'completed')),
  CONSTRAINT shopping_lists_completed_check CHECK (
    (status = 'completed' AND completed_at IS NOT NULL)
    OR (status != 'completed' AND completed_at IS NULL)
  )
);

CREATE INDEX idx_shopping_lists_user_status ON public.shopping_lists (user_id, status);
CREATE INDEX idx_shopping_lists_week ON public.shopping_lists (week_start_date);
CREATE INDEX idx_shopping_lists_meal_plan ON public.shopping_lists (meal_plan_id);

COMMENT ON TABLE public.shopping_lists IS 'Shopping lists generated from meal plans';

CREATE TABLE public.shopping_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  shopping_list_id uuid NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL,
  source_type text NOT NULL,
  source_id uuid,
  is_checked boolean NOT NULL DEFAULT false,
  checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  note text,
  CONSTRAINT shopping_items_pkey PRIMARY KEY (id),
  CONSTRAINT shopping_items_source_type_check CHECK (source_type IN ('meal', 'product', 'manual'))
);

CREATE INDEX idx_shopping_items_list_checked ON public.shopping_items (shopping_list_id, is_checked);
CREATE INDEX idx_shopping_items_category ON public.shopping_items (category);
CREATE INDEX idx_shopping_items_source ON public.shopping_items (source_type, source_id);

COMMENT ON TABLE public.shopping_items IS 'Shopping list items; one row per ingredient with optional note.';

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own meals"
ON public.meals FOR SELECT
USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert their own meals"
ON public.meals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meals"
ON public.meals FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meals"
ON public.meals FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own products"
ON public.products FOR SELECT
USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert their own products"
ON public.products FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
ON public.products FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products"
ON public.products FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own meal plans"
ON public.meal_plans FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal plans"
ON public.meal_plans FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plans"
ON public.meal_plans FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal plans"
ON public.meal_plans FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own meal plan items"
ON public.meal_plan_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.meal_plans
    WHERE meal_plans.id = meal_plan_items.meal_plan_id
      AND meal_plans.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own meal plan items"
ON public.meal_plan_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.meal_plans
    WHERE meal_plans.id = meal_plan_items.meal_plan_id
      AND meal_plans.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own meal plan items"
ON public.meal_plan_items FOR UPDATE
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

CREATE POLICY "Users can delete their own meal plan items"
ON public.meal_plan_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.meal_plans
    WHERE meal_plans.id = meal_plan_items.meal_plan_id
      AND meal_plans.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own shopping lists"
ON public.shopping_lists FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shopping lists"
ON public.shopping_lists FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shopping lists"
ON public.shopping_lists FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shopping lists"
ON public.shopping_lists FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own shopping items"
ON public.shopping_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shopping_lists
    WHERE shopping_lists.id = shopping_items.shopping_list_id
      AND shopping_lists.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own shopping items"
ON public.shopping_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shopping_lists
    WHERE shopping_lists.id = shopping_items.shopping_list_id
      AND shopping_lists.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own shopping items"
ON public.shopping_items FOR UPDATE
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

CREATE POLICY "Users can delete their own shopping items"
ON public.shopping_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.shopping_lists
    WHERE shopping_lists.id = shopping_items.shopping_list_id
      AND shopping_lists.user_id = auth.uid()
  )
);

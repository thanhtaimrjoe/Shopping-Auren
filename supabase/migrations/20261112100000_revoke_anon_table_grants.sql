-- Supabase's default privileges grant every new table in `public` to `anon`.
-- This app never serves anonymous users, and no policy exists for `anon`, so RLS
-- already returns zero rows — but the table-level grants were still present and
-- showed up in `information_schema.role_table_grants` (AUR-16, audit 2026-11-12).
-- Removing them shrinks the attack surface to "RLS is the only mistake away".
revoke all on table
  public.ingredients,
  public.meals,
  public.meal_ingredients,
  public.products,
  public.weekly_plans,
  public.weekly_plan_meals,
  public.weekly_plan_products,
  public.active_checklists,
  public.active_checklist_items,
  public.shopping_history
from anon;

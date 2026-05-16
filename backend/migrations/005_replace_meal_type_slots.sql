-- Migration: 005_replace_meal_type_slots
-- Description: Replace breakfast/lunch/dinner mindset with generic ordered slots while keeping max 3 meals per day.

ALTER TABLE public.meal_plan_items
DROP CONSTRAINT IF EXISTS meal_plan_items_type_check;

COMMENT ON COLUMN public.meal_plan_items.meal_type IS
'Display/order slot for a meal inside a day. Frontend uses slot_000, slot_001, slot_002 and backend enforces max 3 meals per day.';

-- Migration: 006_refactor_meal_plan_and_shopping
-- Description: Make meal_type optional and add note column to shopping_items
-- Author: AI Assistant (Senior Fullstack)
-- Date: 2026-05-17

BEGIN;

-- 1. Refactor meal_plan_items
-- Drop existing constraints that depend on meal_type or enforce it
ALTER TABLE public.meal_plan_items DROP CONSTRAINT IF EXISTS meal_plan_items_unique;
ALTER TABLE public.meal_plan_items DROP CONSTRAINT IF EXISTS meal_plan_items_type_check;

-- COMPLETELY DROP meal_type column
ALTER TABLE public.meal_plan_items DROP COLUMN IF EXISTS meal_type;

-- 2. Refactor shopping_items
-- Add note column
ALTER TABLE public.shopping_items ADD COLUMN IF NOT EXISTS note text;

COMMIT;

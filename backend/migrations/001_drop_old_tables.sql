-- Migration: 001_drop_old_tables
-- Description: Drop old weekly_plans and weekly_checklist_items tables
-- Author: Claude (PM)
-- Date: 2026-05-10

-- WARNING: This will delete all data in these tables
-- Make sure to backup if needed

BEGIN;

-- Drop weekly_checklist_items first (has FK to weekly_plans)
DROP TABLE IF EXISTS public.weekly_checklist_items CASCADE;

-- Drop weekly_plans
DROP TABLE IF EXISTS public.weekly_plans CASCADE;

COMMIT;

-- Verification query (should return 0 rows)
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('weekly_plans', 'weekly_checklist_items');

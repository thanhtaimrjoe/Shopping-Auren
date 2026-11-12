-- Historical: the Notion mock seed (37 ingredients / 27 meals / 91 products) was
-- imported on the dev/prod project on 2026-10-30 for one hard-coded auth user.
--
-- That file lived in the migration path, so `supabase db reset` on a fresh project
-- failed with `weekly_plans_user_id_fkey` and personal data sat in the schema history.
-- It now lives at `supabase/seed/notion_mock_2026-10-30.sql` and is run by hand.
--
-- This version is kept so the applied-version history matches the live project.
do $$
begin
  raise notice 'import_notion_seed_user: seed moved to supabase/seed/notion_mock_2026-10-30.sql (not applied automatically)';
end
$$;

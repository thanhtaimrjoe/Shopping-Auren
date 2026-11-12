-- Applied on the dev/prod project on 2026-11-01 08:29 UTC; the file was missing from the repo.
--
-- `rls_auto_enable()` is created by the Supabase platform (event trigger `ensure_rls`),
-- not by this schema. A local `supabase db reset` may run without it, so both the
-- function and the `postgres` role are checked before touching privileges.
do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  ) then
    execute 'revoke all on function public.rls_auto_enable() from public, anon, authenticated';
    if exists (select 1 from pg_roles where rolname = 'postgres') then
      execute 'grant execute on function public.rls_auto_enable() to postgres';
    end if;
  end if;
end
$$;

-- Atomic completion of a shopping session (FR-08, DEC-038 / Q-037).
--
-- Before this, the frontend wrote the History snapshot and closed the Checklist as two
-- separate PostgREST calls. If the second one failed, the user ended up with a new
-- snapshot *and* an open Checklist, and retrying produced a duplicate snapshot.
--
-- Both writes now happen in one transaction, and "there is an active checklist" is a
-- precondition: a finished session cannot be snapshotted twice.
create or replace function public.complete_shopping(
  p_date_from date,
  p_date_to date,
  p_items jsonb
)
returns table (id uuid, created_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_id uuid;
  v_created_at timestamptz;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_date_from is null or p_date_to is null then raise exception 'Date range is required'; end if;
  if p_date_from > p_date_to then raise exception 'date_from must be <= date_to'; end if;
  if p_items is null or pg_catalog.jsonb_typeof(p_items) <> 'array' then
    raise exception 'Checklist items must be an array';
  end if;
  if pg_catalog.jsonb_array_length(p_items) = 0 then raise exception 'Checklist items must not be empty'; end if;

  -- an active checklist must belong to the caller; after a successful completion it is
  -- deleted, so a retry against the same session fails here instead of duplicating.
  if not exists (select 1 from public.active_checklists where user_id = v_user_id) then
    raise exception 'No active checklist';
  end if;

  insert into public.shopping_history(user_id, date_from, date_to, items_snapshot)
    values (v_user_id, p_date_from, p_date_to, p_items)
    returning shopping_history.id, shopping_history.created_at into v_id, v_created_at;

  delete from public.active_checklists where user_id = v_user_id;

  return query select v_id, v_created_at;
end;
$$;

revoke all on function public.complete_shopping(date, date, jsonb) from public, anon;
grant execute on function public.complete_shopping(date, date, jsonb) to authenticated;

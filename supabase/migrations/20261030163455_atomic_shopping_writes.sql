create or replace function public.save_shopping_data(p_data jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_plan_id uuid;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(p_data->'ingredients') <> 'array'
    or jsonb_typeof(p_data->'meals') <> 'array'
    or jsonb_typeof(p_data->'products') <> 'array'
    or jsonb_typeof(p_data->'plan') <> 'object'
    or jsonb_typeof(p_data->'planProductIds') <> 'array'
  then raise exception 'Invalid shopping data'; end if;

  insert into public.weekly_plans(user_id) values (v_user_id)
    on conflict (user_id) do update set updated_at = now()
    returning id into v_plan_id;

  delete from public.weekly_plan_meals where user_id = v_user_id;
  delete from public.weekly_plan_products where user_id = v_user_id;
  delete from public.meal_ingredients where user_id = v_user_id;

  insert into public.ingredients(id, user_id, name)
    select x.id, v_user_id, x.name
    from pg_catalog.jsonb_to_recordset(p_data->'ingredients') as x(id uuid, name text)
    on conflict (id) do update set name = excluded.name;
  insert into public.meals(id, user_id, name)
    select x.id, v_user_id, x.name
    from pg_catalog.jsonb_to_recordset(p_data->'meals') as x(id uuid, name text)
    on conflict (id) do update set name = excluded.name;
  insert into public.products(id, user_id, name, category)
    select x.id, v_user_id, x.name, x.category::public.shopping_category
    from pg_catalog.jsonb_to_recordset(p_data->'products') as x(id uuid, name text, category text)
    on conflict (id) do update set name = excluded.name, category = excluded.category;

  delete from public.meals m where m.user_id = v_user_id and not exists (
    select 1 from pg_catalog.jsonb_to_recordset(p_data->'meals') as x(id uuid) where x.id = m.id
  );
  delete from public.ingredients i where i.user_id = v_user_id and not exists (
    select 1 from pg_catalog.jsonb_to_recordset(p_data->'ingredients') as x(id uuid) where x.id = i.id
  );
  delete from public.products p where p.user_id = v_user_id and not exists (
    select 1 from pg_catalog.jsonb_to_recordset(p_data->'products') as x(id uuid) where x.id = p.id
  );

  insert into public.meal_ingredients(user_id, meal_id, ingredient_id, position)
    select v_user_id, meal.id, ingredient.value::uuid, (ingredient.ordinality - 1)::smallint
    from pg_catalog.jsonb_array_elements(p_data->'meals') as meal(value)
    cross join lateral pg_catalog.jsonb_array_elements_text(meal.value->'ingredientIds') with ordinality as ingredient(value, ordinality);

  insert into public.weekly_plan_meals(user_id, plan_id, meal_id, weekday, position)
    select v_user_id, v_plan_id, placement.meal_id::uuid,
      case day.day_name
        when 'Thứ Hai' then 1 when 'Thứ Ba' then 2 when 'Thứ Tư' then 3
        when 'Thứ Năm' then 4 when 'Thứ Sáu' then 5 when 'Thứ Bảy' then 6
        when 'Chủ Nhật' then 7 else null
      end,
      placement.ordinality::smallint
    from pg_catalog.jsonb_each(p_data->'plan') as day(day_name, meal_ids)
    cross join lateral pg_catalog.jsonb_array_elements_text(day.meal_ids) with ordinality as placement(meal_id, ordinality);

  insert into public.weekly_plan_products(user_id, plan_id, product_id)
    select v_user_id, v_plan_id, product.value::uuid
    from pg_catalog.jsonb_array_elements_text(p_data->'planProductIds') as product(value);
end;
$$;

create or replace function public.save_active_checklist(p_items jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_checklist_id uuid;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_items is not null and pg_catalog.jsonb_typeof(p_items) <> 'array' then
    raise exception 'Checklist items must be an array or null';
  end if;
  if p_items is null then
    delete from public.active_checklists where user_id = v_user_id;
    return;
  end if;

  insert into public.active_checklists(user_id) values (v_user_id)
    on conflict (user_id) do update set created_at = public.active_checklists.created_at
    returning id into v_checklist_id;
  delete from public.active_checklist_items where user_id = v_user_id and checklist_id = v_checklist_id;
  insert into public.active_checklist_items(
    id, user_id, checklist_id, source_ingredient_id, source_product_id, kind,
    name_snapshot, category_snapshot, meal_name_snapshot, placement_id, checked, position
  )
  select
    x.id, v_user_id, v_checklist_id, x.source_ingredient_id, x.source_product_id,
    x.kind::public.checklist_item_kind, x.name_snapshot,
    x.category_snapshot::public.shopping_category, x.meal_name_snapshot, x.placement_id,
    x.checked, x.position
  from pg_catalog.jsonb_to_recordset(p_items) as x(
    id uuid, source_ingredient_id uuid, source_product_id uuid, kind text, name_snapshot text,
    category_snapshot text, meal_name_snapshot text, placement_id text, checked boolean, position integer
  );
end;
$$;

revoke all on function public.save_shopping_data(jsonb) from public, anon;
revoke all on function public.save_active_checklist(jsonb) from public, anon;
grant execute on function public.save_shopping_data(jsonb) to authenticated;
grant execute on function public.save_active_checklist(jsonb) to authenticated;

-- Hardening: save_shopping_data must reject a malformed payload instead of wiping the user's data.
--
-- The previous guard used `<> 'array'`. For a missing key, `p_data->'ingredients'` is SQL NULL,
-- `jsonb_typeof(NULL)` is NULL, and `NULL <> 'array'` evaluates to NULL (not TRUE), so
-- `if NULL then` never fired and the function ran its destructive path: it deleted every
-- ingredient, meal, product, meal_ingredient and weekly-plan row for the caller and then
-- inserted nothing. `is distinct from` treats NULL as different, so a missing key is now rejected.
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
  if jsonb_typeof(p_data->'ingredients') is distinct from 'array'
    or jsonb_typeof(p_data->'meals') is distinct from 'array'
    or jsonb_typeof(p_data->'products') is distinct from 'array'
    or jsonb_typeof(p_data->'plan') is distinct from 'object'
    or jsonb_typeof(p_data->'planProductIds') is distinct from 'array'
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
    select v_user_id, (meal.value->>'id')::uuid, ingredient.value::uuid, (ingredient.ordinality - 1)::smallint
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

revoke all on function public.save_shopping_data(jsonb) from public, anon;
grant execute on function public.save_shopping_data(jsonb) to authenticated;

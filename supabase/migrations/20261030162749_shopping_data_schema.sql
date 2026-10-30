-- Shopping-Auren MVP schema. Every row belongs to the authenticated user.
create type public.shopping_category as enum (
  'Vệ sinh nhà cửa', 'Giấy và đồ dùng một lần', 'Chăm sóc cá nhân',
  'Đồ dùng gia đình', 'Khác'
);

create type public.checklist_item_kind as enum ('ingredient', 'product', 'other');

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  created_at timestamptz not null default now(),
  unique (user_id, id)
);
create unique index ingredients_user_name_key on public.ingredients (user_id, lower(regexp_replace(btrim(name), '\s+', ' ', 'g')));

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  created_at timestamptz not null default now(),
  unique (user_id, id)
);
create unique index meals_user_name_key on public.meals (user_id, lower(regexp_replace(btrim(name), '\s+', ' ', 'g')));

create table public.meal_ingredients (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  meal_id uuid not null,
  ingredient_id uuid not null,
  position smallint not null default 0 check (position >= 0),
  primary key (meal_id, ingredient_id),
  foreign key (user_id, meal_id) references public.meals(user_id, id) on delete cascade,
  foreign key (user_id, ingredient_id) references public.ingredients(user_id, id) on delete restrict
);
create index meal_ingredients_ingredient_idx on public.meal_ingredients (user_id, ingredient_id);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  category public.shopping_category not null default 'Khác',
  created_at timestamptz not null default now(),
  unique (user_id, id)
);
create unique index products_user_name_key on public.products (user_id, lower(regexp_replace(btrim(name), '\s+', ' ', 'g')));

create table public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique default auth.uid() references auth.users(id) on delete cascade,
  updated_at timestamptz not null default now(),
  unique (user_id, id)
);
create table public.weekly_plan_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  plan_id uuid not null,
  meal_id uuid not null,
  weekday smallint not null check (weekday between 1 and 7),
  position smallint not null check (position between 1 and 3),
  foreign key (user_id, plan_id) references public.weekly_plans(user_id, id) on delete cascade,
  foreign key (user_id, meal_id) references public.meals(user_id, id) on delete restrict,
  unique (plan_id, weekday, position),
  unique (plan_id, weekday, meal_id)
);
create index weekly_plan_meals_meal_idx on public.weekly_plan_meals (user_id, meal_id);

create table public.weekly_plan_products (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  plan_id uuid not null,
  product_id uuid not null,
  primary key (plan_id, product_id),
  foreign key (user_id, plan_id) references public.weekly_plans(user_id, id) on delete cascade,
  foreign key (user_id, product_id) references public.products(user_id, id) on delete restrict
);
create index weekly_plan_products_product_idx on public.weekly_plan_products (user_id, product_id);

create table public.active_checklists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, id)
);
create table public.active_checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  checklist_id uuid not null,
  source_ingredient_id uuid,
  source_product_id uuid,
  kind public.checklist_item_kind not null,
  name_snapshot text not null check (length(btrim(name_snapshot)) > 0),
  category_snapshot public.shopping_category,
  meal_name_snapshot text,
  placement_id text,
  checked boolean not null default false,
  position integer not null check (position >= 0),
  foreign key (user_id, checklist_id) references public.active_checklists(user_id, id) on delete cascade,
  foreign key (user_id, source_ingredient_id) references public.ingredients(user_id, id) on delete set null (source_ingredient_id),
  foreign key (user_id, source_product_id) references public.products(user_id, id) on delete set null (source_product_id),
  check ((kind = 'ingredient' and source_product_id is null) or (kind = 'product' and source_ingredient_id is null) or kind = 'other')
);
create index active_checklist_items_owner_checklist_idx on public.active_checklist_items (user_id, checklist_id, position);

create table public.shopping_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date_from date not null,
  date_to date not null,
  created_at timestamptz not null default now(),
  items_snapshot jsonb not null check (jsonb_typeof(items_snapshot) = 'array'),
  check (date_from <= date_to)
);
create index shopping_history_owner_created_idx on public.shopping_history (user_id, created_at desc);

-- Explicit table grants also expose the tables to PostgREST Data API on newer projects.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.ingredients, public.meals, public.meal_ingredients,
  public.products, public.weekly_plans, public.weekly_plan_meals, public.weekly_plan_products,
  public.active_checklists, public.active_checklist_items to authenticated;
grant select, insert, delete on public.shopping_history to authenticated;
grant usage, select on all sequences in schema public to authenticated;

alter table public.ingredients enable row level security;
alter table public.meals enable row level security;
alter table public.meal_ingredients enable row level security;
alter table public.products enable row level security;
alter table public.weekly_plans enable row level security;
alter table public.weekly_plan_meals enable row level security;
alter table public.weekly_plan_products enable row level security;
alter table public.active_checklists enable row level security;
alter table public.active_checklist_items enable row level security;
alter table public.shopping_history enable row level security;

create policy ingredients_owner_all on public.ingredients for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy meals_owner_all on public.meals for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy meal_ingredients_owner_all on public.meal_ingredients for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy products_owner_all on public.products for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy weekly_plans_owner_all on public.weekly_plans for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy weekly_plan_meals_owner_all on public.weekly_plan_meals for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy weekly_plan_products_owner_all on public.weekly_plan_products for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy active_checklists_owner_all on public.active_checklists for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy active_checklist_items_owner_all on public.active_checklist_items for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy shopping_history_owner_select on public.shopping_history for select to authenticated using ((select auth.uid()) = user_id);
create policy shopping_history_owner_insert on public.shopping_history for insert to authenticated with check ((select auth.uid()) = user_id);
create policy shopping_history_owner_delete on public.shopping_history for delete to authenticated using ((select auth.uid()) = user_id);

-- Import the approved Shopping-Auren Notion mock seed for the specified account.
-- The two identical “Lạp xưởng chiên” rows are merged into one Meal, per PO decision.
insert into public.weekly_plans(user_id)
values ('b5ed7b6e-0225-4132-951d-3da27646a864'::uuid)
on conflict (user_id) do nothing;

with
source_ingredients(source_id, name) as (
  values
    ('i-001', 'Sườn heo'),
    ('i-002', 'củ dền'),
    ('i-003', 'khoai tây'),
    ('i-004', 'cà rốt'),
    ('i-005', 'Trứng chiên'),
    ('i-006', 'nấm đùi gà'),
    ('i-007', 'Xúc xích'),
    ('i-008', 'ớt chuông'),
    ('i-009', 'Thịt heo'),
    ('i-010', 'hành lá'),
    ('i-011', 'Cá'),
    ('i-012', 'khóm'),
    ('i-013', 'Thịt bò'),
    ('i-014', 'khoai lang'),
    ('i-015', 'hành tây'),
    ('i-016', 'Bí ngòi'),
    ('i-017', 'Thịt gà'),
    ('i-018', 'rau'),
    ('i-019', 'Rau muống'),
    ('i-020', 'tỏi'),
    ('i-021', 'Trứng'),
    ('i-022', 'Mực'),
    ('i-023', 'đậu bắp'),
    ('i-024', 'tàu hủ'),
    ('i-025', 'cà chua'),
    ('i-026', 'lạp xưởng'),
    ('i-027', 'Cá hồi'),
    ('i-028', 'su su'),
    ('i-029', 'Bịt 餃子'),
    ('i-030', 'bông cải xanh'),
    ('i-031', 'Bịt cơm chiên'),
    ('i-032', 'Cải thìa'),
    ('i-033', 'bịt cải chua'),
    ('i-034', 'nấm đông cô'),
    ('i-035', 'Chả rế'),
    ('i-036', 'măng'),
    ('i-037', 'thiên lý')
),
inserted_ingredients as (
  insert into public.ingredients(user_id, name)
  select 'b5ed7b6e-0225-4132-951d-3da27646a864'::uuid, s.name from source_ingredients s
  returning id, name
),
ingredient_map as (
  select s.source_id, i.id from source_ingredients s join inserted_ingredients i using (name)
),
source_meals(source_id, name, ingredient_source_ids) as (
  values
    ('m-001', 'Canh củ hầm thịt', array['i-001', 'i-002', 'i-003', 'i-004']::text[]),
    ('m-002', 'Trứng xào nấm đùi gà', array['i-005', 'i-006']::text[]),
    ('m-003', 'Xúc xích xào ớt chuông', array['i-007', 'i-008']::text[]),
    ('m-004', 'Thịt kho', array['i-009', 'i-010']::text[]),
    ('m-005', 'Cá kho khóm', array['i-011', 'i-012', 'i-010']::text[]),
    ('m-006', 'Thịt kho khóm', array['i-009', 'i-012', 'i-010']::text[]),
    ('m-007', 'Thịt bò hầm củ', array['i-013', 'i-004', 'i-014', 'i-015']::text[]),
    ('m-008', 'Trứng xào bí ngòi', array['i-016', 'i-005']::text[]),
    ('m-009', 'Thịt gà xào', array['i-017', 'i-018']::text[]),
    ('m-010', 'Gà chiên nước mắm', array['i-017']::text[]),
    ('m-011', 'Rau muống xào tỏi', array['i-019', 'i-020']::text[]),
    ('m-012', 'Trứng chiên cuộn', array['i-021']::text[]),
    ('m-013', 'Hải sản xào thập cẩm', array['i-022', 'i-008', 'i-023', 'i-015']::text[]),
    ('m-014', 'Tàu hủ sốt cà chua, trứng', array['i-024', 'i-025', 'i-021']::text[]),
    ('m-015', 'Lạp xưởng chiên', array['i-026']::text[]),
    ('m-016', 'Cá hồi chiên', array['i-027']::text[]),
    ('m-017', 'Thịt luộc', array['i-009']::text[]),
    ('m-018', 'Thịt xào su su cà rốt', array['i-009', 'i-028', 'i-004']::text[]),
    ('m-019', '餃子', array['i-029']::text[]),
    ('m-020', 'Xúc xích xào bông cải xanh', array['i-007', 'i-030']::text[]),
    ('m-021', 'Cơm chiên viên châu', array['i-031', 'i-026']::text[]),
    ('m-023', 'Canh cải thìa', array['i-032']::text[]),
    ('m-024', 'Thịt kho cải chua', array['i-009', 'i-033']::text[]),
    ('m-025', 'Gà kho nấm đông cô', array['i-017', 'i-034']::text[]),
    ('m-026', 'Chả rế chiên', array['i-035']::text[]),
    ('m-027', 'Thịt kho măng', array['i-009', 'i-036']::text[]),
    ('m-028', 'Bò xào thiên lý và hành tây', array['i-013', 'i-037', 'i-015']::text[])
),
inserted_meals as (
  insert into public.meals(user_id, name)
  select 'b5ed7b6e-0225-4132-951d-3da27646a864'::uuid, s.name from source_meals s
  returning id, name
),
meal_map as (
  select s.source_id, m.id from source_meals s join inserted_meals m using (name)
),
inserted_meal_ingredients as (
  insert into public.meal_ingredients(user_id, meal_id, ingredient_id, position)
  select 'b5ed7b6e-0225-4132-951d-3da27646a864'::uuid, mm.id, im.id, (ref.ordinality - 1)::smallint
  from source_meals s
  join meal_map mm on mm.source_id = s.source_id
  cross join lateral unnest(s.ingredient_source_ids) with ordinality as ref(source_id, ordinality)
  join ingredient_map im on im.source_id = ref.source_id
  returning meal_id
),
source_products(source_id, name, category) as (
  values
    ('p-001', 'Lốc sữa', 'Khác'),
    ('p-002', 'Vỉ trứng', 'Khác'),
    ('p-003', 'Ngũ cốc', 'Khác'),
    ('p-004', 'Khăn ướt', 'Giấy và đồ dùng một lần'),
    ('p-005', 'Dorayaki', 'Khác'),
    ('p-006', 'Ngũ vị hương', 'Khác'),
    ('p-007', 'Băng vệ sinh', 'Chăm sóc cá nhân'),
    ('p-008', 'Trà Atiso', 'Khác'),
    ('p-009', 'Snack Lays', 'Khác'),
    ('p-010', 'Bánh flan', 'Khác'),
    ('p-011', 'Tăm bông', 'Chăm sóc cá nhân'),
    ('p-012', '午後の紅茶', 'Khác'),
    ('p-013', 'Khoai', 'Khác'),
    ('p-014', 'Tuyp sữa đặc', 'Khác'),
    ('p-015', 'Dầu gội', 'Chăm sóc cá nhân'),
    ('p-016', 'Son dưỡng', 'Chăm sóc cá nhân'),
    ('p-017', 'Aquarius', 'Khác'),
    ('p-018', 'Miếng rửa chén', 'Vệ sinh nhà cửa'),
    ('p-019', 'Bánh bông lan Bon', 'Khác'),
    ('p-020', 'Sữa rửa mặt', 'Chăm sóc cá nhân'),
    ('p-021', 'Hành tím', 'Khác'),
    ('p-022', 'Sữa hạnh nhân', 'Khác'),
    ('p-023', 'Chả lụa', 'Khác'),
    ('p-024', 'Sữa tắm', 'Chăm sóc cá nhân'),
    ('p-025', 'Pop', 'Khác'),
    ('p-026', 'Sữa Anchor nguyên kem', 'Khác'),
    ('p-027', 'Tiêu', 'Khác'),
    ('p-028', 'Bông phấn phủ', 'Chăm sóc cá nhân'),
    ('p-029', 'Khẩu trang', 'Chăm sóc cá nhân'),
    ('p-030', 'Kẹo ngậm', 'Khác'),
    ('p-031', 'Coca Cola không Calo', 'Khác'),
    ('p-032', 'Sáp thơm', 'Vệ sinh nhà cửa'),
    ('p-033', 'Tương ớt xí muội', 'Khác'),
    ('p-034', 'Giấy vệ sinh', 'Giấy và đồ dùng một lần'),
    ('p-035', 'Sữa hạt Hàn Quốc', 'Khác'),
    ('p-036', 'Sữa Oatside', 'Khác'),
    ('p-037', 'Sữa mộc châu', 'Khác'),
    ('p-038', 'Muối Hảo Hảo', 'Khác'),
    ('p-039', 'Khăn giấy ướt nhỏ', 'Giấy và đồ dùng một lần'),
    ('p-040', 'Tấm thớt', 'Đồ dùng gia đình'),
    ('p-041', 'Dĩa trái cây', 'Đồ dùng gia đình'),
    ('p-042', '麦茶', 'Khác'),
    ('p-043', 'Bông tẩy trang', 'Chăm sóc cá nhân'),
    ('p-044', 'Trà lá', 'Khác'),
    ('p-045', 'Xôi Gà Nấm Đông Cô', 'Khác'),
    ('p-046', 'Dầu ăn', 'Khác'),
    ('p-047', 'Lạp xưởng', 'Khác'),
    ('p-048', 'Nước tương', 'Khác'),
    ('p-049', 'Cà phê', 'Khác'),
    ('p-050', 'Túi rác', 'Vệ sinh nhà cửa'),
    ('p-051', 'Muối', 'Khác'),
    ('p-052', 'Sữa whip cream', 'Khác'),
    ('p-053', 'Bàn chải đánh răng', 'Chăm sóc cá nhân'),
    ('p-054', 'Kem dưỡng ẩm', 'Chăm sóc cá nhân'),
    ('p-055', 'Đường', 'Khác'),
    ('p-056', 'Bánh Chocopie', 'Khác'),
    ('p-057', 'Sữa TH', 'Khác'),
    ('p-058', 'Yakurt', 'Khác'),
    ('p-059', 'Sữa đặc', 'Khác'),
    ('p-060', 'Snack', 'Khác'),
    ('p-061', 'Tissue', 'Giấy và đồ dùng một lần'),
    ('p-062', 'Hành lá', 'Khác'),
    ('p-063', 'Nước mắm', 'Khác'),
    ('p-064', 'Bánh bao', 'Khác'),
    ('p-065', 'Sữa Đà Lạt Milk hộp nhỏ', 'Khác'),
    ('p-066', 'Codex Test Nuoc rua chen 2026-05-30', 'Vệ sinh nhà cửa'),
    ('p-067', 'Đũa gỗ', 'Đồ dùng gia đình'),
    ('p-068', 'Chảo', 'Đồ dùng gia đình'),
    ('p-069', 'Trà gừng', 'Khác'),
    ('p-070', 'Bánh giò', 'Khác'),
    ('p-071', 'Bánh bao than tre', 'Khác'),
    ('p-072', 'Tỏi', 'Khác'),
    ('p-073', 'Sữa đậu nành kikkoman', 'Khác'),
    ('p-074', 'Sữa Vinamilk Flex', 'Khác'),
    ('p-075', 'Kem đánh răng', 'Chăm sóc cá nhân'),
    ('p-076', 'Màng bọc thực phẩm', 'Đồ dùng gia đình'),
    ('p-077', 'Khử mùi tủ lạnh', 'Vệ sinh nhà cửa'),
    ('p-078', 'Hạt nêm', 'Khác'),
    ('p-079', 'Hạt điều', 'Khác'),
    ('p-080', 'Kem dưỡng tay', 'Chăm sóc cá nhân'),
    ('p-081', 'Tương cà', 'Khác'),
    ('p-082', 'Trà hoa cúc', 'Khác'),
    ('p-083', 'Sữa dưỡng thể', 'Chăm sóc cá nhân'),
    ('p-084', 'Codex Test Khan giay 2026-05-30', 'Giấy và đồ dùng một lần'),
    ('p-085', 'Miếng dán tường', 'Đồ dùng gia đình'),
    ('p-086', 'Sữa chuối Kikkoman', 'Khác'),
    ('p-087', 'Công chúa', 'Khác'),
    ('p-088', 'Milo', 'Khác'),
    ('p-089', 'Dừa', 'Khác'),
    ('p-090', 'Bánh ngũ cốc', 'Khác'),
    ('p-091', 'Bánh bí đỏ', 'Khác')
),
inserted_products as (
  insert into public.products(user_id, name, category)
  select 'b5ed7b6e-0225-4132-951d-3da27646a864'::uuid, s.name, s.category::public.shopping_category
  from source_products s
  returning id
)
select
  (select count(*) from inserted_ingredients) as ingredients_imported,
  (select count(*) from inserted_meals) as meals_imported,
  (select count(*) from inserted_meal_ingredients) as meal_ingredients_imported,
  (select count(*) from inserted_products) as products_imported;

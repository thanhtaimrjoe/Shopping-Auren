update public.products
set category = 'Thực phẩm'::public.shopping_category
where category = 'Khác'::public.shopping_category
  and name = any (array[
    'Bánh bao', 'Bánh bao than tre', 'Bánh bí đỏ', 'Bánh bông lan Bon',
    'Bánh Chocopie', 'Bánh flan', 'Bánh gạo An', 'Bánh giò', 'Bánh ngũ cốc',
    'Chả lụa', 'Dầu ăn', 'Dorayaki', 'Dừa', 'Đường', 'Hành lá', 'Hành tím',
    'Hạt điều', 'Hạt nêm', 'Kẹo ngậm', 'Khoai', 'Lạp xưởng', 'Mì ăn liền',
    'Muối', 'Muối Hảo Hảo', 'Ngũ cốc', 'Ngũ vị hương', 'Nước mắm', 'Nước tương',
    'Snack', 'Snack Lays', 'Sữa đặc', 'Sữa whip cream', 'Tiêu', 'Tỏi',
    'Tương cà', 'Tương ớt xí muội', 'Tuyp sữa đặc', 'Vỉ trứng',
    'Xôi Gà Nấm Đông Cô', 'Yakurt'
  ]);

update public.products
set category = 'Đồ uống'::public.shopping_category
where category = 'Khác'::public.shopping_category
  and name = any (array[
    'Aquarius', 'Cà phê', 'Coca Cola không Calo', 'Lốc sữa', 'Milo',
    'Sữa Anchor nguyên kem', 'Sữa chuối Kikkoman', 'Sữa Đà Lạt Milk hộp nhỏ',
    'Sữa đậu nành kikkoman', 'Sữa hạnh nhân', 'Sữa hạt Hàn Quốc', 'Sữa mộc châu',
    'Sữa Oatside', 'Sữa TH', 'Sữa Vinamilk Flex', 'Trà Atiso', 'Trà gừng',
    'Trà hoa cúc', 'Trà lá', '午後の紅茶', '麦茶'
  ]);

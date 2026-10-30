export type Category =
  | 'Vệ sinh nhà cửa'
  | 'Giấy và đồ dùng một lần'
  | 'Chăm sóc cá nhân'
  | 'Đồ dùng gia đình'
  | 'Khác';

export const categories: Category[] = [
  'Vệ sinh nhà cửa',
  'Giấy và đồ dùng một lần',
  'Chăm sóc cá nhân',
  'Đồ dùng gia đình',
  'Khác',
];

export const weekdays = [
  'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật',
] as const;
export type Weekday = (typeof weekdays)[number];

export type Ingredient = { id: string; name: string };
export type Meal = { id: string; name: string; ingredientIds: string[] };
export type Product = { id: string; name: string; category: Category };
export type Plan = Record<Weekday, string[]>;
export type ChecklistItem = {
  id: string;
  name: string;
  kind: 'ingredient' | 'product' | 'other';
  checked: boolean;
  category?: Category;
  placementId?: string;
  mealName?: string;
  sourceId?: string;
};
export type Snapshot = {
  id: string;
  from: string;
  to: string;
  createdAt: string;
  items: ChecklistItem[];
};

export interface ShoppingRepository {
  load(): Promise<ShoppingData>;
  save(data: ShoppingData): Promise<void>;
}
export type ShoppingData = {
  ingredients: Ingredient[];
  meals: Meal[];
  products: Product[];
  plan: Plan;
  planProductIds: string[];
};

// Local demo repository. No remote API, Supabase client, credentials, or durable persistence.
export class InMemoryShoppingRepository implements ShoppingRepository {
  private data: ShoppingData = {
    ingredients: [
      { id: 'i-001', name: "Sườn heo" },
      { id: 'i-002', name: "củ dền" },
      { id: 'i-003', name: "khoai tây" },
      { id: 'i-004', name: "cà rốt" },
      { id: 'i-005', name: "Trứng chiên" },
      { id: 'i-006', name: "nấm đùi gà" },
      { id: 'i-007', name: "Xúc xích" },
      { id: 'i-008', name: "ớt chuông" },
      { id: 'i-009', name: "Thịt heo" },
      { id: 'i-010', name: "hành lá" },
      { id: 'i-011', name: "Cá" },
      { id: 'i-012', name: "khóm" },
      { id: 'i-013', name: "Thịt bò" },
      { id: 'i-014', name: "khoai lang" },
      { id: 'i-015', name: "hành tây" },
      { id: 'i-016', name: "Bí ngòi" },
      { id: 'i-017', name: "Thịt gà" },
      { id: 'i-018', name: "rau" },
      { id: 'i-019', name: "Rau muống" },
      { id: 'i-020', name: "tỏi" },
      { id: 'i-021', name: "Trứng" },
      { id: 'i-022', name: "Mực" },
      { id: 'i-023', name: "đậu bắp" },
      { id: 'i-024', name: "tàu hủ" },
      { id: 'i-025', name: "cà chua" },
      { id: 'i-026', name: "lạp xưởng" },
      { id: 'i-027', name: "Cá hồi" },
      { id: 'i-028', name: "su su" },
      { id: 'i-029', name: "Bịt 餃子" },
      { id: 'i-030', name: "bông cải xanh" },
      { id: 'i-031', name: "Bịt cơm chiên" },
      { id: 'i-032', name: "Cải thìa" },
      { id: 'i-033', name: "bịt cải chua" },
      { id: 'i-034', name: "nấm đông cô" },
      { id: 'i-035', name: "Chả rế" },
      { id: 'i-036', name: "măng" },
      { id: 'i-037', name: "thiên lý" },
    ],
    meals: [
      { id: 'm-001', name: "Canh củ hầm thịt", ingredientIds: ['i-001', 'i-002', 'i-003', 'i-004'] },
      { id: 'm-002', name: "Trứng xào nấm đùi gà", ingredientIds: ['i-005', 'i-006'] },
      { id: 'm-003', name: "Xúc xích xào ớt chuông", ingredientIds: ['i-007', 'i-008'] },
      { id: 'm-004', name: "Thịt kho", ingredientIds: ['i-009', 'i-010'] },
      { id: 'm-005', name: "Cá kho khóm", ingredientIds: ['i-011', 'i-012', 'i-010'] },
      { id: 'm-006', name: "Thịt kho khóm", ingredientIds: ['i-009', 'i-012', 'i-010'] },
      { id: 'm-007', name: "Thịt bò hầm củ", ingredientIds: ['i-013', 'i-004', 'i-014', 'i-015'] },
      { id: 'm-008', name: "Trứng xào bí ngòi", ingredientIds: ['i-016', 'i-005'] },
      { id: 'm-009', name: "Thịt gà xào", ingredientIds: ['i-017', 'i-018'] },
      { id: 'm-010', name: "Gà chiên nước mắm", ingredientIds: ['i-017'] },
      { id: 'm-011', name: "Rau muống xào tỏi", ingredientIds: ['i-019', 'i-020'] },
      { id: 'm-012', name: "Trứng chiên cuộn", ingredientIds: ['i-021'] },
      { id: 'm-013', name: "Hải sản xào thập cẩm", ingredientIds: ['i-022', 'i-008', 'i-023', 'i-015'] },
      { id: 'm-014', name: "Tàu hủ sốt cà chua, trứng", ingredientIds: ['i-024', 'i-025', 'i-021'] },
      { id: 'm-015', name: "Lạp xưởng chiên", ingredientIds: ['i-026'] },
      { id: 'm-016', name: "Cá hồi chiên", ingredientIds: ['i-027'] },
      { id: 'm-017', name: "Thịt luộc", ingredientIds: ['i-009'] },
      { id: 'm-018', name: "Thịt xào su su cà rốt", ingredientIds: ['i-009', 'i-028', 'i-004'] },
      { id: 'm-019', name: "餃子", ingredientIds: ['i-029'] },
      { id: 'm-020', name: "Xúc xích xào bông cải xanh", ingredientIds: ['i-007', 'i-030'] },
      { id: 'm-021', name: "Cơm chiên viên châu", ingredientIds: ['i-031', 'i-026'] },
      { id: 'm-022', name: "Lạp xưởng chiên", ingredientIds: ['i-026'] },
      { id: 'm-023', name: "Canh cải thìa", ingredientIds: ['i-032'] },
      { id: 'm-024', name: "Thịt kho cải chua", ingredientIds: ['i-009', 'i-033'] },
      { id: 'm-025', name: "Gà kho nấm đông cô", ingredientIds: ['i-017', 'i-034'] },
      { id: 'm-026', name: "Chả rế chiên", ingredientIds: ['i-035'] },
      { id: 'm-027', name: "Thịt kho măng", ingredientIds: ['i-009', 'i-036'] },
      { id: 'm-028', name: "Bò xào thiên lý và hành tây", ingredientIds: ['i-013', 'i-037', 'i-015'] },
    ],
    products: [
      { id: 'p-001', name: "Lốc sữa", category: "Khác" },
      { id: 'p-002', name: "Vỉ trứng", category: "Khác" },
      { id: 'p-003', name: "Ngũ cốc", category: "Khác" },
      { id: 'p-004', name: "Khăn ướt", category: "Giấy và đồ dùng một lần" },
      { id: 'p-005', name: "Dorayaki", category: "Khác" },
      { id: 'p-006', name: "Ngũ vị hương", category: "Khác" },
      { id: 'p-007', name: "Băng vệ sinh", category: "Chăm sóc cá nhân" },
      { id: 'p-008', name: "Trà Atiso", category: "Khác" },
      { id: 'p-009', name: "Snack Lays", category: "Khác" },
      { id: 'p-010', name: "Bánh flan", category: "Khác" },
      { id: 'p-011', name: "Tăm bông", category: "Chăm sóc cá nhân" },
      { id: 'p-012', name: "午後の紅茶", category: "Khác" },
      { id: 'p-013', name: "Khoai", category: "Khác" },
      { id: 'p-014', name: "Tuyp sữa đặc", category: "Khác" },
      { id: 'p-015', name: "Dầu gội", category: "Chăm sóc cá nhân" },
      { id: 'p-016', name: "Son dưỡng", category: "Chăm sóc cá nhân" },
      { id: 'p-017', name: "Aquarius", category: "Khác" },
      { id: 'p-018', name: "Miếng rửa chén", category: "Vệ sinh nhà cửa" },
      { id: 'p-019', name: "Bánh bông lan Bon", category: "Khác" },
      { id: 'p-020', name: "Sữa rửa mặt", category: "Chăm sóc cá nhân" },
      { id: 'p-021', name: "Hành tím", category: "Khác" },
      { id: 'p-022', name: "Sữa hạnh nhân", category: "Khác" },
      { id: 'p-023', name: "Chả lụa", category: "Khác" },
      { id: 'p-024', name: "Sữa tắm", category: "Chăm sóc cá nhân" },
      { id: 'p-025', name: "Pop", category: "Khác" },
      { id: 'p-026', name: "Sữa Anchor nguyên kem", category: "Khác" },
      { id: 'p-027', name: "Tiêu", category: "Khác" },
      { id: 'p-028', name: "Bông phấn phủ", category: "Chăm sóc cá nhân" },
      { id: 'p-029', name: "Khẩu trang", category: "Chăm sóc cá nhân" },
      { id: 'p-030', name: "Kẹo ngậm", category: "Khác" },
      { id: 'p-031', name: "Coca Cola không Calo", category: "Khác" },
      { id: 'p-032', name: "Sáp thơm", category: "Vệ sinh nhà cửa" },
      { id: 'p-033', name: "Tương ớt xí muội", category: "Khác" },
      { id: 'p-034', name: "Giấy vệ sinh", category: "Giấy và đồ dùng một lần" },
      { id: 'p-035', name: "Sữa hạt Hàn Quốc", category: "Khác" },
      { id: 'p-036', name: "Sữa Oatside", category: "Khác" },
      { id: 'p-037', name: "Sữa mộc châu", category: "Khác" },
      { id: 'p-038', name: "Muối Hảo Hảo", category: "Khác" },
      { id: 'p-039', name: "Khăn giấy ướt nhỏ", category: "Giấy và đồ dùng một lần" },
      { id: 'p-040', name: "Tấm thớt", category: "Đồ dùng gia đình" },
      { id: 'p-041', name: "Dĩa trái cây", category: "Đồ dùng gia đình" },
      { id: 'p-042', name: "麦茶", category: "Khác" },
      { id: 'p-043', name: "Bông tẩy trang", category: "Chăm sóc cá nhân" },
      { id: 'p-044', name: "Trà lá", category: "Khác" },
      { id: 'p-045', name: "Xôi Gà Nấm Đông Cô", category: "Khác" },
      { id: 'p-046', name: "Dầu ăn", category: "Khác" },
      { id: 'p-047', name: "Lạp xưởng", category: "Khác" },
      { id: 'p-048', name: "Nước tương", category: "Khác" },
      { id: 'p-049', name: "Cà phê", category: "Khác" },
      { id: 'p-050', name: "Túi rác", category: "Vệ sinh nhà cửa" },
      { id: 'p-051', name: "Muối", category: "Khác" },
      { id: 'p-052', name: "Sữa whip cream", category: "Khác" },
      { id: 'p-053', name: "Bàn chải đánh răng", category: "Chăm sóc cá nhân" },
      { id: 'p-054', name: "Kem dưỡng ẩm", category: "Chăm sóc cá nhân" },
      { id: 'p-055', name: "Đường", category: "Khác" },
      { id: 'p-056', name: "Bánh Chocopie", category: "Khác" },
      { id: 'p-057', name: "Sữa TH", category: "Khác" },
      { id: 'p-058', name: "Yakurt", category: "Khác" },
      { id: 'p-059', name: "Sữa đặc", category: "Khác" },
      { id: 'p-060', name: "Snack", category: "Khác" },
      { id: 'p-061', name: "Tissue", category: "Giấy và đồ dùng một lần" },
      { id: 'p-062', name: "Hành lá", category: "Khác" },
      { id: 'p-063', name: "Nước mắm", category: "Khác" },
      { id: 'p-064', name: "Bánh bao", category: "Khác" },
      { id: 'p-065', name: "Sữa Đà Lạt Milk hộp nhỏ", category: "Khác" },
      { id: 'p-066', name: "Codex Test Nuoc rua chen 2026-05-30", category: "Vệ sinh nhà cửa" },
      { id: 'p-067', name: "Đũa gỗ", category: "Đồ dùng gia đình" },
      { id: 'p-068', name: "Chảo", category: "Đồ dùng gia đình" },
      { id: 'p-069', name: "Trà gừng", category: "Khác" },
      { id: 'p-070', name: "Bánh giò", category: "Khác" },
      { id: 'p-071', name: "Bánh bao than tre", category: "Khác" },
      { id: 'p-072', name: "Tỏi", category: "Khác" },
      { id: 'p-073', name: "Sữa đậu nành kikkoman", category: "Khác" },
      { id: 'p-074', name: "Sữa Vinamilk Flex", category: "Khác" },
      { id: 'p-075', name: "Kem đánh răng", category: "Chăm sóc cá nhân" },
      { id: 'p-076', name: "Màng bọc thực phẩm", category: "Đồ dùng gia đình" },
      { id: 'p-077', name: "Khử mùi tủ lạnh", category: "Vệ sinh nhà cửa" },
      { id: 'p-078', name: "Hạt nêm", category: "Khác" },
      { id: 'p-079', name: "Hạt điều", category: "Khác" },
      { id: 'p-080', name: "Kem dưỡng tay", category: "Chăm sóc cá nhân" },
      { id: 'p-081', name: "Tương cà", category: "Khác" },
      { id: 'p-082', name: "Trà hoa cúc", category: "Khác" },
      { id: 'p-083', name: "Sữa dưỡng thể", category: "Chăm sóc cá nhân" },
      { id: 'p-084', name: "Codex Test Khan giay 2026-05-30", category: "Giấy và đồ dùng một lần" },
      { id: 'p-085', name: "Miếng dán tường", category: "Đồ dùng gia đình" },
      { id: 'p-086', name: "Sữa chuối Kikkoman", category: "Khác" },
      { id: 'p-087', name: "Công chúa", category: "Khác" },
      { id: 'p-088', name: "Milo", category: "Khác" },
      { id: 'p-089', name: "Dừa", category: "Khác" },
      { id: 'p-090', name: "Bánh ngũ cốc", category: "Khác" },
      { id: 'p-091', name: "Bánh bí đỏ", category: "Khác" },
    ],
    plan: {
      'Thứ Hai': [], 'Thứ Ba': [], 'Thứ Tư': [], 'Thứ Năm': [],
      'Thứ Sáu': [], 'Thứ Bảy': [], 'Chủ Nhật': [],
    },
    planProductIds: [],
  };

  async load(): Promise<ShoppingData> {
    return structuredClone(this.data);
  }

  async save(data: ShoppingData): Promise<void> {
    this.data = structuredClone(data);
  }
}

export const mockRepository: ShoppingRepository = new InMemoryShoppingRepository();

export function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');
}

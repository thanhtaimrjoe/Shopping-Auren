export type Category =
  | 'Vệ sinh nhà cửa'
  | 'Giấy và đồ dùng một lần'
  | 'Chăm sóc cá nhân'
  | 'Đồ dùng gia đình'
  | 'Thực phẩm'
  | 'Đồ uống'
  | 'Khác';

export const categories: Category[] = [
  'Vệ sinh nhà cửa', 'Giấy và đồ dùng một lần', 'Chăm sóc cá nhân', 'Đồ dùng gia đình',
  'Thực phẩm', 'Đồ uống', 'Khác',
];

export const weekdays = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'] as const;
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
export type Snapshot = { id: string; from: string; to: string; createdAt: string; items: ChecklistItem[] };
export type ShoppingData = {
  ingredients: Ingredient[];
  meals: Meal[];
  products: Product[];
  plan: Plan;
  planProductIds: string[];
};

export interface ShoppingRepository {
  load(): Promise<ShoppingData>;
  save(data: ShoppingData): Promise<void>;
}

export function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');
}

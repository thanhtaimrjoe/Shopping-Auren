/** Section labels stored in shopping_items.category (not meals/products type). */

export const SHOPPING_GROUP_PRODUCTS = 'Mua thêm';
export const SHOPPING_GROUP_MANUAL = 'Khác';

const PINNED_TAIL = [SHOPPING_GROUP_PRODUCTS, SHOPPING_GROUP_MANUAL];

export function sortShoppingGroups(categories: string[]): string[] {
  const mealGroups = categories
    .filter((c) => !PINNED_TAIL.includes(c))
    .sort((a, b) => a.localeCompare(b, 'vi'));
  const tail = PINNED_TAIL.filter((c) => categories.includes(c));
  return [...mealGroups, ...tail];
}

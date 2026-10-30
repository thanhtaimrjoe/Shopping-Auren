import type { Category, ChecklistItem, ShoppingData, ShoppingRepository, Snapshot, Weekday } from '@/lib/shopping-types';
import { weekdays } from '@/lib/shopping-types';
import { getSupabaseBrowserClient } from './client';

const indexWeekday = new Map<number, Weekday>(weekdays.map((day, index) => [index + 1, day]));
const blankPlan = () => Object.fromEntries(weekdays.map((day) => [day, []])) as unknown as ShoppingData['plan'];

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

function unwrapOptional<T>(result: { data: T | null; error: { message: string } | null }): T | null {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export class SupabaseShoppingRepository implements ShoppingRepository {
  private pendingSave: Promise<void> = Promise.resolve();

  async load(): Promise<ShoppingData> {
    const supabase = getSupabaseBrowserClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) throw new Error('Vui lòng đăng nhập để tải dữ liệu.');
    const [ingredients, meals, links, products, plan, placements, planProducts] = await Promise.all([
      supabase.from('ingredients').select('id,name').order('created_at'),
      supabase.from('meals').select('id,name').order('created_at'),
      supabase.from('meal_ingredients').select('meal_id,ingredient_id,position').order('position'),
      supabase.from('products').select('id,name,category').order('created_at'),
      supabase.from('weekly_plans').select('id').maybeSingle(),
      supabase.from('weekly_plan_meals').select('meal_id,weekday,position').order('weekday').order('position'),
      supabase.from('weekly_plan_products').select('product_id'),
    ]);

    const ingredientRows = unwrap(ingredients);
    const mealRows = unwrap(meals);
    const linkRows = unwrap(links);
    const productRows = unwrap(products);
    const planRow = unwrapOptional(plan);
    const placementRows = unwrap(placements);
    const planProductRows = unwrap(planProducts);

    const mealIngredientIds = new Map<string, string[]>();
    for (const link of linkRows) {
      const ids = mealIngredientIds.get(link.meal_id) ?? [];
      ids.push(link.ingredient_id);
      mealIngredientIds.set(link.meal_id, ids);
    }

    const weeklyPlan = blankPlan();
    if (planRow) {
      for (const placement of placementRows) {
        const day = indexWeekday.get(placement.weekday);
        if (day) weeklyPlan[day].push(placement.meal_id);
      }
    }

    return {
      ingredients: ingredientRows,
      meals: mealRows.map((meal) => ({ ...meal, ingredientIds: mealIngredientIds.get(meal.id) ?? [] })),
      products: productRows.map((product) => ({ ...product, category: product.category as Category })),
      plan: weeklyPlan,
      planProductIds: planProductRows.map((row) => row.product_id),
    };
  }

  async loadShoppingRecords(): Promise<{ activeChecklist: ChecklistItem[] | null; snapshots: Snapshot[] }> {
    const supabase = getSupabaseBrowserClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) throw new Error('Vui lòng đăng nhập để tải dữ liệu.');
    const [activeResult, historyResult] = await Promise.all([
      supabase.from('active_checklists').select('id').maybeSingle(),
      supabase.from('shopping_history').select('id,date_from,date_to,created_at,items_snapshot').order('created_at', { ascending: false }),
    ]);
    const activeHeader = unwrapOptional(activeResult);
    const historyRows = unwrap(historyResult);
    let activeChecklist: ChecklistItem[] | null = null;
    if (activeHeader) {
      const itemRows = unwrap(await supabase.from('active_checklist_items').select('*').eq('checklist_id', activeHeader.id).order('position'));
      activeChecklist = itemRows.map((item) => ({
        id: item.id, name: item.name_snapshot, kind: item.kind,
        checked: item.checked, category: item.category_snapshot ?? undefined,
        placementId: item.placement_id ?? undefined, mealName: item.meal_name_snapshot ?? undefined,
        sourceId: item.source_ingredient_id ?? item.source_product_id ?? undefined,
      }));
    }
    return {
      activeChecklist,
      snapshots: historyRows.map((row) => ({
        id: row.id, from: row.date_from, to: row.date_to, createdAt: row.created_at,
        items: row.items_snapshot as ChecklistItem[],
      })),
    };
  }

  saveActiveChecklist(items: ChecklistItem[] | null): Promise<void> {
    this.pendingSave = this.pendingSave.catch(() => undefined).then(() => this.persistActiveChecklist(items));
    return this.pendingSave;
  }

  addHistory(snapshot: Snapshot): Promise<void> {
    this.pendingSave = this.pendingSave.catch(() => undefined).then(async () => {
      const { userId } = await this.requireUser();
      unwrap(await getSupabaseBrowserClient().from('shopping_history').insert({
        id: snapshot.id, user_id: userId, date_from: snapshot.from, date_to: snapshot.to,
        created_at: snapshot.createdAt, items_snapshot: snapshot.items,
      }));
    });
    return this.pendingSave;
  }

  deleteHistory(id: string): Promise<void> {
    this.pendingSave = this.pendingSave.catch(() => undefined).then(async () => {
      const { userId } = await this.requireUser();
      unwrap(await getSupabaseBrowserClient().from('shopping_history').delete().eq('user_id', userId).eq('id', id));
    });
    return this.pendingSave;
  }

  save(data: ShoppingData): Promise<void> {
    this.pendingSave = this.pendingSave.catch(() => undefined).then(() => this.persist(data));
    return this.pendingSave;
  }

  private async persist(data: ShoppingData) {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.rpc('save_shopping_data', { p_data: data });
    if (error) throw new Error(error.message);
  }

  private async persistActiveChecklist(items: ChecklistItem[] | null) {
    const { error } = await getSupabaseBrowserClient().rpc('save_active_checklist', { p_items: items });
    if (error) throw new Error(error.message);
  }

  private async requireUser() {
    const { data, error } = await getSupabaseBrowserClient().auth.getUser();
    if (error) throw error;
    if (!data.user) throw new Error('Phiên đăng nhập đã hết hạn.');
    return { userId: data.user.id };
  }
}

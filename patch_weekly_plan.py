# -*- coding: utf-8 -*-
import sys

file_path = "frontend/src/app/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add extra imports and state variables
old_imports = "import { mealsApi, mealPlansApi } from '@/lib/api';"
new_imports = "import { mealsApi, mealPlansApi, productsApi, shoppingListsApi } from '@/lib/api';"
if old_imports in content:
    content = content.replace(old_imports, new_imports)
    print("Replaced imports")

old_state = """  const [mealDatabase, setMealDatabase] = useState<Meal[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);"""
new_state = """  const [mealDatabase, setMealDatabase] = useState<Meal[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  
  // Extra products state
  const [productsDatabase, setProductsDatabase] = useState<any[]>([]);
  const [extraProducts, setExtraProducts] = useState<any[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(false);"""
if old_state in content:
    content = content.replace(old_state, new_state)
    print("Replaced state")

# 2. Add function to fetch products and shopping list
old_fetch_meals = """  // Fetch meals for the modal
  const fetchMeals = useCallback(async () => {"""
new_fetch_meals = """  const fetchProductsAndShoppingList = useCallback(async () => {
    if (!user) return;
    try {
      const prodResp = await productsApi.getAll();
      if (prodResp.data.success) {
        setProductsDatabase(prodResp.data.data.products);
      }
      const listResp = await shoppingListsApi.getCurrent();
      if (listResp.data.success) {
        // Filter out items that are products
        const items = listResp.data.data.shopping_list.items;
        const products = items.filter((item: any) => item.source_type === 'product' || item.source_type === 'manual');
        setExtraProducts(products);
      }
    } catch (error: any) {
      console.error('Failed to fetch products or shopping list', error);
    }
  }, [user]);

  // Fetch meals for the modal
  const fetchMeals = useCallback(async () => {"""
if old_fetch_meals in content:
    content = content.replace(old_fetch_meals, new_fetch_meals)
    print("Replaced fetch_meals")

# 3. Add to useEffect
old_use_effect = """  useEffect(() => {
    if (!authLoading && user) {
      fetchMeals();
      fetchMealPlan();
    }
  }, [fetchMeals, fetchMealPlan, authLoading, user]);"""
new_use_effect = """  useEffect(() => {
    if (!authLoading && user) {
      fetchMeals();
      fetchMealPlan();
      fetchProductsAndShoppingList();
    }
  }, [fetchMeals, fetchMealPlan, fetchProductsAndShoppingList, authLoading, user]);"""
if old_use_effect in content:
    content = content.replace(old_use_effect, new_use_effect)
    print("Replaced useEffect")

# 4. Add product handling logic
old_handle_select = """  const handleSelectMeal = async (mealName: string) => {"""
new_handle_select = """  const handleAddProduct = async (product: any) => {
    if (!currentPlanId) {
      alert("Vui lòng thêm ít nhất 1 món ăn vào lịch trước khi thêm sản phẩm mua thêm!");
      return;
    }
    setIsProductsLoading(true);
    try {
      // Add product to existing shopping list or generate a new one
      try {
        const listResp = await shoppingListsApi.getCurrent();
        if (listResp.data.success) {
          const listId = listResp.data.data.shopping_list.id;
          await shoppingListsApi.addItem(listId, {
            name: product.name,
            category: product.category
          });
          fetchProductsAndShoppingList();
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          // generate
          const genResp = await shoppingListsApi.generate({ 
            meal_plan_id: currentPlanId,
            product_ids: [product.id]
          });
          if (genResp.data.success) {
            fetchProductsAndShoppingList();
          }
        }
      }
    } catch (error) {
      console.error('Failed to add product to shopping list:', error);
    } finally {
      setIsProductsLoading(false);
    }
  };

  const handleRemoveProduct = async (itemId: string) => {
    try {
      const listResp = await shoppingListsApi.getCurrent();
      if (listResp.data.success) {
        const listId = listResp.data.data.shopping_list.id;
        await shoppingListsApi.deleteItem(listId, itemId);
        setExtraProducts(prev => prev.filter(p => p.id !== itemId));
      }
    } catch (error) {
      console.error('Failed to remove product:', error);
    }
  };

  const handleSelectMeal = async (mealName: string) => {"""
if old_handle_select in content:
    content = content.replace(old_handle_select, new_handle_select)
    print("Replaced handleSelectMeal")

# 5. Add UI section at the end before modal
old_ui_end = """      {/* Modal */}
      {isModalOpen && ("""
new_ui_end = """      {/* Extra Products Section */}
      <div className="mt-16 bg-cream rounded-[2.5rem] p-8 shadow-soft">
        <h3 className="text-xs font-bold text-bark uppercase tracking-[0.3em] mb-8">Mua thêm (Products)</h3>
        
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Selected Products */}
          <div className="flex-1">
            <h4 className="text-sm font-medium text-bark/60 mb-4">Đã chọn ({extraProducts.length})</h4>
            {extraProducts.length > 0 ? (
              <div className="space-y-3">
                {extraProducts.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-cream/50 p-4 rounded-2xl border border-hemp/20">
                    <span className="font-medium text-bark">{p.name}</span>
                    <button 
                      onClick={() => handleRemoveProduct(p.id)}
                      className="p-2 hover:bg-red-50 text-red-500 rounded-full transition-all"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-cream/30 rounded-2xl border border-hemp/20 border-dashed">
                <p className="text-bark/40 text-sm italic">Chưa có sản phẩm mua thêm.</p>
              </div>
            )}
          </div>
          
          {/* Product Library */}
          <div className="flex-1 border-t lg:border-t-0 lg:border-l border-hemp/20 pt-8 lg:pt-0 lg:pl-12">
            <h4 className="text-sm font-medium text-bark/60 mb-4">Thư viện sản phẩm</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {productsDatabase.map((p, idx) => {
                const isSelected = extraProducts.some(ep => ep.name.toLowerCase() === p.name.toLowerCase());
                return (
                  <button
                    key={idx}
                    onClick={() => !isSelected && handleAddProduct(p)}
                    disabled={isSelected || isProductsLoading}
                    className={`p-3 rounded-2xl text-left transition-all ${
                      isSelected 
                        ? 'bg-sage/20 text-sage-deep opacity-60' 
                        : 'bg-cream hover:bg-sage/10 text-bark shadow-sm hover:shadow active:scale-95'
                    }`}
                  >
                    <span className="block text-sm font-medium truncate">{p.name}</span>
                    <span className="block text-[10px] text-bark/40 mt-1 uppercase tracking-wider truncate">{p.category}</span>
                  </button>
                );
              })}
            </div>
            {productsDatabase.length === 0 && (
              <p className="text-bark/40 text-sm italic">Không có sản phẩm nào trong thư viện.</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && ("""

if old_ui_end in content:
    content = content.replace(old_ui_end, new_ui_end)
    print("Replaced UI end")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patched weekly plan")

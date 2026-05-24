'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, X, Search, Loader2, CheckCircle2, ShoppingBag } from 'lucide-react';
import { mealsApi, mealPlansApi, productsApi, shoppingListsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';

interface Meal {
  id: string;
  name: string;
  ingredients?: string[] | string;
}

interface MealPlanItem {
  day_of_week?: number | string;
  meal?: {
    id?: string;
    name?: string;
    ingredients?: string[] | string;
  };
  name?: string;
}

interface MealPlanResponse {
  id?: string;
  meals?: MealPlanItem[];
}

const DAY_LABELS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

const DAY_INDICES = [0, 1, 2, 3, 4, 5, 6] as const;

export default function MealPlanPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [selectedMeals, setSelectedMeals] = useState<Record<number, string[]>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDayIndex, setActiveDayIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mealDatabase, setMealDatabase] = useState<Meal[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  
  // Extra products state
  const [productsDatabase, setProductsDatabase] = useState<any[]>([]);
  const [extraProducts, setExtraProducts] = useState<any[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [pendingProductIds, setPendingProductIds] = useState<Set<string>>(new Set());
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Notification helper
  const showNotification = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchProductsAndShoppingList = useCallback(async () => {
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
  const fetchMeals = useCallback(async () => {
    if (!user) return;
    setFetchLoading(true);
    try {
      const response = await mealsApi.getAll();
      if (response.data.success) {
        setMealDatabase(response.data.data.meals);
      }
    } catch (error: any) {
      if (error.message !== 'Network Error') {
        console.error('Failed to fetch meals:', error);
      }
    } finally {
      setFetchLoading(false);
    }
  }, [user]);

  // Fetch current meal plan
  const fetchMealPlan = useCallback(async () => {
    if (!user) return;
    try {
      const response = await mealPlansApi.getCurrent();
      if (response.data.success) {
        const plan = (response.data.data.meal_plan || {}) as MealPlanResponse;
        setCurrentPlanId(plan.id || null);
        const transformed: Record<number, string[]> = {};
        if (Array.isArray(plan.meals)) {
          plan.meals.forEach((item: MealPlanItem) => {
            const dayIndex = Number(item.day_of_week);
            const mealName = item.meal?.name || item.name;
            if (!Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex > 6 || !mealName) return;
            transformed[dayIndex] = [...(transformed[dayIndex] || []), mealName];
          });
        }
        setSelectedMeals(transformed);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setCurrentPlanId(null);
        setSelectedMeals({});
        return;
      }
      if (error.message !== 'Network Error') {
        console.error('Failed to fetch meal plan:', error);
      }
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchMeals();
      fetchMealPlan();
      fetchProductsAndShoppingList();
    }
  }, [fetchMeals, fetchMealPlan, fetchProductsAndShoppingList, authLoading, user]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsModalOpen(false);
    }
    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      searchInputRef.current?.focus();
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const openModal = (dayIndex: number) => {
    setActiveDayIndex(dayIndex);
    setIsModalOpen(true);
    setSearchQuery('');
    if (mealDatabase.length === 0 && !fetchLoading) {
      fetchMeals();
    }
  };

  const buildMealPlanPayload = (mealsByDay: Record<number, string[]>) => {
    const meals = Object.entries(mealsByDay).flatMap(([dayKey, mealNames]) => {
      const dayIndex = Number(dayKey);
      if (!Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex > 6) return [];

      return mealNames.flatMap((mealName) => {
        const meal = mealDatabase.find((entry) => entry.name === mealName);
        if (!meal) return [];

        return [{
          day_of_week: dayIndex,
          meal_id: meal.id,
        }];
      });
    });

    return { meals };
  };

  const persistMealPlan = async (nextSelectedMeals: Record<number, string[]>) => {
    const payload = buildMealPlanPayload(nextSelectedMeals);

    if (currentPlanId) {
      await mealPlansApi.update(currentPlanId, { meals: payload.meals });
      return;
    }

    const response = await mealPlansApi.save(payload);
    if (response.data?.success) {
      setCurrentPlanId(response.data.data.meal_plan?.id || null);
    }
  };

  const openProductModal = () => {
    const selectedIds = new Set(
      productsDatabase
        .filter((p) =>
          extraProducts.some((ep) => ep.name.toLowerCase() === p.name.toLowerCase())
        )
        .map((p) => p.id as string)
    );
    setPendingProductIds(selectedIds);
    setIsProductModalOpen(true);
  };

  const togglePendingProduct = (productId: string) => {
    setPendingProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleProductModalDone = async () => {
    if (!currentPlanId) {
      alert('Vui lòng thêm ít nhất 1 món ăn vào lịch trước khi thêm sản phẩm mua thêm!');
      return;
    }

    setIsProductsLoading(true);
    try {
      const productIds = Array.from(pendingProductIds);
      await shoppingListsApi.generate({
        meal_plan_id: currentPlanId,
        product_ids: productIds,
      });
      await fetchProductsAndShoppingList();
      setIsProductModalOpen(false);
      showNotification('success', 'Đã cập nhật sản phẩm mua thêm');
    } catch (error) {
      console.error('Failed to sync extra products:', error);
      showNotification('error', 'Không thể cập nhật sản phẩm mua thêm');
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

  const handleToggleMeal = async (mealName: string) => {
    if (activeDayIndex === null || !user) return;
    
    setIsLoading(true);
    try {
      const currentMeals = selectedMeals[activeDayIndex] || [];
      let updatedMeals;
      
      if (currentMeals.includes(mealName)) {
        // Remove meal
        updatedMeals = currentMeals.filter(m => m !== mealName);
      } else {
        // Add meal (limit 3)
        if (currentMeals.length >= 3) {
          alert("Mỗi ngày chỉ tối đa 3 món ăn.");
          return;
        }
        updatedMeals = [...currentMeals, mealName];
      }

      const nextSelectedMeals = {
        ...selectedMeals,
        [activeDayIndex]: updatedMeals,
      };
      
      // Save to backend
      await persistMealPlan(nextSelectedMeals);
      setSelectedMeals(nextSelectedMeals);
      showNotification('success', currentMeals.includes(mealName) ? 'Đã xóa món ăn' : 'Đã thêm món ăn');
    } catch (error: any) {
      console.error('Failed to toggle meal:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Lỗi không xác định';
      showNotification('error', `Không thể cập nhật món ăn: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const removeMeal = async (dayIndex: number, mealIndex: number) => {
    if (!user) return;
    const currentMeals = selectedMeals[dayIndex] || [];
    const updatedMeals = currentMeals.filter((_, i) => i !== mealIndex);
    const nextSelectedMeals = {
      ...selectedMeals,
      [dayIndex]: updatedMeals,
    };
    
    try {
      await persistMealPlan(nextSelectedMeals);

      setSelectedMeals(nextSelectedMeals);
      showNotification('success', 'Đã xóa món ăn');
    } catch (error: any) {
      console.error('Failed to update meal plan:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Lỗi không xác định';
      showNotification('error', `Không thể xóa món ăn: ${errorMsg}`);
    }
  };

  const filteredMeals = mealDatabase.filter(meal => 
    meal.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sage" />
      </div>
    );
  }

  return (
    <div className="page-shell pb-4 sm:pb-12 animate-page-enter min-w-0">
      {/* Notifications */}
      {notification && (
        <div className={cn(
          "fixed top-[calc(3.5rem+env(safe-area-inset-top))] left-3 right-3 sm:left-auto sm:right-6 sm:top-8 z-[100] flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4 rounded-2xl shadow-warm animate-scale-in max-w-md sm:ml-auto",
          notification.type === 'success'
            ? 'bg-sage text-cream'
            : notification.type === 'info'
              ? 'bg-bark text-cream'
              : 'bg-red-500 text-cream'
        )}>
          {notification.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <X className="h-5 w-5" />}
          <span className="font-bold text-xs uppercase tracking-widest">{notification.message}</span>
        </div>
      )}

      <header className="mb-6 sm:mb-10">
        <h1 className="page-title text-2xl sm:text-4xl md:text-5xl text-bark font-serif mb-3 sm:mb-6 leading-tight">
          Meal plan
        </h1>
      </header>

      <div className="flex flex-col gap-4 mb-6 sm:mb-8">
        <div className="w-full sm:w-auto">
          <button
            onClick={async () => {
              if (!currentPlanId) return;
              setIsLoading(true);
              try {
                // Get product IDs from products that are already in the shopping list
                const productIds = productsDatabase
                  .filter(p => extraProducts.some(ep => ep.name.toLowerCase() === p.name.toLowerCase()))
                  .map(p => p.id);
                
                const resp = await shoppingListsApi.generate({ 
                  meal_plan_id: currentPlanId,
                  product_ids: productIds
                });
                if (resp.data.success) {
                  showNotification('success', 'Đã tạo danh sách mua sắm mới');
                  fetchProductsAndShoppingList();
                }
              } catch (error) {
                console.error('Failed to generate shopping list:', error);
                showNotification('error', 'Không thể tạo danh sách mua sắm');
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={!currentPlanId || isLoading}
            className="w-full sm:w-auto justify-center px-4 py-3 bg-bark text-cream rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-soft hover:bg-bark/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 touch-manipulation min-h-[44px]"
          >
            <ShoppingBag className="h-4 w-4 shrink-0" />
            <span className="truncate">Generate shopping list</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
        {DAY_INDICES.map((dayIndex) => {
          const dayMeals = selectedMeals[dayIndex] || [];

          return (
            <div
              key={dayIndex}
              className="group bg-cream rounded-[1.75rem] sm:rounded-[2.5rem] p-5 sm:p-8 transition-all duration-300 flex flex-col h-full min-w-0 shadow-soft"
            >
              <div className="mb-6">
                <h4 className="text-base font-bold uppercase tracking-[0.2em] text-bark">
                  {DAY_LABELS[dayIndex]}
                </h4>
              </div>

              {/* Selected Meals List */}
              <div className="flex-1 space-y-3 mb-4">
                {dayMeals.length > 0 ? (
                  dayMeals.map((mealName, mIdx) => {
                    const mealDetails = mealDatabase.find(m => m.name === mealName);
                    
                    // Robust parsing of ingredients
                    let ingredients: string[] = [];
                    const rawIngredients = mealDetails?.ingredients;
                    
                    if (rawIngredients) {
                      if (Array.isArray(rawIngredients)) {
                        ingredients = rawIngredients;
                      } else if (typeof rawIngredients === 'string') {
                        try {
                          // Try parsing as JSON first
                          const parsed = JSON.parse(rawIngredients);
                          ingredients = Array.isArray(parsed) ? parsed : [parsed];
                        } catch (e) {
                          // If not JSON, split by newline as fallback
                          ingredients = rawIngredients.split('\n').map(i => i.trim()).filter(i => i !== '');
                        }
                      }
                    }

                    return (
                      <div key={mIdx} className="group/meal flex flex-col bg-hemp/10 rounded-xl p-3 border border-bark/5 hover:bg-hemp/20 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-bark font-bold">{mealName}</span>
                          <button 
                            onClick={() => removeMeal(dayIndex, mIdx)}
                            className="sm:opacity-0 sm:group-hover/meal:opacity-100 p-2 -mr-1 hover:bg-bark/10 rounded-full transition-all touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center"
                          >
                            <X className="h-3 w-3 text-bark/40" />
                          </button>
                        </div>
                        {ingredients.length > 0 && (
                          <ul className="mt-2 space-y-0.5">
                            {ingredients.map((ing: string, iIdx: number) => (
                              <li key={iIdx} className="text-[10px] text-bark/50 flex items-center gap-1.5">
                                <span className="w-1 h-1 bg-bark/20 rounded-full flex-shrink-0" />
                                {ing}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="h-24 flex items-center justify-center border-2 border-dashed border-bark/5 rounded-2xl">
                    <p className="text-xs text-bark/20 italic">No meals selected</p>
                  </div>
                )}
              </div>

              {/* Add Button */}
              <button 
                onClick={() => openModal(dayIndex)}
                className="w-full py-3 px-4 bg-sage text-cream rounded-xl flex items-center justify-center gap-2 hover:bg-sage-deep shadow-soft transition-all font-bold text-xs uppercase tracking-widest"
              >
                <Plus className="h-4 w-4" />
                Thêm món
              </button>
              
              <div className="mt-6 pt-4 border-t border-bark/5">
                <p className="text-[10px] text-bark/40 italic leading-relaxed">
                  "Let food be thy medicine and medicine be thy food."
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Extra Products Section */}
      <div className="mt-8 sm:mt-10 bg-cream rounded-[1.75rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-soft">
        <div className="flex flex-col xs:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <h3 className="text-xs font-bold text-bark uppercase tracking-[0.3em]">Mua thêm (Products)</h3>
          <button 
            onClick={openProductModal}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-sage text-cream rounded-xl text-xs font-bold uppercase tracking-widest shadow-soft hover:bg-sage-deep transition-all touch-manipulation min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            Thêm sản phẩm
          </button>
        </div>
        
        <div>
          {extraProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {extraProducts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between bg-cream/50 p-5 rounded-2xl border border-hemp/20 shadow-sm">
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
            <div className="p-12 text-center bg-cream/30 rounded-2xl border border-hemp/20 border-dashed">
              <p className="text-bark/40 text-sm italic">Chưa có sản phẩm mua thêm.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Popup */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <button type="button" className="absolute inset-0 bg-bark/30 backdrop-blur-sm" aria-label="Close" onClick={() => setIsModalOpen(false)} />
          <div 
            ref={modalRef}
            className="relative bg-cream rounded-t-[2rem] sm:rounded-[2.5rem] w-full max-w-lg shadow-warm animate-scale-in overflow-hidden max-h-[min(90dvh,640px)] flex flex-col pb-[env(safe-area-inset-bottom)]"
          >
            <div className="p-5 sm:p-8 border-b border-bark/5 shrink-0">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-xs font-bold text-bark uppercase tracking-[0.2em] sm:tracking-[0.3em]">Chọn món ăn</h3>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 w-10 flex items-center justify-center hover:bg-hemp/50 rounded-full transition-all touch-manipulation"
                >
                  <X className="h-5 w-5 text-bark/40" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-bark/20" />
                <input 
                  ref={searchInputRef}
                  type="text" 
                  placeholder="Tìm kiếm món ăn..."
                  className="w-full bg-hemp/10 border-0 rounded-2xl py-3.5 sm:py-4 pl-12 pr-4 text-bark placeholder:text-bark/20 focus:ring-2 focus:ring-sage/20 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-2 custom-scrollbar">
              {fetchLoading ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-sage" />
                </div>
              ) : filteredMeals.length > 0 ? (
                filteredMeals.map((meal, i) => (
                  <button
                    key={i}
                    onClick={() => handleToggleMeal(meal.name)}
                    disabled={isLoading}
                    className={cn(
                        "w-full text-left px-6 py-4 rounded-2xl transition-all font-medium flex items-center justify-between group",
                        activeDayIndex !== null && selectedMeals[activeDayIndex]?.includes(meal.name)
                          ? "bg-sage text-cream shadow-sm"
                          : "hover:bg-sage/10 hover:text-sage-deep text-bark"
                      )}
                    >
                      {meal.name}
                      {activeDayIndex !== null && selectedMeals[activeDayIndex]?.includes(meal.name) ? (
                        <CheckCircle2 className="h-5 w-5 text-cream" />
                      ) : (
                        <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
                      )}
                    </button>
                ))
              ) : (
                <div className="py-12 text-center text-bark/40 italic">
                  Không tìm thấy món ăn nào trong thư viện
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Modal Popup */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <button type="button" className="absolute inset-0 bg-bark/30 backdrop-blur-sm" aria-label="Close" onClick={() => setIsProductModalOpen(false)} />
          <div 
            className="relative bg-cream rounded-t-[2rem] sm:rounded-[2.5rem] w-full max-w-4xl shadow-warm animate-scale-in overflow-hidden flex flex-col max-h-[min(92dvh,720px)] pb-[env(safe-area-inset-bottom)]"
          >
            <div className="p-4 sm:p-6 border-b border-bark/5 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-bark uppercase tracking-[0.3em]">Thư viện sản phẩm</h3>
                <button 
                  onClick={() => setIsProductModalOpen(false)}
                  className="p-2 hover:bg-hemp/50 rounded-full transition-all"
                >
                  <X className="h-5 w-5 text-bark/40" />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto p-4 md:p-6 custom-scrollbar">
              {productsDatabase.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                  {productsDatabase.map((p, idx) => {
                    const isSelected = pendingProductIds.has(p.id);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => togglePendingProduct(p.id)}
                        className={`p-2 sm:p-3 rounded-2xl text-left transition-all relative overflow-hidden flex flex-col justify-between min-h-[120px] sm:min-h-[150px] touch-manipulation ${
                          isSelected 
                            ? 'bg-sage text-cream shadow-md scale-100 opacity-90' 
                            : 'bg-cream hover:bg-sage/10 text-bark border border-hemp/20 shadow-sm hover:shadow hover:scale-[1.02] active:scale-95'
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center text-center h-full w-full">
                            {p.image_url ? (
                              <img src={p.image_url} alt={p.name} className="w-24 h-24 object-contain mb-2" />
                            ) : (
                              <div className="w-24 h-24 bg-hemp/20 rounded-full mb-2 flex items-center justify-center">
                                <ShoppingBag className="h-10 w-10 text-bark/20" />
                              </div>
                            )}
                            <span className="block font-medium leading-tight text-base">{p.name}</span>
                          </div>
                        {isSelected && (
                          <div className="absolute top-3 right-3 text-cream">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <p className="text-bark/40 text-lg italic">Không có sản phẩm nào trong thư viện.</p>
                </div>
              )}
            </div>

            <div className="p-4 md:p-6 border-t border-bark/5 flex justify-end flex-shrink-0 bg-cream">
              <button 
                type="button"
                onClick={handleProductModalDone}
                disabled={isProductsLoading}
                className="px-8 py-3 bg-bark text-cream rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-bark/90 transition-all shadow-soft disabled:opacity-50 flex items-center gap-2"
              >
                {isProductsLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Xong
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, X, Search, Loader2, CheckCircle2, ShoppingBag } from 'lucide-react';
import { mealsApi, mealPlansApi, productsApi, shoppingListsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import { SHOPPING_GROUP_MANUAL, SHOPPING_GROUP_PRODUCTS } from '@/lib/shopping-groups';

interface Meal {
  id: string;
  name: string;
  ingredients?: string[] | string;
}

interface Product {
  id: string;
  name: string;
  image_url?: string | null;
}

interface ExtraProductItem {
  id: string;
  name: string;
  category?: string;
  source_type?: 'product' | 'manual' | string;
  source_id?: string | null;
  note?: string | null;
}

interface DraftShoppingItem {
  draft_id: string;
  name: string;
  category: string;
  source_type: 'meal' | 'product' | 'manual';
  source_id: string | null;
  note: string | null;
  included: boolean;
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

function parseIngredients(rawIngredients?: string[] | string): string[] {
  if (!rawIngredients) return [];
  if (Array.isArray(rawIngredients)) {
    return rawIngredients.map((item) => String(item).trim()).filter(Boolean);
  }

  try {
    const parsed = JSON.parse(rawIngredients);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
    return [String(parsed).trim()].filter(Boolean);
  } catch {
    return rawIngredients.split('\n').map((item) => item.trim()).filter(Boolean);
  }
}

function createDraftId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

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
  const [productsDatabase, setProductsDatabase] = useState<Product[]>([]);
  const [extraProducts, setExtraProducts] = useState<ExtraProductItem[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productLibrarySearch, setProductLibrarySearch] = useState('');
  const [pendingProductIds, setPendingProductIds] = useState<Set<string>>(new Set());
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [draftItems, setDraftItems] = useState<DraftShoppingItem[]>([]);
  const [draftMealSearch, setDraftMealSearch] = useState('');
  const [draftProductSearch, setDraftProductSearch] = useState('');
  const [isDraftSubmitting, setIsDraftSubmitting] = useState(false);
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

  const applyMealPlanResponse = useCallback((response: { data: { success?: boolean; data?: { meal_plan?: MealPlanResponse } } }) => {
    if (!response.data.success) return;
    const plan = (response.data.data?.meal_plan || {}) as MealPlanResponse;
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
  }, []);

  const fetchProductsAndShoppingList = useCallback(async () => {
    if (!user) return;
    try {
      const [prodResp, listResp] = await Promise.all([
        productsApi.getAll(),
        shoppingListsApi.getCurrent(),
      ]);
      if (prodResp.data.success) {
        setProductsDatabase(prodResp.data.data.products);
      }
      if (listResp.data.success) {
        const items = listResp.data.data.shopping_list.items;
        const products = items.filter(
          (item: { source_type?: string }) =>
            item.source_type === 'product' || item.source_type === 'manual'
        );
        setExtraProducts(products);
      }
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 404) {
        try {
          const prodResp = await productsApi.getAll();
          if (prodResp.data.success) {
            setProductsDatabase(prodResp.data.data.products);
          }
          setExtraProducts([]);
        } catch (inner) {
          console.error('Failed to fetch products after empty shopping list', inner);
        }
        return;
      }
      console.error('Failed to fetch products or shopping list', error);
    }
  }, [user]);

  const fetchMeals = useCallback(async () => {
    if (!user) return;
    setFetchLoading(true);
    try {
      const response = await mealsApi.getAll();
      if (response.data.success) {
        setMealDatabase(response.data.data.meals);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (err.message !== 'Network Error') {
        console.error('Failed to fetch meals:', error);
      }
    } finally {
      setFetchLoading(false);
    }
  }, [user]);

  const loadInitialData = useCallback(async () => {
    if (!user) return;
    setFetchLoading(true);

    const [mealsResult, planResult, productsResult, listResult] = await Promise.allSettled([
      mealsApi.getAll(),
      mealPlansApi.getCurrent(),
      productsApi.getAll(),
      shoppingListsApi.getCurrent(),
    ]);

    if (mealsResult.status === 'fulfilled' && mealsResult.value.data.success) {
      setMealDatabase(mealsResult.value.data.data.meals);
    } else if (mealsResult.status === 'rejected') {
      const err = mealsResult.reason as { message?: string };
      if (err.message !== 'Network Error') {
        console.error('Failed to fetch meals:', mealsResult.reason);
      }
    }

    if (planResult.status === 'fulfilled') {
      applyMealPlanResponse(planResult.value);
    } else {
      const err = planResult.reason as { response?: { status?: number }; message?: string };
      if (err.response?.status === 404) {
        setCurrentPlanId(null);
        setSelectedMeals({});
      } else if (err.message !== 'Network Error') {
        console.error('Failed to fetch meal plan:', planResult.reason);
      }
    }

    if (productsResult.status === 'fulfilled' && productsResult.value.data.success) {
      setProductsDatabase(productsResult.value.data.data.products);
    } else if (productsResult.status === 'rejected') {
      console.error('Failed to fetch products:', productsResult.reason);
    }

    if (listResult.status === 'fulfilled' && listResult.value.data.success) {
      const items = listResult.value.data.data.shopping_list.items;
      setExtraProducts(
        items.filter(
          (item: { source_type?: string }) =>
            item.source_type === 'product' || item.source_type === 'manual'
        )
      );
    } else if (listResult.status === 'rejected') {
      const err = listResult.reason as { response?: { status?: number } };
      if (err.response?.status !== 404) {
        console.error('Failed to fetch shopping list:', listResult.reason);
      } else {
        setExtraProducts([]);
      }
    }

    setFetchLoading(false);
  }, [user, applyMealPlanResponse]);

  useEffect(() => {
    if (!authLoading && user) {
      let cancelled = false;
      queueMicrotask(() => {
        if (!cancelled) void loadInitialData();
      });
      return () => {
        cancelled = true;
      };
    }
  }, [loadInitialData, authLoading, user]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setIsModalOpen(false);
      setIsDraftModalOpen(false);
    }
    if (isModalOpen || isDraftModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      if (isModalOpen) searchInputRef.current?.focus();
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isDraftModalOpen]);

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

  const findMealByName = useCallback(
    (mealName: string) => mealDatabase.find((entry) => entry.name === mealName),
    [mealDatabase]
  );

  const buildDraftItems = useCallback((): DraftShoppingItem[] => {
    const mealItems = Object.entries(selectedMeals).flatMap(([dayKey, mealNames]) =>
      mealNames.flatMap((mealName, mealIndex) => {
        const meal = findMealByName(mealName);
        if (!meal) return [];

        return parseIngredients(meal.ingredients).map((ingredient, ingredientIndex) => ({
          draft_id: createDraftId(`meal-${dayKey}-${mealIndex}-${ingredientIndex}`),
          name: ingredient,
          category: meal.name,
          source_type: 'meal' as const,
          source_id: meal.id,
          note: `Dùng cho món ${meal.name}`,
          included: true,
        }));
      })
    );

    const productItems = extraProducts.map((item, index) => {
      const matchedProduct = productsDatabase.find(
        (product) => product.name.toLowerCase() === item.name.toLowerCase()
      );
      const sourceType: DraftShoppingItem['source_type'] =
        item.source_type === 'manual' ? 'manual' : 'product';

      return {
        draft_id: createDraftId(`extra-${index}`),
        name: item.name,
        category: sourceType === 'product' ? SHOPPING_GROUP_PRODUCTS : item.category || SHOPPING_GROUP_MANUAL,
        source_type: sourceType,
        source_id: sourceType === 'product' ? item.source_id || matchedProduct?.id || null : null,
        note: item.note ?? (sourceType === 'product' ? 'Mua thêm' : null),
        included: true,
      };
    });

    return [...mealItems, ...productItems];
  }, [extraProducts, findMealByName, productsDatabase, selectedMeals]);

  const openDraftModal = () => {
    if (!currentPlanId) return;
    setDraftItems(buildDraftItems());
    setDraftMealSearch('');
    setDraftProductSearch('');
    setIsDraftModalOpen(true);
  };

  const updateDraftItem = (draftId: string, patch: Partial<DraftShoppingItem>) => {
    setDraftItems((items) =>
      items.map((item) => (item.draft_id === draftId ? { ...item, ...patch } : item))
    );
  };

  const removeDraftItem = (draftId: string) => {
    setDraftItems((items) => items.filter((item) => item.draft_id !== draftId));
  };

  const addMealToDraft = (meal: Meal) => {
    const ingredients = parseIngredients(meal.ingredients);
    if (ingredients.length === 0) {
      showNotification('info', 'Món này chưa có nguyên liệu');
      return;
    }

    setDraftItems((items) => [
      ...items,
      ...ingredients.map((ingredient, index) => ({
        draft_id: createDraftId(`draft-meal-${meal.id}-${index}`),
        name: ingredient,
        category: meal.name,
        source_type: 'meal' as const,
        source_id: meal.id,
        note: `Dùng cho món ${meal.name}`,
        included: true,
      })),
    ]);
    showNotification('success', `Đã thêm ${meal.name} vào draft`);
  };

  const addProductToDraft = (product: Product) => {
    setDraftItems((items) => [
      ...items,
      {
        draft_id: createDraftId(`draft-product-${product.id}`),
        name: product.name,
        category: SHOPPING_GROUP_PRODUCTS,
        source_type: 'product',
        source_id: product.id,
        note: 'Mua thêm',
        included: true,
      },
    ]);
  };

  const handleCreateChecklistFromDraft = async () => {
    if (!currentPlanId) return;

    const finalItems = draftItems
      .filter((item) => item.included && item.name.trim())
      .map((item) => ({
        name: item.name.trim(),
        category: item.category.trim() || SHOPPING_GROUP_MANUAL,
        source_type: item.source_type,
        source_id: item.source_id,
        note: item.note?.trim() || null,
      }));

    setIsDraftSubmitting(true);
    try {
      const resp = await shoppingListsApi.generate({
        meal_plan_id: currentPlanId,
        items: finalItems,
      });
      if (resp.data.success) {
        showNotification('success', 'Đã tạo checklist mua sắm');
        await fetchProductsAndShoppingList();
        setIsDraftModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to create checklist from draft:', error);
      showNotification('error', 'Không thể tạo checklist mua sắm');
    } finally {
      setIsDraftSubmitting(false);
    }
  };

  const openProductModal = () => {
    setProductLibrarySearch('');
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
    } catch (error: unknown) {
      console.error('Failed to toggle meal:', error);
      const err = error as { response?: { data?: { detail?: string } }; message?: string };
      const errorMsg = err.response?.data?.detail || err.message || 'Lỗi không xác định';
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
    } catch (error: unknown) {
      console.error('Failed to update meal plan:', error);
      const err = error as { response?: { data?: { detail?: string } }; message?: string };
      const errorMsg = err.response?.data?.detail || err.message || 'Lỗi không xác định';
      showNotification('error', `Không thể xóa món ăn: ${errorMsg}`);
    }
  };

  const filteredMeals = mealDatabase.filter(meal => 
    meal.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDraftMeals = mealDatabase.filter((meal) =>
    meal.name.toLowerCase().includes(draftMealSearch.toLowerCase())
  );

  const filteredDraftProducts = productsDatabase.filter((product) =>
    product.name.toLowerCase().includes(draftProductSearch.toLowerCase())
  );

  const filteredProductsDatabase = productsDatabase.filter((product) =>
    product.name.toLowerCase().includes(productLibrarySearch.toLowerCase())
  );

  const includedDraftCount = draftItems.filter((item) => item.included && item.name.trim()).length;

  if (authLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-sage" />
          <p className="text-sm text-bark/60">Loading your meal plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell pb-4 sm:pb-12 animate-page-enter min-w-0">
      {/* Notifications */}
      {notification && (
        <div
          role="alert"
          className={cn(
            "fixed top-[calc(3.5rem+env(safe-area-inset-top))] left-3 right-3 sm:left-auto sm:right-6 sm:top-8 z-[100] flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4 rounded-2xl shadow-warm animate-scale-in max-w-md sm:ml-auto",
            notification.type === 'success'
              ? 'bg-sage text-cream'
              : notification.type === 'info'
                ? 'bg-bark text-cream'
                : 'bg-red-500 text-cream'
          )}>
          {notification.type === 'success' ? <CheckCircle2 className="h-5 w-5 flex-shrink-0" /> : <X className="h-5 w-5 flex-shrink-0" />}
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
            onClick={openDraftModal}
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
                    
                    const ingredients = parseIngredients(mealDetails?.ingredients);

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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="meal-modal-title">
          <button type="button" className="absolute inset-0 bg-bark/30 backdrop-blur-sm" aria-label="Close modal" onClick={() => setIsModalOpen(false)} />
          <div 
            ref={modalRef}
            className="relative bg-cream rounded-t-[2rem] sm:rounded-[2.5rem] w-full max-w-lg shadow-warm animate-scale-in overflow-hidden max-h-[min(90dvh,640px)] flex flex-col pb-[env(safe-area-inset-bottom)]"
          >
            <div className="p-5 sm:p-8 border-b border-bark/5 shrink-0">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 id="meal-modal-title" className="text-xs font-bold text-bark uppercase tracking-[0.2em] sm:tracking-[0.3em]">Chọn món ăn</h3>
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

      {/* Shopping List Draft Modal */}
      {isDraftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4" role="dialog" aria-modal="true" aria-labelledby="draft-modal-title">
          <button type="button" className="absolute inset-0 bg-bark/30 backdrop-blur-sm" aria-label="Close modal" onClick={() => setIsDraftModalOpen(false)} />
          <div className="relative bg-cream rounded-t-[2rem] lg:rounded-[2.5rem] w-full max-w-6xl shadow-warm animate-scale-in overflow-hidden flex flex-col max-h-[min(94dvh,820px)] pb-[env(safe-area-inset-bottom)]">
            <div className="p-4 sm:p-6 border-b border-bark/5 flex-shrink-0">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 id="draft-modal-title" className="text-xs font-bold text-bark uppercase tracking-[0.25em]">Tạo shopping list</h3>
                  <p className="mt-1 text-xs text-bark/50">{includedDraftCount} items selected</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDraftModalOpen(false)}
                  className="h-10 w-10 flex items-center justify-center hover:bg-hemp/50 rounded-full transition-all touch-manipulation"
                  aria-label="Close draft modal"
                >
                  <X className="h-5 w-5 text-bark/40" />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-5">
                <section className="min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.22em] text-bark/60">Draft items</h4>
                    {draftItems.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setDraftItems((items) => items.map((item) => ({ ...item, included: true })))}
                        className="text-[10px] font-bold uppercase tracking-widest text-sage-deep hover:text-bark"
                      >
                        Select all
                      </button>
                    )}
                  </div>

                  {draftItems.length > 0 ? (
                    <div className="space-y-2">
                      {draftItems.map((item) => (
                        <div key={item.draft_id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 items-start bg-hemp/10 border border-bark/5 rounded-2xl p-3">
                          <label className="pt-3 flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={item.included}
                              onChange={(event) => updateDraftItem(item.draft_id, { included: event.target.checked })}
                              className="h-5 w-5 rounded border-bark/20 text-sage focus:ring-sage"
                              aria-label={`Include ${item.name}`}
                            />
                          </label>
                          <div className="min-w-0 space-y-2">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(event) => updateDraftItem(item.draft_id, { name: event.target.value })}
                              className="w-full bg-cream border border-bark/10 rounded-xl px-3 py-2.5 text-sm font-semibold text-bark focus:outline-none focus:ring-2 focus:ring-sage/20"
                              aria-label="Draft item name"
                            />
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-sage-deep bg-sage/10 px-2 py-1 rounded-lg">
                                {item.category}
                              </span>
                              {item.note && (
                                <span className="text-[10px] text-bark/45 truncate max-w-full">{item.note}</span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDraftItem(item.draft_id)}
                            className="h-10 w-10 flex items-center justify-center hover:bg-red-50 text-red-500 rounded-full transition-all touch-manipulation"
                            aria-label={`Remove ${item.name}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-40 flex items-center justify-center border-2 border-dashed border-bark/10 rounded-2xl">
                      <p className="text-sm text-bark/35 italic">Draft đang trống. Thêm món hoặc sản phẩm để tạo checklist.</p>
                    </div>
                  )}
                </section>

                <aside className="space-y-4 min-w-0">
                  <section className="bg-hemp/10 border border-bark/5 rounded-2xl p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-bark/60">Thêm món vào list</h4>
                      <Plus className="h-4 w-4 text-sage-deep" />
                    </div>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-bark/25" />
                      <input
                        type="text"
                        value={draftMealSearch}
                        onChange={(event) => setDraftMealSearch(event.target.value)}
                        placeholder="Tìm món..."
                        className="w-full bg-cream border border-bark/10 rounded-xl py-2.5 pl-9 pr-3 text-sm text-bark placeholder:text-bark/25 focus:outline-none focus:ring-2 focus:ring-sage/20"
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto space-y-2 custom-scrollbar">
                      {filteredDraftMeals.length > 0 ? (
                        filteredDraftMeals.map((meal) => (
                          <button
                            type="button"
                            key={meal.id}
                            onClick={() => addMealToDraft(meal)}
                            className="w-full text-left px-3 py-2.5 rounded-xl bg-cream hover:bg-sage/10 text-sm font-medium text-bark transition-all"
                          >
                            {meal.name}
                          </button>
                        ))
                      ) : (
                        <p className="py-6 text-center text-xs text-bark/35 italic">Không tìm thấy món.</p>
                      )}
                    </div>
                  </section>

                  <section className="bg-hemp/10 border border-bark/5 rounded-2xl p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-bark/60">Thêm sản phẩm vào list</h4>
                      <ShoppingBag className="h-4 w-4 text-sage-deep" />
                    </div>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-bark/25" />
                      <input
                        type="text"
                        value={draftProductSearch}
                        onChange={(event) => setDraftProductSearch(event.target.value)}
                        placeholder="Tìm sản phẩm..."
                        className="w-full bg-cream border border-bark/10 rounded-xl py-2.5 pl-9 pr-3 text-sm text-bark placeholder:text-bark/25 focus:outline-none focus:ring-2 focus:ring-sage/20"
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto space-y-2 custom-scrollbar">
                      {filteredDraftProducts.length > 0 ? (
                        filteredDraftProducts.map((product) => (
                          <button
                            type="button"
                            key={product.id}
                            onClick={() => addProductToDraft(product)}
                            className="w-full text-left px-3 py-2.5 rounded-xl bg-cream hover:bg-sage/10 text-sm font-medium text-bark transition-all"
                          >
                            {product.name}
                          </button>
                        ))
                      ) : (
                        <p className="py-6 text-center text-xs text-bark/35 italic">Không tìm thấy sản phẩm.</p>
                      )}
                    </div>
                  </section>
                </aside>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-bark/5 bg-cream flex flex-col sm:flex-row justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsDraftModalOpen(false)}
                className="px-5 py-3 rounded-xl border border-bark/10 text-bark text-xs font-bold uppercase tracking-widest hover:bg-hemp/40 transition-all"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCreateChecklistFromDraft}
                disabled={isDraftSubmitting || includedDraftCount === 0}
                className="px-6 py-3 bg-bark text-cream rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-bark/90 transition-all shadow-soft disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDraftSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Tạo checklist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Modal Popup */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
          <button type="button" className="absolute inset-0 bg-bark/30 backdrop-blur-sm" aria-label="Close modal" onClick={() => setIsProductModalOpen(false)} />
          <div 
            className="relative bg-cream rounded-t-[2rem] sm:rounded-[2.5rem] w-full max-w-4xl shadow-warm animate-scale-in overflow-hidden flex flex-col max-h-[min(92dvh,720px)] pb-[env(safe-area-inset-bottom)]"
          >
            <div className="p-4 sm:p-6 border-b border-bark/5 flex-shrink-0 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 id="product-modal-title" className="text-xs font-bold text-bark uppercase tracking-[0.3em]">Thư viện sản phẩm</h3>
                <button 
                  onClick={() => setIsProductModalOpen(false)}
                  className="p-2 hover:bg-hemp/50 rounded-full transition-all"
                >
                  <X className="h-5 w-5 text-bark/40" />
                </button>
              </div>
              
              {/* Search Bar optimized for mobile */}
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-bark/35" />
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={productLibrarySearch}
                  onChange={(e) => setProductLibrarySearch(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-bark/5 border border-bark/10 rounded-2xl text-sm font-medium text-bark placeholder:text-bark/30 focus:outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all"
                />
                {productLibrarySearch && (
                  <button
                    type="button"
                    onClick={() => setProductLibrarySearch('')}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-bark/30 hover:text-bark transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="overflow-y-auto p-4 md:p-6 custom-scrollbar" role="region" aria-label="Available products">
              {filteredProductsDatabase.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                  {filteredProductsDatabase.map((p, idx) => {
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
                  <p className="text-bark/40 text-lg italic">
                    {productLibrarySearch ? 'Không tìm thấy sản phẩm phù hợp.' : 'Không có sản phẩm nào trong thư viện.'}
                  </p>
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

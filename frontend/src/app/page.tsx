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
  const [selectedMealIds, setSelectedMealIds] = useState<Record<number, string[]>>({});
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
        const mealId = item.meal?.id || item.name;
        if (!Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex > 6 || !mealId) return;
        transformed[dayIndex] = [...(transformed[dayIndex] || []), String(mealId)];
      });
    }
    setSelectedMealIds(transformed);
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
        setSelectedMealIds({});
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
    const meals = Object.entries(mealsByDay).flatMap(([dayKey, mealIds]) => {
      const dayIndex = Number(dayKey);
      if (!Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex > 6) return [];

      return mealIds.flatMap((mealId) => {
        const meal = mealDatabase.find((entry) => entry.id === mealId);
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

  const findMealById = useCallback(
    (mealId: string) => mealDatabase.find((entry) => entry.id === mealId),
    [mealDatabase]
  );

  const findMealByName = useCallback(
    (mealName: string) => mealDatabase.find((entry) => entry.name === mealName),
    [mealDatabase]
  );

  const buildDraftItems = useCallback((): DraftShoppingItem[] => {
    const mealItems = Object.entries(selectedMealIds).flatMap(([dayKey, mealIds]) =>
      mealIds.flatMap((mealId, mealIndex) => {
        const meal = findMealById(mealId);
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
  }, [extraProducts, findMealById, productsDatabase, selectedMealIds]);

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

  const handleToggleMeal = async (meal: Meal) => {
    if (activeDayIndex === null || !user) return;

    const currentMeals = selectedMealIds[activeDayIndex] || [];
    let updatedMeals;

    if (currentMeals.includes(meal.id)) {
      // Remove meal
      updatedMeals = currentMeals.filter((m) => m !== meal.id);
    } else {
      // Add meal (limit 3)
      if (currentMeals.length >= 3) {
        alert("Mỗi ngày chỉ tối đa 3 món ăn.");
        return;
      }
      updatedMeals = [...currentMeals, meal.id];
    }

    const nextSelectedMeals = {
      ...selectedMealIds,
      [activeDayIndex]: updatedMeals,
    };

    // Save to backend
    await persistMealPlan(nextSelectedMeals);
    setSelectedMealIds(nextSelectedMeals);
    showNotification('success', currentMeals.includes(meal.id) ? 'Đã xóa món ăn' : 'Đã thêm món ăn');
  };

  const removeMeal = async (dayIndex: number, mealIndex: number) => {
    if (!user) return;
    const currentMeals = selectedMealIds[dayIndex] || [];
    const updatedMeals = currentMeals.filter((_, i) => i !== mealIndex);
    const nextSelectedMeals = {
      ...selectedMealIds,
      [dayIndex]: updatedMeals,
    };

    try {
      await persistMealPlan(nextSelectedMeals);

      setSelectedMealIds(nextSelectedMeals);
      showNotification('success', 'Đã xóa món ăn');
    } catch (error: unknown) {
      console.error('Failed to update meal plan:', error);
      const err = error as { response?: { data?: { detail?: string } }; message?: string };
      const errorMsg = err.response?.data?.detail || err.message || 'Lỗi không xác định';
      showNotification('error', `Không thể xóa món ăn: ${errorMsg}`);
    }
  };

  const findMealByIdForRender = useCallback(
    (mealId: string) => mealDatabase.find((entry) => entry.id === mealId),
    [mealDatabase]
  );

  const dayMealDisplayIds = useCallback(
    (dayIndex: number) => selectedMealIds[dayIndex] || [],
    [selectedMealIds]
  );

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
    <div className="page-shell pb-6 sm:pb-16 animate-page-enter min-w-0">
      {/* Notifications */}
      {notification && (
        <div
          role="alert"
          className={cn(
            "fixed top-[calc(4rem+env(safe-area-inset-top))] left-3 right-3 sm:left-auto sm:right-6 sm:top-8 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-warm animate-scale-in max-w-md sm:ml-auto border border-cream/10",
            notification.type === 'success'
              ? 'bg-sage text-cream'
              : notification.type === 'info'
                ? 'bg-bark text-cream'
                : 'bg-red-500 text-cream'
          )}
        >
          {notification.type === 'success' ? <CheckCircle2 className="h-5 w-5 flex-shrink-0" /> : <X className="h-5 w-5 flex-shrink-0" />}
          <span className="font-bold text-xs uppercase tracking-widest">{notification.message}</span>
        </div>
      )}

      {/* Hero Welcome Header & Main Action */}
      <header className="mb-6 sm:mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="page-title text-3xl sm:text-4xl md:text-5xl text-bark font-serif mb-2 leading-tight font-black tracking-tight">
            Kế hoạch ăn uống
          </h1>
          <p className="text-sm text-bark/50 font-medium">Lên thực đơn dinh dưỡng và chuẩn bị danh sách mua sắm tuần này</p>
        </div>

        {/* Generate Shopping List Button styled as a Premium Accent Action */}
        <div className="shrink-0">
          <button
            onClick={openDraftModal}
            disabled={!currentPlanId || isLoading}
            className="w-full md:w-auto px-6 py-3.5 bg-bark text-cream hover:bg-sage-deep rounded-2xl text-xs font-bold uppercase tracking-widest shadow-soft hover:shadow-warm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 touch-manipulation active:scale-[0.98]"
          >
            <ShoppingBag className="h-4.5 w-4.5 shrink-0" />
            <span>Tạo danh sách mua sắm</span>
          </button>
        </div>
      </header>

      {/* 7-Day Plan: Vertical Grid on Mobile, Bento Grid on Desktop */}
      <div className="w-full pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {DAY_INDICES.map((dayIndex) => {
            const dayMeals = dayMealDisplayIds(dayIndex);

            // Calculate if this day is today dynamically
            const today = new Date();
            const currentDayOfWeek = today.getDay();
            const mappedTodayIndex = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
            const isToday = dayIndex === mappedTodayIndex;

            return (
              <div
                key={dayIndex}
                className={cn(
                  "w-full flex flex-col h-full min-h-[320px] lg:min-h-[380px] transition-all duration-300 rounded-[1.75rem] sm:rounded-[2rem] p-5 sm:p-6 shadow-soft border relative group",
                  isToday
                    ? "bg-cream border-sage border-2 shadow-warm ring-1 ring-sage/10"
                    : "bg-cream/40 border-bark/5 opacity-90 lg:opacity-85 hover:opacity-100 focus-within:opacity-100"
                )}
              >
                {isToday && (
                  <span className="absolute -top-3 left-6 px-3 py-1 bg-sage text-cream text-[9px] font-black uppercase tracking-widest rounded-full shadow-sm">
                    Hôm nay
                  </span>
                )}

                {/* Day Header */}
                <div className="mb-4 flex items-center justify-between border-b border-bark/5 pb-3">
                  <h4 className={cn(
                    "text-xs font-black uppercase tracking-[0.18em]",
                    isToday ? "text-sage-deep" : "text-bark/50"
                  )}>
                    {DAY_LABELS[dayIndex]}
                  </h4>
                  {isToday && <span className="w-2 h-2 bg-sage rounded-full" />}
                </div>

                {/* Selected Meals List */}
                <div className="flex-1 space-y-3 mb-5 overflow-y-auto max-h-[220px] pr-1 custom-scrollbar">
                  {dayMeals.length > 0 ? (
                    dayMeals.map((mealId, mIdx) => {
                      const mealDetails = findMealByIdForRender(mealId);
                      const ingredients = parseIngredients(mealDetails?.ingredients);

                      return (
                        <div
                          key={mIdx}
                          className="group/meal flex flex-col bg-hemp/15 rounded-2xl p-3.5 border border-bark/5 hover:bg-hemp/30 transition-all duration-200 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-xs text-bark font-bold leading-tight break-words flex-1 pr-1">{mealDetails?.name || mealId}</span>
                            <button
                              onClick={() => removeMeal(dayIndex, mIdx)}
                              className="lg:opacity-0 lg:group-hover/meal:opacity-100 p-1.5 -mr-1.5 -mt-1 hover:bg-bark/10 rounded-full transition-all touch-manipulation min-h-[30px] min-w-[30px] flex items-center justify-center shrink-0"
                              title="Xóa món ăn"
                            >
                              <X className="h-3 w-3 text-bark/50 hover:text-red-500" />
                            </button>
                          </div>
                          {ingredients.length > 0 && (
                            <ul className="mt-2 space-y-1 pl-1">
                              {ingredients.slice(0, 4).map((ing: string, iIdx: number) => (
                                <li key={iIdx} className="text-[10px] text-bark/45 flex items-center gap-1.5 truncate" title={ing}>
                                  <span className="w-1 h-1 bg-bark/20 rounded-full flex-shrink-0" />
                                  <span className="truncate">{ing}</span>
                                </li>
                              ))}
                              {ingredients.length > 4 && (
                                <li className="text-[9px] text-sage font-semibold pl-2.5">
                                  + {ingredients.length - 4} nguyên liệu khác
                                </li>
                              )}
                            </ul>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-bark/5 rounded-2xl p-4 text-center">
                      <span className="text-xl mb-1 opacity-20">🍽️</span>
                      <p className="text-[10px] text-bark/30 italic">Chưa chọn món nào</p>
                    </div>
                  )}
                </div>

                {/* Add Button with Soft Micro-interaction */}
                <button
                  onClick={() => openModal(dayIndex)}
                  className={cn(
                    "w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-150 font-bold text-[10px] uppercase tracking-widest active:scale-[0.97]",
                    isToday
                      ? "bg-sage text-cream hover:bg-sage-deep shadow-md hover:shadow"
                      : "bg-hemp/30 text-bark hover:bg-sage hover:text-cream shadow-sm"
                  )}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Thêm món</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Extra Products Section as a Beautiful Complementary Bento */}
      <div className="mt-4 sm:mt-6 bg-cream/45 border border-bark/5 rounded-3xl p-5 sm:p-7 shadow-soft">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-xs font-black text-bark uppercase tracking-[0.25em] mb-1">Mua thêm ngoài thực đơn</h3>
            <p className="text-[11px] text-bark/40 font-medium">Bổ sung các nhu yếu phẩm hoặc đồ dùng gia đình cần mua</p>
          </div>
          <button
            onClick={openProductModal}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-sage text-cream rounded-2xl text-xs font-bold uppercase tracking-widest shadow-soft hover:bg-sage-deep transition-all duration-200 active:scale-[0.97] touch-manipulation min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm sản phẩm</span>
          </button>
        </div>

        <div>
          {extraProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {extraProducts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between bg-cream/85 p-4 rounded-2xl border border-hemp/25 shadow-sm hover:border-sage/20 transition-all duration-200">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs text-bark font-bold truncate">{p.name}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveProduct(p.id)}
                    className="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-full transition-all shrink-0"
                    title="Xóa sản phẩm"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center bg-cream/20 rounded-2xl border border-hemp/25 border-dashed">
              <span className="text-2xl mb-1 block opacity-30">🛒</span>
              <p className="text-bark/40 text-xs italic">Chưa có sản phẩm mua thêm nào.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Popup: Chọn Món Ăn */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="meal-modal-title">
          <button type="button" className="absolute inset-0 bg-bark/35 backdrop-blur-sm transition-all" aria-label="Đóng" onClick={() => setIsModalOpen(false)} />
          <div
            ref={modalRef}
            className="relative bg-cream rounded-t-[2.5rem] sm:rounded-3xl w-full max-w-lg shadow-warm animate-scale-in overflow-hidden max-h-[min(90dvh,640px)] flex flex-col pb-[env(safe-area-inset-bottom)] sm:pb-0"
          >
            <div className="p-6 sm:p-8 border-b border-bark/5 shrink-0 bg-cream/90 backdrop-blur-md">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 id="meal-modal-title" className="text-xs font-black text-bark uppercase tracking-[0.25em]">Chọn món ăn</h3>
                  <p className="text-[10px] text-bark/40 font-medium mt-1">Chọn từ thư viện để thêm vào {activeDayIndex !== null && DAY_LABELS[activeDayIndex]}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 w-10 flex items-center justify-center hover:bg-hemp/40 rounded-full transition-all touch-manipulation"
                >
                  <X className="h-5 w-5 text-bark/45" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-bark/30" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Tìm kiếm món ăn trong thư viện..."
                  className="w-full bg-bark/5 border border-bark/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium text-bark placeholder:text-bark/25 focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all focus:outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-1.5 custom-scrollbar bg-cream/30">
              {fetchLoading ? (
                <div className="py-16 flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-sage" />
                </div>
              ) : filteredMeals.length > 0 ? (
                filteredMeals.map((meal, i) => {
                  const isSelected = activeDayIndex !== null && selectedMealIds[activeDayIndex]?.includes(meal.id);
                  return (
                    <button
                      key={i}
                      onClick={() => handleToggleMeal(meal)}
                      disabled={isLoading}
                      className={cn(
                        "w-full text-left px-5 py-3.5 rounded-2xl transition-all font-semibold flex items-center justify-between group active:scale-[0.99] border",
                        isSelected
                          ? "bg-sage text-cream shadow-sm border-transparent"
                          : "hover:bg-sage/10 hover:text-sage-deep text-bark bg-cream border-bark/5 hover:border-transparent"
                      )}
                    >
                      <span className="text-xs sm:text-sm">{meal.name}</span>
                      {isSelected ? (
                        <CheckCircle2 className="h-4.5 w-4.5 text-cream shrink-0" />
                      ) : (
                        <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all text-sage-deep shrink-0" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="py-16 text-center text-bark/40 italic text-xs">
                  Không tìm thấy món ăn nào phù hợp trong thư viện
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shopping List Draft Modal */}
      {isDraftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="draft-modal-title">
          <button type="button" className="absolute inset-0 bg-bark/35 backdrop-blur-sm transition-all" aria-label="Đóng" onClick={() => setIsDraftModalOpen(false)} />
          <div className="relative bg-cream rounded-t-[2.5rem] lg:rounded-3xl w-full max-w-6xl shadow-warm animate-scale-in overflow-hidden flex flex-col max-h-[min(94dvh,820px)] pb-[env(safe-area-inset-bottom)] lg:pb-0">
            <div className="p-5 sm:p-6 border-b border-bark/5 flex-shrink-0 bg-cream/90 backdrop-blur-md">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 id="draft-modal-title" className="text-xs font-black text-bark uppercase tracking-[0.25em]">Chuẩn bị danh sách mua sắm</h3>
                  <p className="mt-1 text-xs text-bark/40 font-medium">Đã chọn {includedDraftCount} nguyên liệu và sản phẩm để thêm vào checklist</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDraftModalOpen(false)}
                  className="h-10 w-10 flex items-center justify-center hover:bg-hemp/40 rounded-full transition-all touch-manipulation"
                  aria-label="Đóng"
                >
                  <X className="h-5 w-5 text-bark/45" />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-cream/20">
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">

                {/* Draft Items Selection */}
                <section className="min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-bark/50">Danh sách nháp (Draft items)</h4>
                    {draftItems.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setDraftItems((items) => items.map((item) => ({ ...item, included: true })))}
                        className="text-[10px] font-bold uppercase tracking-widest text-sage hover:text-sage-deep"
                      >
                        Chọn tất cả
                      </button>
                    )}
                  </div>

                  {draftItems.length > 0 ? (
                    <div className="space-y-2.5">
                      {draftItems.map((item) => (
                        <div key={item.draft_id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 items-center bg-cream border border-bark/5 rounded-2xl p-4 shadow-sm hover:border-sage/10 transition-all">
                          <label className="flex items-center justify-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.included}
                              onChange={(event) => updateDraftItem(item.draft_id, { included: event.target.checked })}
                              className="h-5 w-5 rounded-lg border-bark/20 text-sage focus:ring-sage"
                              aria-label={`Bao gồm ${item.name}`}
                            />
                          </label>
                          <div className="min-w-0 space-y-1">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(event) => updateDraftItem(item.draft_id, { name: event.target.value })}
                              className="w-full bg-cream border border-bark/10 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-bark focus:outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all"
                              aria-label="Tên nguyên liệu"
                            />
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[9px] font-black uppercase tracking-widest text-sage bg-sage/10 px-2 py-0.5 rounded-md">
                                {item.category}
                              </span>
                              {item.note && (
                                <span className="text-[10px] text-bark/40 truncate max-w-full font-medium">{item.note}</span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDraftItem(item.draft_id)}
                            className="h-9 w-9 flex items-center justify-center hover:bg-red-50 text-red-400 hover:text-red-500 rounded-full transition-all touch-manipulation shrink-0"
                            aria-label={`Xóa ${item.name}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-52 flex flex-col items-center justify-center border-2 border-dashed border-bark/10 rounded-3xl p-6 text-center">
                      <span className="text-3xl mb-1 opacity-20">📝</span>
                      <p className="text-xs text-bark/35 italic">Bản nháp đang trống. Thêm món hoặc sản phẩm để tạo checklist.</p>
                    </div>
                  )}
                </section>

                {/* Left Sidebars for Adding Items */}
                <aside className="space-y-4 min-w-0">

                  {/* Add Meals Sidebar */}
                  <section className="bg-cream border border-bark/5 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-bark/50">Thêm món vào list</h4>
                      <Plus className="h-3.5 w-3.5 text-sage" />
                    </div>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-bark/30" />
                      <input
                        type="text"
                        value={draftMealSearch}
                        onChange={(event) => setDraftMealSearch(event.target.value)}
                        placeholder="Tìm món..."
                        className="w-full bg-bark/5 border border-bark/10 rounded-xl py-2 pl-9 pr-3 text-xs text-bark placeholder:text-bark/25 focus:outline-none focus:ring-2 focus:ring-sage/20"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                      {filteredDraftMeals.length > 0 ? (
                        filteredDraftMeals.map((meal) => (
                          <button
                            key={meal.id}
                            onClick={() => addMealToDraft(meal)}
                            className="w-full text-left px-3 py-2 bg-cream hover:bg-sage/10 text-xs font-bold text-bark hover:text-sage-deep transition-all rounded-lg border border-bark/5"
                          >
                            {meal.name}
                          </button>
                        ))
                      ) : (
                        <p className="py-4 text-center text-[10px] text-bark/35 italic">Không tìm thấy món phù hợp.</p>
                      )}
                    </div>
                  </section>

                  {/* Add Products Sidebar */}
                  <section className="bg-cream border border-bark/5 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-bark/50">Thêm sản phẩm vào list</h4>
                      <ShoppingBag className="h-3.5 w-3.5 text-sage" />
                    </div>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-bark/30" />
                      <input
                        type="text"
                        value={draftProductSearch}
                        onChange={(event) => setDraftProductSearch(event.target.value)}
                        placeholder="Tìm sản phẩm..."
                        className="w-full bg-bark/5 border border-bark/10 rounded-xl py-2 pl-9 pr-3 text-xs text-bark placeholder:text-bark/25 focus:outline-none focus:ring-2 focus:ring-sage/20"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                      {filteredDraftProducts.length > 0 ? (
                        filteredDraftProducts.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => addProductToDraft(product)}
                            className="w-full text-left px-3 py-2 bg-cream hover:bg-sage/10 text-xs font-bold text-bark hover:text-sage-deep transition-all rounded-lg border border-bark/5"
                          >
                            {product.name}
                          </button>
                        ))
                      ) : (
                        <p className="py-4 text-center text-[10px] text-bark/35 italic">Không tìm thấy sản phẩm.</p>
                      )}
                    </div>
                  </section>
                </aside>
              </div>
            </div>

            <div className="p-5 sm:p-6 border-t border-bark/5 flex-shrink-0 bg-cream/90 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <p className="text-[11px] text-bark/50 font-medium">
                  {includedDraftCount} mục đã chọn để tạo checklist
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsDraftModalOpen(false)}
                    className="px-5 py-3 rounded-2xl border border-bark/10 text-xs font-bold text-bark hover:bg-hemp/20 transition-all"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateChecklistFromDraft}
                    disabled={isDraftSubmitting || includedDraftCount === 0}
                    className="px-6 py-3 bg-sage text-cream rounded-2xl text-xs font-bold uppercase tracking-widest shadow-soft hover:bg-sage-deep transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isDraftSubmitting ? 'Đang tạo...' : 'Tạo checklist mua sắm'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

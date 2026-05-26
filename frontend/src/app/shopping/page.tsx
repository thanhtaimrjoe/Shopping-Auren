'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, CheckCircle2, MoreHorizontal, ShoppingBag,
  Loader2, ListPlus, Plus, Trash2, X,
} from 'lucide-react';
import Link from 'next/link';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { shoppingListsApi, mealPlansApi } from '@/lib/api';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Toast, type ToastMessage } from '@/components/Toast';
import { SHOPPING_GROUP_MANUAL, sortShoppingGroups } from '@/lib/shopping-groups';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  is_checked: boolean;
  source_type?: string;
  note?: string | null;
}

interface ShoppingList {
  id: string;
  status: string;
  items: ShoppingItem[];
  total_items: number;
  checked_items: number;
  progress: number;
}

export default function ShoppingPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMealPlanId, setCurrentMealPlanId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [weekFrom, setWeekFrom] = useState('');
  const [weekTo, setWeekTo] = useState('');
  const allCheckedNotifiedRef = useRef(false);

  const isListActive = list?.status === 'active';

  const fetchCurrentList = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    const [planResult, listResult] = await Promise.allSettled([
      mealPlansApi.getCurrent(),
      shoppingListsApi.getCurrent(),
    ]);

    if (planResult.status === 'fulfilled' && planResult.value.data.success) {
      setCurrentMealPlanId(planResult.value.data.data.meal_plan?.id || null);
    } else {
      setCurrentMealPlanId(null);
    }

    if (listResult.status === 'fulfilled' && listResult.value.data.success) {
      setList(listResult.value.data.data.shopping_list);
    } else if (listResult.status === 'rejected') {
      const status = (listResult.reason as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        setList(null);
      }
    }

    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchCurrentList();
    }
  }, [authLoading, user, fetchCurrentList]);

  useEffect(() => {
    allCheckedNotifiedRef.current = false;
  }, [list?.id]);

  const toggleItem = async (itemId: string, currentStatus: boolean) => {
    if (!list || list.status === 'completed') return;

    const updatedItems = list.items.map((item) =>
      item.id === itemId ? { ...item, is_checked: !currentStatus } : item
    );
    const checkedCount = updatedItems.filter((i) => i.is_checked).length;
    const total = updatedItems.length;

    setList({
      ...list,
      items: updatedItems,
      checked_items: checkedCount,
      progress: total ? Math.round((checkedCount / total) * 100) : 0,
    });

    if (
      total > 0 &&
      checkedCount === total &&
      !allCheckedNotifiedRef.current
    ) {
      allCheckedNotifiedRef.current = true;
      setToast({ type: 'success', message: 'すべてチェックしました！買い物完了ボタンを押してください。' });
    }

    try {
      await shoppingListsApi.updateItem(list.id, itemId, { is_checked: !currentStatus });
    } catch {
      fetchCurrentList();
    }
  };

  const openCompleteModal = () => {
    if (!list || list.status === 'completed') return;
    setWeekFrom('');
    setWeekTo('');
    setIsCompleteModalOpen(true);
  };

  const handleCompleteList = async () => {
    if (!list || list.status === 'completed' || !weekFrom || !weekTo) return;
    if (weekTo < weekFrom) {
      setToast({ type: 'error', message: '終了日は開始日以降にしてください。' });
      return;
    }
    setIsCompleting(true);
    try {
      const response = await shoppingListsApi.complete(list.id, {
        week_from_date: weekFrom,
        week_to_date: weekTo,
      });
      if (response.data.success) {
        setList(null);
        setIsCompleteModalOpen(false);
        setToast({ type: 'success', message: '買い物リストを完了しました。' });
      }
    } catch (error) {
      console.error('Failed to complete list:', error);
      setToast({ type: 'error', message: 'リストを完了できませんでした。' });
    } finally {
      setIsCompleting(false);
    }
  };

  const handleGenerateList = async () => {
    if (!currentMealPlanId) return;
    setIsGenerating(true);
    try {
      const response = await shoppingListsApi.generate({ meal_plan_id: currentMealPlanId });
      if (response.data.success) {
        setList(response.data.data.shopping_list);
      }
    } catch (error) {
      console.error('Failed to generate list:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddItem = async () => {
    if (!list || !newItemName.trim()) return;
    setIsAddingItem(true);
    try {
      const response = await shoppingListsApi.addItem(list.id, {
        name: newItemName.trim(),
        category: SHOPPING_GROUP_MANUAL,
      });
      if (response.data.success) {
        const item = response.data.data.item;
        const items = [...list.items, item];
        const checkedCount = items.filter((i) => i.is_checked).length;
        setList({
          ...list,
          items,
          total_items: items.length,
          checked_items: checkedCount,
          progress: items.length
            ? Math.round((checkedCount / items.length) * 100)
            : 0,
        });
        setNewItemName('');
        setIsAddSheetOpen(false);
        setToast({ type: 'success', message: 'アイテムを追加しました。' });
      }
    } catch (error) {
      console.error('Failed to add item:', error);
      setToast({ type: 'error', message: 'アイテムを追加できませんでした。' });
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!list || list.status === 'completed') return;
    try {
      await shoppingListsApi.deleteItem(list.id, itemId);
      const items = list.items.filter((i) => i.id !== itemId);
      const checkedCount = items.filter((i) => i.is_checked).length;
      setList({
        ...list,
        items,
        total_items: items.length,
        checked_items: checkedCount,
        progress: items.length ? Math.round((checkedCount / items.length) * 100) : 0,
      });
    } catch (error) {
      console.error('Failed to delete item:', error);
      setToast({ type: 'error', message: 'アイテムを削除できませんでした。' });
    }
  };

  const filteredItems =
    list?.items.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const categories = sortShoppingGroups(
    Array.from(new Set(filteredItems.map((item) => item.category)))
  );

  if (authLoading || !user || (isLoading && !list)) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sage" />
      </div>
    );
  }

  return (
    <div className="page-shell animate-page-enter min-w-0">
      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}

      <header className="mb-6 sm:mb-10">
        <h1 className="page-title text-2xl sm:text-4xl md:text-5xl text-bark font-serif mb-3 sm:mb-6 leading-tight">
          Shopping List
        </h1>
      </header>

      {!list ? (
        <div className="bg-cream rounded-[1.75rem] sm:rounded-[2.5rem] p-6 sm:p-12 shadow-soft text-center max-w-3xl mx-auto">
          <div className="h-20 w-20 rounded-full bg-sage/10 flex items-center justify-center mx-auto mb-8">
            <ShoppingBag className="h-10 w-10 text-sage" />
          </div>
          <h2 className="text-3xl font-serif text-bark mb-4">No active list found</h2>
          <p className="text-bark/60 mb-10 text-lg">
            {currentMealPlanId
              ? 'You have a meal plan. Generate a shopping list to get started.'
              : 'Plan your meals first to automatically generate a shopping list.'}
          </p>
          {currentMealPlanId ? (
            <button
              type="button"
              onClick={handleGenerateList}
              disabled={isGenerating}
              className="bg-sage text-cream px-10 py-5 rounded-2xl font-bold uppercase tracking-widest text-sm shadow-warm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 mx-auto disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <ListPlus className="h-5 w-5" />}
              Generate List
            </button>
          ) : (
            <Link
              href="/"
              className="inline-flex bg-bark text-cream px-10 py-5 rounded-2xl font-bold uppercase tracking-widest text-sm shadow-warm hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Go to Planner
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="text-sm text-bark/50">
              {list.checked_items} / {list.total_items} checked
              {list.status === 'completed' && (
                <span className="ml-3 text-sage-deep font-semibold uppercase tracking-widest text-xs">
                  Completed
                </span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {isListActive && (
                <button
                  type="button"
                  onClick={() => setIsAddSheetOpen(true)}
                  className="w-full sm:w-auto justify-center bg-cream text-bark border border-bark/10 px-6 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 touch-manipulation min-h-[48px]"
                >
                  <Plus className="h-4 w-4" />
                  Add item
                </button>
              )}
              {isListActive && list.total_items > 0 && (
                <button
                  type="button"
                  onClick={openCompleteModal}
                  disabled={isCompleting}
                  className="w-full sm:w-auto justify-center bg-sage text-cream px-6 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-warm disabled:opacity-50 flex items-center gap-2 touch-manipulation min-h-[48px]"
                >
                  {isCompleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Finish shopping
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-bark/30" />
              <input
                type="text"
                placeholder="Search items..."
                className="w-full bg-cream border-0 rounded-2xl py-4 pl-12 pr-4 text-bark placeholder:text-bark/20 shadow-soft focus:ring-2 focus:ring-sage/20 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-12">
            {categories.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-bark/40 font-serif text-xl">No items found matching your search.</p>
              </div>
            ) : (
              categories.map((category) => {
                const categoryItems = filteredItems.filter((item) => item.category === category);
                if (categoryItems.length === 0) return null;

                return (
                  <section key={category}>
                    <h3 className="text-xs font-bold text-bark/40 uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
                      {category}
                      <div className="h-px flex-1 bg-bark/5" />
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {categoryItems.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            'group flex items-center justify-between p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] transition-all duration-300 min-h-[56px]',
                            item.is_checked ? 'bg-hemp/20 opacity-60' : 'bg-cream shadow-soft'
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => toggleItem(item.id, item.is_checked)}
                            disabled={list.status === 'completed'}
                            className="flex items-start gap-4 flex-1 text-left touch-manipulation min-h-[44px]"
                          >
                            <div
                              className={cn(
                                'h-6 w-6 rounded-full flex items-center justify-center transition-colors shrink-0 mt-0.5',
                                item.is_checked
                                  ? 'bg-sage text-cream'
                                  : 'border-2 border-bark/10 group-hover:border-sage/40'
                              )}
                            >
                              {item.is_checked ? <CheckCircle2 className="h-4 w-4" /> : null}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span
                                className={cn(
                                  'font-medium transition-all block',
                                  item.is_checked ? 'text-bark/40 line-through' : 'text-bark'
                                )}
                              >
                                {item.name}
                              </span>
                              {item.note ? (
                                <span
                                  className={cn(
                                    'block text-xs mt-1 leading-snug',
                                    item.is_checked ? 'text-bark/30' : 'text-bark/50'
                                  )}
                                >
                                  {item.note}
                                </span>
                              ) : null}
                            </div>
                          </button>
                          {isListActive && item.source_type === 'manual' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-2 text-bark/20 hover:text-red-500 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                              aria-label={`Remove ${item.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          {(!isListActive || item.source_type !== 'manual') && (
                            <MoreHorizontal className="h-5 w-5 text-bark/10 shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })
            )}
          </div>
        </>
      )}

      {isCompleteModalOpen && list && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-bark/40 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => !isCompleting && setIsCompleteModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-cream rounded-t-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-warm animate-page-enter">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-bold text-bark uppercase tracking-[0.2em]">
                Weekly period
              </h2>
              <button
                type="button"
                onClick={() => setIsCompleteModalOpen(false)}
                disabled={isCompleting}
                className="p-3 bg-hemp/20 rounded-xl touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-bark/60 mb-6">
              Enter the date range for this shopping trip. It will be saved in your history.
            </p>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-bark/40 px-2">
                  From
                </label>
                <input
                  type="date"
                  className="w-full bg-hemp/10 border-0 rounded-2xl py-4 px-6 text-bark focus:ring-2 focus:ring-sage/20"
                  value={weekFrom}
                  onChange={(e) => setWeekFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-bark/40 px-2">
                  To
                </label>
                <input
                  type="date"
                  className="w-full bg-hemp/10 border-0 rounded-2xl py-4 px-6 text-bark focus:ring-2 focus:ring-sage/20"
                  value={weekTo}
                  onChange={(e) => setWeekTo(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={handleCompleteList}
                disabled={isCompleting || !weekFrom || !weekTo}
                className="w-full py-4 bg-sage text-cream rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50 touch-manipulation min-h-[48px]"
              >
                {isCompleting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save & finish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddSheetOpen && list && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-bark/40 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setIsAddSheetOpen(false)}
          />
          <div className="relative w-full max-w-md bg-cream rounded-t-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-warm animate-page-enter">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-bold text-bark uppercase tracking-[0.2em]">Add item</h2>
              <button
                type="button"
                onClick={() => setIsAddSheetOpen(false)}
                className="p-3 bg-hemp/20 rounded-xl touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-bark/40 px-2">
                  Item name
                </label>
                <input
                  type="text"
                  className="w-full bg-hemp/10 border-0 rounded-2xl py-4 px-6 text-bark focus:ring-2 focus:ring-sage/20"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Milk, eggs..."
                />
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                disabled={isAddingItem || !newItemName.trim()}
                className="w-full py-4 bg-sage text-cream rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50 touch-manipulation min-h-[48px]"
              >
                {isAddingItem ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Add to list'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

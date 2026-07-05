'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, CheckCircle2, MoreHorizontal, ShoppingBag,
  Loader2, ListPlus, Plus, Trash2, X,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { shoppingListsApi, mealPlansApi } from '@/lib/api';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Toast, type ToastMessage } from '@/components/Toast';
import { SHOPPING_GROUP_MANUAL, sortShoppingGroups } from '@/lib/shopping-groups';

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
      setToast({ type: 'success', message: 'Tuyệt vời! Đã mua đủ sản phẩm. Hãy nhấn nút Hoàn tất mua sắm.' });
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
      setToast({ type: 'error', message: 'Ngày kết thúc phải trùng hoặc sau ngày bắt đầu.' });
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
        setToast({ type: 'success', message: 'Danh sách mua sắm đã hoàn tất và lưu vào lịch sử.' });
      }
    } catch (error) {
      console.error('Failed to complete list:', error);
      setToast({ type: 'error', message: 'Không thể hoàn thành danh sách mua sắm.' });
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
        setToast({ type: 'success', message: 'Tạo danh sách mua sắm thành công!' });
      }
    } catch (error) {
      console.error('Failed to generate list:', error);
      setToast({ type: 'error', message: 'Không thể khởi tạo danh sách mua sắm.' });
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
        setToast({ type: 'success', message: 'Đã thêm sản phẩm mới vào danh sách.' });
      }
    } catch (error) {
      console.error('Failed to add item:', error);
      setToast({ type: 'error', message: 'Không thể thêm sản phẩm.' });
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
      setToast({ type: 'success', message: 'Đã xóa sản phẩm thành công.' });
    } catch (error) {
      console.error('Failed to delete item:', error);
      setToast({ type: 'error', message: 'Không thể xóa sản phẩm.' });
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
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-sage" />
          <p className="text-sm text-bark/60 font-medium">Đang tải danh sách mua sắm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell animate-page-enter min-w-0 pb-12">
      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}

      {/* Page Header */}
      <header className="mb-6 sm:mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="page-title text-3xl sm:text-4xl md:text-5xl text-bark font-serif leading-tight font-black tracking-tight">
            Danh sách mua sắm
          </h1>
          <p className="text-sm text-bark/50 font-medium mt-1">
            Quản lý và kiểm tra nguyên liệu thực phẩm cho đợt mua sắm
          </p>
        </div>
        {list && isListActive && (
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => setIsAddSheetOpen(true)}
              className="w-full sm:w-auto justify-center h-12 sm:h-14 px-6 bg-cream text-bark border border-bark/10 rounded-2xl shadow-soft hover:shadow hover:bg-white/80 flex items-center gap-2.5 transition-all font-bold uppercase tracking-widest text-xs touch-manipulation active:scale-95 duration-200"
            >
              <Plus className="h-5 w-5 shrink-0" />
              Thêm sản phẩm
            </button>
            {list.total_items > 0 && (
              <button
                type="button"
                onClick={openCompleteModal}
                disabled={isCompleting}
                className="w-full sm:w-auto justify-center h-12 sm:h-14 px-6 bg-sage text-cream rounded-2xl shadow-soft hover:shadow-warm flex items-center gap-2.5 hover:bg-sage-deep transition-all font-bold uppercase tracking-widest text-xs touch-manipulation active:scale-95 duration-200 disabled:opacity-50"
              >
                {isCompleting ? <Loader2 className="h-5 w-5 animate-spin shrink-0" /> : <CheckCircle2 className="h-5 w-5 shrink-0" />}
                Hoàn tất mua sắm
              </button>
            )}
          </div>
        )}
      </header>

      {!list ? (
        <div className="bg-cream/40 border border-bark/5 rounded-[2.5rem] p-8 sm:p-14 shadow-soft text-center max-w-3xl mx-auto animate-scale-in">
          <div className="h-20 w-20 rounded-3xl bg-sage/10 flex items-center justify-center mx-auto mb-6 shadow-sm">
            <ShoppingBag className="h-10 w-10 text-sage" />
          </div>
          <h2 className="text-3xl font-serif text-bark mb-3 font-bold tracking-tight">Chưa có danh sách mua sắm</h2>
          <p className="text-bark/50 mb-8 max-w-md mx-auto text-sm leading-relaxed font-medium">
            {currentMealPlanId
              ? 'Bạn đã lập kế hoạch ăn uống cho tuần này. Hãy tạo nhanh danh sách mua sắm tương ứng để bắt đầu mua sắm ngay.'
              : 'Hãy lập kế hoạch ăn uống trước tiên tại trang Lập kế hoạch để hệ thống tự động tổng hợp danh sách nguyên liệu cần mua sắm.'}
          </p>
          {currentMealPlanId ? (
            <button
              type="button"
              onClick={handleGenerateList}
              disabled={isGenerating}
              className="bg-sage text-cream px-8 py-4.5 rounded-2xl font-extrabold uppercase tracking-widest text-xs shadow-warm hover:bg-sage-deep transition-all duration-300 active:scale-95 flex items-center gap-2.5 mx-auto disabled:opacity-50 min-h-[48px]"
            >
              {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <ListPlus className="h-5 w-5" />}
              Tạo danh sách mua sắm
            </button>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center justify-center bg-sage text-cream px-8 py-4.5 rounded-2xl font-extrabold uppercase tracking-widest text-xs shadow-warm hover:bg-sage-deep transition-all duration-300 active:scale-95 min-h-[48px] mx-auto"
            >
              Đi đến trang Lập kế hoạch
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Stats Dashboard Bento Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8">
            {/* Checked items count bento */}
            <div className="bg-cream/40 border border-bark/5 rounded-3xl p-5 shadow-soft flex items-center justify-between gap-4">
              <div>
                <span className="text-[9px] font-black text-gold/80 tracking-widest uppercase">Trạng thái</span>
                <p className="font-serif text-xl sm:text-2xl text-bark font-bold mt-1">
                  {list.checked_items} / {list.total_items}
                </p>
                <p className="text-[10px] text-bark/40 font-semibold uppercase tracking-wider mt-0.5">Sản phẩm đã chọn</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-hemp/30 flex items-center justify-center shrink-0">
                <ShoppingBag className="h-5 w-5 text-sage-deep" />
              </div>
            </div>

            {/* Progress bento */}
            <div className="bg-cream/40 border border-bark/5 rounded-3xl p-5 shadow-soft flex flex-col justify-between gap-3 sm:col-span-2">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[9px] font-black text-sage tracking-widest uppercase">Tiến độ mua sắm</span>
                  <p className="font-serif text-xl sm:text-2xl text-bark font-bold mt-1">{list.progress}%</p>
                </div>
                <span className="text-[10px] text-bark/40 font-semibold uppercase tracking-wider">
                  {list.status === 'completed' ? 'Đã hoàn tất' : 'Đang tiến hành'}
                </span>
              </div>
              <div className="w-full bg-hemp/20 h-2 rounded-full overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
                <div
                  className="bg-sage h-full transition-all duration-500 ease-out"
                  style={{ width: `${list.progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Search Bento Box */}
          <div className="bg-cream/50 border border-bark/5 rounded-3xl p-5 sm:p-7 shadow-soft mb-6 sm:mb-8">
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-5 w-5 text-bark/30 transition-colors duration-300" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm trong danh sách..."
                className="w-full bg-hemp/10 border-0 rounded-2xl py-4 pl-12 pr-12 text-bark placeholder:text-bark/25 focus:ring-2 focus:ring-sage/20 focus:bg-white/80 transition-all shadow-[inset_0_2px_4px_rgba(51,69,55,0.01)]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 p-1 bg-bark/10 hover:bg-bark/20 text-bark/60 rounded-full transition-all hover:scale-105 active:scale-95 touch-manipulation"
                  aria-label="Xóa tìm kiếm"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Category Grouping */}
          <div className="space-y-10">
            {categories.length === 0 ? (
              <div className="py-20 text-center bg-cream/40 border border-bark/5 rounded-3xl shadow-soft">
                <Search className="h-8 w-8 text-bark/20 mx-auto mb-4" />
                <p className="text-bark/40 font-medium">Không tìm thấy sản phẩm nào trong danh sách</p>
              </div>
            ) : (
              categories.map((category) => {
                const categoryItems = filteredItems.filter((item) => item.category === category);
                if (categoryItems.length === 0) return null;

                return (
                  <section key={category}>
                    <h3 className="text-xs font-bold text-bark/40 uppercase tracking-[0.3em] mb-6 flex items-center gap-4">
                      {category}
                      <div className="h-px flex-1 bg-bark/5" />
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {categoryItems.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            'group flex items-center justify-between p-4 sm:p-5.5 rounded-3xl transition-all duration-300 min-h-[56px] border border-bark/5',
                            item.is_checked
                              ? 'bg-hemp/10 opacity-60 border-bark/5'
                              : 'bg-cream/40 hover:border-sage/20 hover:bg-cream/85 hover:scale-[1.015] active:scale-[0.99] shadow-soft hover:shadow-warm'
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
                                'h-6 w-6 rounded-full flex items-center justify-center transition-all shrink-0 mt-0.5',
                                item.is_checked
                                  ? 'bg-sage text-cream shadow-sm scale-105'
                                  : 'border-2 border-bark/10 group-hover:border-sage/40 bg-white/50'
                              )}
                            >
                              {item.is_checked ? <CheckCircle2 className="h-4 w-4" /> : null}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span
                                className={cn(
                                  'font-bold text-sm sm:text-base transition-all block leading-snug',
                                  item.is_checked ? 'text-bark/40 line-through' : 'text-bark'
                                )}
                              >
                                {item.name}
                              </span>
                              {item.note ? (
                                <span
                                  className={cn(
                                    'block text-xs mt-1 leading-snug font-medium',
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
                              className="p-2.5 text-bark/20 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 touch-manipulation min-h-[42px] min-w-[42px] flex items-center justify-center shrink-0"
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

      {/* Complete Shopping Modal */}
      {isCompleteModalOpen && list && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-bark/30 backdrop-blur-sm transition-opacity duration-300"
            aria-label="Đóng"
            onClick={() => !isCompleting && setIsCompleteModalOpen(false)}
          />
          <div className="relative w-full sm:max-w-md bg-cream/95 backdrop-blur-lg border border-bark/8 rounded-t-[2.5rem] sm:rounded-3xl p-6 sm:p-8 shadow-warm animate-scale-in pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-8">
            <div className="flex items-center justify-between mb-6 gap-2 border-b border-bark/5 pb-3">
              <div className="min-w-0">
                <span className="text-[9px] font-black text-gold/80 tracking-widest uppercase">
                  Hoàn tất đợt mua
                </span>
                <h3 className="text-xs font-extrabold text-bark/40 uppercase tracking-[0.15em] truncate mt-0.5">
                  Thời gian mua sắm
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCompleteModalOpen(false)}
                disabled={isCompleting}
                className="p-2.5 bg-hemp/20 hover:bg-hemp/30 text-bark rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation min-h-[40px] min-w-[40px] flex items-center justify-center shadow-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-bark/50 mb-6 font-medium leading-relaxed">
              Nhập khoảng thời gian áp dụng cho đợt mua sắm này để lưu lại lịch sử chi tiêu và thực phẩm của bạn.
            </p>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-bark/40 px-1">
                  Từ ngày
                </label>
                <input
                  type="date"
                  className="w-full bg-hemp/10 border-0 rounded-2xl py-4 px-6 text-bark font-semibold focus:ring-2 focus:ring-sage/20 focus:bg-white transition-all shadow-[inset_0_2px_4px_rgba(51,69,55,0.01)]"
                  value={weekFrom}
                  onChange={(e) => setWeekFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-bark/40 px-1">
                  Đến ngày
                </label>
                <input
                  type="date"
                  className="w-full bg-hemp/10 border-0 rounded-2xl py-4 px-6 text-bark font-semibold focus:ring-2 focus:ring-sage/20 focus:bg-white transition-all shadow-[inset_0_2px_4px_rgba(51,69,55,0.01)]"
                  value={weekTo}
                  onChange={(e) => setWeekTo(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={handleCompleteList}
                disabled={isCompleting || !weekFrom || !weekTo}
                className="w-full py-4 bg-sage text-cream rounded-2xl font-extrabold uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50 touch-manipulation min-h-[48px] shadow-warm hover:bg-sage-deep transition-all duration-300 hover:shadow active:scale-[0.98]"
              >
                {isCompleting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Lưu & hoàn tất'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Item Modal */}
      {isAddSheetOpen && list && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-bark/30 backdrop-blur-sm transition-opacity duration-300"
            aria-label="Đóng"
            onClick={() => setIsAddSheetOpen(false)}
          />
          <div className="relative w-full sm:max-w-md bg-cream/95 backdrop-blur-lg border border-bark/8 rounded-t-[2.5rem] sm:rounded-3xl p-6 sm:p-8 shadow-warm animate-scale-in pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-8">
            <div className="flex items-center justify-between mb-6 gap-2 border-b border-bark/5 pb-3">
              <div className="min-w-0">
                <span className="text-[9px] font-black text-gold/80 tracking-widest uppercase">
                  Sản phẩm mới
                </span>
                <h3 className="text-xs font-extrabold text-bark/40 uppercase tracking-[0.15em] truncate mt-0.5">
                  Thêm sản phẩm thủ công
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSheetOpen(false)}
                className="p-2.5 bg-hemp/20 hover:bg-hemp/30 text-bark rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation min-h-[40px] min-w-[40px] flex items-center justify-center shadow-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-bark/40 px-1">
                  Tên sản phẩm
                </label>
                <input
                  type="text"
                  className="w-full bg-hemp/10 border-0 rounded-2xl py-4 px-6 text-bark font-serif text-lg font-bold placeholder:text-bark/25 focus:ring-2 focus:ring-sage/20 focus:bg-white transition-all shadow-[inset_0_2px_4px_rgba(51,69,55,0.01)]"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Sữa, trứng, thịt..."
                />
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                disabled={isAddingItem || !newItemName.trim()}
                className="w-full py-4 bg-sage text-cream rounded-2xl font-extrabold uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50 touch-manipulation min-h-[48px] shadow-warm hover:bg-sage-deep transition-all duration-300 hover:shadow active:scale-[0.98]"
              >
                {isAddingItem ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Thêm vào danh sách'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

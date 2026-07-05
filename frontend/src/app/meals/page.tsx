'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  ArrowUpDown,
  Edit2,
  Trash2,
  X,
  Save,
  Loader2,
  Utensils,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { mealsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';

interface Meal {
  id: string;
  name: string;
  ingredients: string;
  created_at: string;
  updated_at: string;
}

const ITEMS_PER_PAGE = 18;

// Convert ingredients text to array of non-empty lines
function ingredientLinesFromText(ingredients?: string): string[] {
  if (!ingredients?.trim()) return [];
  return ingredients.split('\n').map((s) => s.trim()).filter(Boolean);
}

// Convert ingredients text to input fields array
function ingredientFieldsFromText(ingredients?: string): string[] {
  const lines = ingredientLinesFromText(ingredients);
  return lines.length > 0 ? lines : [''];
}

// Convert fields array to text block
function ingredientLinesToText(lines: string[]): string {
  return lines.map((line) => line.trim()).filter(Boolean).join('\n');
}

// Preview ingredient line highlights
function ingredientPreview(ingredients: string, max = 2) {
  const lines = ingredientLinesFromText(ingredients);
  if (lines.length === 0) return 'Chưa có nguyên liệu';
  if (lines.length <= max) return lines.join(' · ');
  return `${lines.slice(0, max).join(' · ')} +${lines.length - max} nguyên liệu khác`;
}

export default function MealsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [meals, setMeals] = useState<Meal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'created_at'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [formState, setFormState] = useState<Partial<Meal>>({});
  const [ingredientFields, setIngredientFields] = useState<string[]>(['']);

  const modalOpen = isAdding || selectedMeal !== null;

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const fetchMeals = useCallback(async () => {
    if (!user) return;
    setFetchLoading(true);
    try {
      const response = await mealsApi.getAll();
      if (response.data.success) setMeals(response.data.data.meals);
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (err.message !== 'Network Error') {
        setNotification({ type: 'error', message: 'Không thể tải danh sách món ăn' });
      }
    } finally {
      setFetchLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) fetchMeals();
  }, [fetchMeals, authLoading, user]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, sortOrder]);

  const filteredMeals = useMemo(() => {
    return meals
      .filter((meal) => meal.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
        if (sortBy === 'created_at') {
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [meals, searchQuery, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredMeals.length / ITEMS_PER_PAGE));
  const paginatedMeals = filteredMeals.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const closeModal = () => {
    setSelectedMeal(null);
    setIsAdding(false);
    setIsEditing(false);
    setFormState({});
    setIngredientFields(['']);
  };

  const openMeal = (meal: Meal) => {
    setSelectedMeal(meal);
    setIsAdding(false);
    setIsEditing(false);
    setFormState(meal);
    setIngredientFields(ingredientFieldsFromText(meal.ingredients));
  };

  const handleAddNew = () => {
    setIsAdding(true);
    setIsEditing(true);
    setSelectedMeal(null);
    setFormState({ name: '', ingredients: '' });
    setIngredientFields(['']);
  };

  const startEditingMeal = () => {
    if (!selectedMeal) return;
    setIsEditing(true);
    setIngredientFields(ingredientFieldsFromText(selectedMeal.ingredients));
  };

  const updateIngredientField = (index: number, value: string) => {
    setIngredientFields((prev) => prev.map((line, i) => (i === index ? value : line)));
  };

  const addIngredientField = () => {
    setIngredientFields((prev) => [...prev, '']);
  };

  const removeIngredientField = (index: number) => {
    setIngredientFields((prev) => {
      if (prev.length <= 1) return [''];
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSave = async () => {
    if (!formState.name?.trim()) {
      setNotification({ type: 'error', message: 'Vui lòng nhập tên món ăn' });
      return;
    }

    const payload = {
      name: formState.name.trim(),
      ingredients: ingredientLinesToText(ingredientFields),
    };

    setIsLoading(true);
    try {
      if (isAdding) {
        const response = await mealsApi.create(payload);
        if (response.data.success) {
          const newMeal = response.data.data.meal;
          setMeals([newMeal, ...meals]);
          setSelectedMeal(newMeal);
          setIsAdding(false);
          setIsEditing(false);
          setFormState(newMeal);
          setNotification({ type: 'success', message: 'Thêm món ăn mới thành công' });
        }
      } else {
        const response = await mealsApi.update(selectedMeal!.id, payload);
        if (response.data.success) {
          const updatedMeal = response.data.data.meal;
          setMeals(meals.map((m) => (m.id === updatedMeal.id ? updatedMeal : m)));
          setSelectedMeal(updatedMeal);
          setIsEditing(false);
          setFormState(updatedMeal);
          setNotification({ type: 'success', message: 'Cập nhật món ăn thành công' });
        }
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string }; status?: number }; message?: string };
      let errorMessage = 'Lỗi khi lưu món ăn';
      if (err.response?.data?.detail) errorMessage = err.response.data.detail;
      else if (err.response?.status === 409) errorMessage = 'Món ăn này đã tồn tại. Vui lòng dùng tên khác.';
      setNotification({ type: 'error', message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      await mealsApi.delete(id);
      setMeals(meals.filter((m) => m.id !== id));
      closeModal();
      setShowDeleteConfirm(null);
      setNotification({ type: 'success', message: 'Xóa món ăn thành công' });
    } catch {
      setNotification({ type: 'error', message: 'Không thể xóa món ăn' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (isAdding) {
      closeModal();
      return;
    }
    setIsEditing(false);
    setFormState(selectedMeal!);
    setIngredientFields(ingredientFieldsFromText(selectedMeal?.ingredients));
  };

  if (authLoading || (fetchLoading && meals.length === 0)) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-sage" />
          <p className="text-sm text-bark/60 font-medium">Đang tải thư viện món ăn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell animate-page-enter min-w-0 pb-12">
      {/* Page Header */}
      <header className="mb-6 sm:mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="page-title text-3xl sm:text-4xl md:text-5xl text-bark font-serif leading-tight font-black tracking-tight">
            Thư viện món ăn
          </h1>
          <p className="text-sm text-bark/50 font-medium mt-1">Lưu trữ công thức và thành phần nguyên liệu cho các bữa ăn</p>
        </div>
        <button
          type="button"
          onClick={handleAddNew}
          className="w-full sm:w-auto justify-center h-12 sm:h-14 px-6 sm:px-8 bg-sage text-cream rounded-2xl shadow-soft hover:shadow-warm flex items-center gap-3 hover:bg-sage-deep transition-all font-bold uppercase tracking-widest text-xs touch-manipulation min-h-[48px] active:scale-95 duration-200"
        >
          <Plus className="h-5 w-5 shrink-0" />
          Thêm món ăn
        </button>
      </header>

      {/* Filter Bento Box */}
      <div className="bg-cream/50 border border-bark/5 rounded-3xl p-5 sm:p-7 shadow-soft mb-6 sm:mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-bark/30 transition-colors duration-300" />
          <input
            type="text"
            placeholder="Tìm kiếm món ăn..."
            className="w-full bg-hemp/10 border-0 rounded-2xl py-4 pl-12 pr-4 text-bark placeholder:text-bark/25 focus:ring-2 focus:ring-sage/20 focus:bg-white/80 transition-all shadow-[inset_0_2px_4px_rgba(51,69,55,0.01)]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between pt-2.5 border-t border-bark/5">
          <button
            type="button"
            onClick={() => setSortBy(sortBy === 'name' ? 'created_at' : 'name')}
            className="flex items-center gap-2 text-[10px] font-extrabold text-bark/40 uppercase tracking-widest hover:text-bark transition-colors touch-manipulation group/sort"
          >
            <ArrowUpDown className="h-3 w-3 transition-transform group-hover/sort:rotate-180 duration-300" />
            Sắp xếp: {sortBy === 'name' ? 'Tên món' : 'Ngày tạo'}
          </button>
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="text-[10px] font-extrabold text-bark/40 uppercase tracking-widest hover:text-bark transition-colors touch-manipulation"
          >
            Thứ tự: {sortOrder === 'asc' ? 'A → Z' : 'Z → A'}
          </button>
        </div>
      </div>

      {/* Meals Grid */}
      {paginatedMeals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {paginatedMeals.map((meal) => (
            <button
              key={meal.id}
              type="button"
              onClick={() => openMeal(meal)}
              className="text-left bg-cream/40 border border-bark/5 hover:border-sage/20 hover:bg-cream/80 rounded-3xl p-5 sm:p-6 shadow-soft hover:shadow-warm active:scale-[0.99] hover:scale-[1.015] transition-all duration-300 ease-out touch-manipulation min-h-[135px] flex flex-col justify-between gap-3 group/card"
            >
              <div className="flex items-start gap-4 w-full">
                <div className="h-11 w-11 rounded-xl bg-hemp/30 flex items-center justify-center shrink-0 group-hover/card:bg-sage/10 transition-colors duration-300">
                  <Utensils className="h-5 w-5 text-sage-deep group-hover/card:scale-110 transition-transform duration-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-serif text-lg text-bark leading-snug font-bold tracking-tight truncate group-hover/card:text-sage-deep transition-colors duration-200">
                    {meal.name}
                  </h4>
                  <p className="text-xs text-bark/30 font-semibold uppercase tracking-wider mt-0.5">
                    Công thức
                  </p>
                </div>
              </div>
              <p className="text-sm text-bark/50 line-clamp-2 pl-1 font-medium">
                {ingredientPreview(meal.ingredients)}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center bg-cream/40 border border-bark/5 rounded-3xl shadow-soft">
          <Search className="h-8 w-8 text-bark/20 mx-auto mb-4" />
          <p className="text-bark/40 font-medium">Không tìm thấy món ăn nào</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-10">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="p-2.5 disabled:opacity-20 hover:bg-hemp/30 rounded-full transition-all hover:scale-105 active:scale-95 touch-manipulation border border-bark/5 bg-cream/30 disabled:pointer-events-none"
            aria-label="Trang trước"
          >
            <ChevronLeft className="h-5 w-5 text-bark/75" />
          </button>
          <span className="text-xs font-bold text-bark/40 tracking-widest">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="p-2.5 disabled:opacity-20 hover:bg-hemp/30 rounded-full transition-all hover:scale-105 active:scale-95 touch-manipulation border border-bark/5 bg-cream/30 disabled:pointer-events-none"
            aria-label="Trang sau"
          >
            <ChevronRight className="h-5 w-5 text-bark/75" />
          </button>
        </div>
      )}

      {/* Modal Details / Add / Edit */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-bark/30 backdrop-blur-sm transition-opacity duration-300"
            aria-label="Đóng"
            onClick={closeModal}
          />
          <div
            className="relative w-full sm:max-w-lg max-h-[min(92dvh,720px)] overflow-y-auto custom-scrollbar bg-cream/95 backdrop-blur-lg border border-bark/8 rounded-t-[2.5rem] sm:rounded-3xl p-6 sm:p-8 shadow-warm animate-scale-in pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6 gap-2 border-b border-bark/5 pb-3">
              <div className="min-w-0">
                <span className="text-[9px] font-black text-gold/80 tracking-widest uppercase">
                  Món ăn
                </span>
                <h3 className="text-xs font-extrabold text-bark/40 uppercase tracking-[0.15em] truncate mt-0.5">
                  {isAdding ? 'Thêm món mới' : isEditing ? 'Chỉnh sửa món ăn' : 'Chi tiết món ăn'}
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!isEditing && !isAdding && selectedMeal && (
                  <>
                    <button
                      type="button"
                      onClick={startEditingMeal}
                      className="p-2.5 bg-hemp/20 hover:bg-hemp/30 text-bark rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation min-h-[40px] min-w-[40px] flex items-center justify-center shadow-sm"
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(selectedMeal.id)}
                      className="p-2.5 bg-red-50 hover:bg-red-100/80 text-red-500 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation min-h-[40px] min-w-[40px] flex items-center justify-center shadow-sm"
                      title="Xóa món ăn"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={isEditing ? handleCancelEdit : closeModal}
                  className="p-2.5 bg-hemp/20 hover:bg-hemp/30 text-bark rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation min-h-[40px] min-w-[40px] flex items-center justify-center shadow-sm"
                  title="Hủy"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            {isEditing ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-bark/40 px-1">
                    Tên món ăn
                  </label>
                  <input
                    type="text"
                    className="w-full bg-hemp/10 border-0 rounded-2xl py-4 px-6 text-bark font-serif text-lg font-bold placeholder:text-bark/25 focus:ring-2 focus:ring-sage/20 focus:bg-white transition-all shadow-[inset_0_2px_4px_rgba(51,69,55,0.01)]"
                    value={formState.name || ''}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    placeholder="Nhập tên món ăn..."
                  />
                </div>
                <div className="space-y-3.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-bark/40 px-1">
                    Nguyên liệu chuẩn bị
                  </label>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1.5 custom-scrollbar">
                    {ingredientFields.map((value, index) => (
                      <div key={index} className="flex items-center gap-2 animate-scale-in">
                        <input
                          type="text"
                          className="flex-1 bg-hemp/10 border-0 rounded-xl py-3 px-5 text-sm text-bark placeholder:text-bark/25 focus:ring-2 focus:ring-sage/20 focus:bg-white transition-all"
                          value={value}
                          onChange={(e) => updateIngredientField(index, e.target.value)}
                          placeholder={`Nguyên liệu ${index + 1}`}
                        />
                        {ingredientFields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeIngredientField(index)}
                            className="p-3 text-bark/30 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 touch-manipulation min-h-[42px] min-w-[42px] flex items-center justify-center shrink-0"
                            aria-label="Xóa dòng"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addIngredientField}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-sage/10 border border-dashed border-sage/40 text-sage-deep rounded-xl text-[10px] font-extrabold uppercase tracking-widest shadow-soft hover:bg-sage/20 hover:border-sage transition-all duration-200 touch-manipulation min-h-[44px]"
                  >
                    <Plus className="h-4 w-4" />
                    Thêm nguyên liệu
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isLoading}
                  className="w-full py-4 bg-sage text-cream rounded-2xl font-extrabold uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50 touch-manipulation min-h-[48px] shadow-warm hover:bg-sage-deep transition-all duration-300 hover:shadow active:scale-[0.98]"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-5 w-5" /> Lưu lại</>}
                </button>
              </div>
            ) : selectedMeal ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif text-bark leading-tight font-black tracking-tight">{selectedMeal.name}</h2>
                  <p className="text-[10px] text-bark/30 font-semibold uppercase tracking-wider mt-1">Đã lưu trong thư viện</p>
                </div>
                
                <div className="space-y-3.5 border-t border-bark/5 pt-4">
                  <h4 className="text-xs font-bold text-bark uppercase tracking-[0.15em] flex items-center gap-2 mb-1">
                    <Utensils className="h-4 w-4 text-sage" /> Nguyên liệu chuẩn bị
                  </h4>
                  {ingredientLinesFromText(selectedMeal.ingredients).length > 0 ? (
                    <ul className="grid grid-cols-1 gap-2">
                      {ingredientLinesFromText(selectedMeal.ingredients).map((ing, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-3.5 p-3.5 bg-hemp/10 rounded-2xl text-sm text-bark/85 border border-bark/5 hover:border-sage/10 transition-colors duration-200"
                        >
                          <span className="h-2 w-2 rounded-full bg-sage shrink-0 shadow-sm" />
                          <span className="font-medium">{ing}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-bark/40 italic pl-1">Chưa có nguyên liệu nào được liệt kê.</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Notifications */}
      {notification && (
        <div
          role="alert"
          className={cn(
            'fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] sm:bottom-8 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 px-5 py-4 rounded-2xl shadow-warm flex items-center gap-3 z-[70] max-w-md mx-auto sm:mx-0 animate-scale-in border border-cream/10',
            notification.type === 'success' ? 'bg-sage text-cream' : 'bg-red-500 text-cream'
          )}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <span className="text-xs font-bold uppercase tracking-widest">{notification.message}</span>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-bark/30 backdrop-blur-sm z-[80] flex items-end sm:items-center justify-center p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] animate-fade-in">
          <div className="bg-cream rounded-[2rem] p-6 sm:p-8 max-w-sm w-full shadow-warm border border-bark/8 animate-scale-in">
            <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4 shadow-sm">
              <AlertCircle className="h-6 w-6 text-red-500 animate-pulse" />
            </div>
            <h3 className="text-2xl font-serif text-bark mb-2 font-bold tracking-tight">Xóa món ăn?</h3>
            <p className="text-sm text-bark/60 mb-6 font-medium leading-relaxed">Hành động này sẽ xóa món ăn vĩnh viễn và không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-3.5 bg-hemp/20 hover:bg-hemp/30 text-bark rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors duration-200 active:scale-95"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={isLoading}
                className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-cream rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all duration-200 shadow-sm hover:shadow active:scale-95 disabled:opacity-50 flex items-center justify-center min-h-[44px]"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Xóa món'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

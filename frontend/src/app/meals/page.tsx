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
  category?: string;
  created_at: string;
  updated_at: string;
}

const ITEMS_PER_PAGE = 18;
const DEFAULT_CATEGORY = 'other';

function ingredientPreview(ingredients: string, max = 2) {
  const lines = ingredients.split('\n').map((s) => s.trim()).filter(Boolean);
  if (lines.length === 0) return 'No ingredients listed';
  if (lines.length <= max) return lines.join(' · ');
  return `${lines.slice(0, max).join(' · ')} +${lines.length - max} more`;
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
  };

  const openMeal = (meal: Meal) => {
    setSelectedMeal(meal);
    setIsAdding(false);
    setIsEditing(false);
    setFormState(meal);
  };

  const handleAddNew = () => {
    setIsAdding(true);
    setIsEditing(true);
    setSelectedMeal(null);
    setFormState({ name: '', ingredients: '' });
  };

  const handleSave = async () => {
    if (!formState.name?.trim()) {
      setNotification({ type: 'error', message: 'Tên món ăn là bắt buộc' });
      return;
    }

    const payload = {
      name: formState.name.trim(),
      ingredients: formState.ingredients || '',
      category: formState.category || DEFAULT_CATEGORY,
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
          setNotification({ type: 'success', message: 'Đã thêm món ăn mới thành công' });
        }
      } else {
        const response = await mealsApi.update(selectedMeal!.id, payload);
        if (response.data.success) {
          const updatedMeal = response.data.data.meal;
          setMeals(meals.map((m) => (m.id === updatedMeal.id ? updatedMeal : m)));
          setSelectedMeal(updatedMeal);
          setIsEditing(false);
          setFormState(updatedMeal);
          setNotification({ type: 'success', message: 'Đã cập nhật món ăn thành công' });
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
      setNotification({ type: 'success', message: 'Đã xóa món ăn thành công' });
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
  };

  if (authLoading || (fetchLoading && meals.length === 0)) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sage" />
      </div>
    );
  }

  return (
    <div className="page-shell animate-page-enter min-w-0">
      <header className="mb-6 sm:mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <span className="text-[10px] font-bold text-bark/40 uppercase tracking-[0.3em] sm:tracking-[0.4em] block mb-2">
            Library
          </span>
          <h1 className="text-2xl sm:text-4xl text-bark font-serif">Meals</h1>
        </div>
        <button
          type="button"
          onClick={handleAddNew}
          className="w-full sm:w-auto justify-center h-12 sm:h-14 px-6 sm:px-8 bg-sage text-cream rounded-2xl shadow-warm flex items-center gap-3 hover:bg-sage-deep transition-all font-bold uppercase tracking-widest text-xs touch-manipulation min-h-[48px]"
        >
          <Plus className="h-5 w-5 shrink-0" />
          Add meal
        </button>
      </header>

      <div className="bg-cream rounded-[1.75rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-soft mb-6 sm:mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-bark/30" />
          <input
            type="text"
            placeholder="Search meals..."
            className="w-full bg-hemp/10 border-0 rounded-2xl py-4 pl-12 pr-4 text-bark placeholder:text-bark/20 focus:ring-2 focus:ring-sage/20 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-bark/5">
          <button
            type="button"
            onClick={() => setSortBy(sortBy === 'name' ? 'created_at' : 'name')}
            className="flex items-center gap-2 text-[10px] font-bold text-bark/40 uppercase tracking-widest hover:text-bark transition-colors touch-manipulation"
          >
            <ArrowUpDown className="h-3 w-3" />
            Sort: {sortBy === 'name' ? 'Name' : 'Date'}
          </button>
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="text-[10px] font-bold text-bark/40 uppercase tracking-widest hover:text-bark transition-colors touch-manipulation"
          >
            {sortOrder === 'asc' ? 'A → Z' : 'Z → A'}
          </button>
        </div>
      </div>

      {paginatedMeals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {paginatedMeals.map((meal) => (
            <button
              key={meal.id}
              type="button"
              onClick={() => openMeal(meal)}
              className="text-left bg-cream rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6 shadow-soft hover:shadow-warm active:scale-[0.99] transition-all touch-manipulation min-h-[120px] flex flex-col gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-xl bg-hemp/30 flex items-center justify-center shrink-0">
                  <Utensils className="h-5 w-5 text-sage-deep" />
                </div>
                <h4 className="font-serif text-lg text-bark leading-snug flex-1">{meal.name}</h4>
              </div>
              <p className="text-sm text-bark/50 line-clamp-2">{ingredientPreview(meal.ingredients)}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center bg-cream rounded-[2rem] shadow-soft">
          <Search className="h-8 w-8 text-bark/20 mx-auto mb-4" />
          <p className="text-bark/40 font-medium">No meals found</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="p-2 disabled:opacity-20 hover:bg-hemp/20 rounded-full transition-colors touch-manipulation"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-xs font-bold text-bark/40">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="p-2 disabled:opacity-20 hover:bg-hemp/20 rounded-full transition-colors touch-manipulation"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-bark/40 backdrop-blur-sm"
            aria-label="Close"
            onClick={closeModal}
          />
          <div
            className="relative w-full sm:max-w-lg max-h-[min(92dvh,720px)] overflow-y-auto custom-scrollbar bg-cream rounded-t-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-warm animate-page-enter pb-[env(safe-area-inset-bottom)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6 gap-2">
              <h3 className="text-xs font-bold text-bark uppercase tracking-[0.2em] truncate">
                {isAdding ? 'New meal' : isEditing ? 'Edit meal' : 'Meal details'}
              </h3>
              <div className="flex items-center gap-2 shrink-0">
                {!isEditing && !isAdding && selectedMeal && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="p-3 bg-hemp/20 text-bark hover:bg-hemp/30 rounded-xl touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(selectedMeal.id)}
                      className="p-3 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={isEditing ? handleCancelEdit : closeModal}
                  className="p-3 bg-hemp/20 text-bark hover:bg-hemp/30 rounded-xl touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-bark/40 px-2">
                    Name
                  </label>
                  <input
                    type="text"
                    className="w-full bg-hemp/10 border-0 rounded-2xl py-4 px-6 text-bark font-serif text-lg focus:ring-2 focus:ring-sage/20"
                    value={formState.name || ''}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    placeholder="Meal name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-bark/40 px-2">
                    Ingredients (one per line)
                  </label>
                  <textarea
                    rows={6}
                    className="w-full bg-hemp/10 border-0 rounded-2xl py-4 px-6 text-bark focus:ring-2 focus:ring-sage/20 resize-none"
                    value={formState.ingredients || ''}
                    onChange={(e) => setFormState({ ...formState, ingredients: e.target.value })}
                    placeholder={'Beef\nOnion'}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isLoading}
                  className="w-full py-4 bg-sage text-cream rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50 touch-manipulation min-h-[48px]"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-5 w-5" /> Save</>}
                </button>
              </div>
            ) : selectedMeal ? (
              <div className="space-y-6">
                <h2 className="text-2xl sm:text-3xl font-serif text-bark leading-tight">{selectedMeal.name}</h2>
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-bark uppercase tracking-[0.2em] flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-sage" /> Ingredients
                  </h4>
                  {selectedMeal.ingredients ? (
                    <ul className="space-y-2">
                      {selectedMeal.ingredients
                        .split('\n')
                        .filter(Boolean)
                        .map((ing, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-3 p-3 bg-hemp/10 rounded-xl text-sm text-bark/80"
                          >
                            <span className="h-2 w-2 rounded-full bg-sage/40 shrink-0" />
                            {ing}
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-bark/40 italic">No ingredients listed.</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {notification && (
        <div
          className={cn(
            'fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] sm:bottom-8 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 px-6 py-4 rounded-2xl shadow-warm flex items-center gap-3 z-[70] max-w-md mx-auto sm:mx-0',
            notification.type === 'success' ? 'bg-sage text-cream' : 'bg-red-500 text-white'
          )}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span className="text-sm font-bold uppercase tracking-widest">{notification.message}</span>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-bark/30 backdrop-blur-sm z-[80] flex items-end sm:items-center justify-center p-4 pb-[env(safe-area-inset-bottom)]">
          <div className="bg-cream rounded-t-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 max-w-sm w-full shadow-warm">
            <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
            <h3 className="text-2xl font-serif text-bark mb-4">Delete meal?</h3>
            <p className="text-bark/60 mb-8">This cannot be undone.</p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-4 bg-hemp/20 text-bark rounded-2xl font-bold uppercase tracking-widest text-[10px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={isLoading}
                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Plus, Search, ArrowUpDown, MoreVertical, Edit2, Trash2, 
  X, Save, Loader2, Utensils, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { mealsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';

// Types
interface Meal {
  id: string;
  name: string;
  ingredients: string; // Backend returns string with newlines
  category: 'japanese' | 'western' | 'chinese' | 'other';
  created_at: string;
  updated_at: string;
}

const ITEMS_PER_PAGE = 15;

interface MealDetailPanelProps {
  isAdding: boolean;
  isEditing: boolean;
  selectedMeal: Meal | null;
  formState: Partial<Meal>;
  isLoading: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onCancel: () => void;
  onSave: () => void;
  onClose?: () => void;
  setFormState: (state: Partial<Meal>) => void;
}

function MealDetailPanel({
  isAdding,
  isEditing,
  selectedMeal,
  formState,
  isLoading,
  onEdit,
  onDelete,
  onCancel,
  onSave,
  onClose,
  setFormState,
}: MealDetailPanelProps) {
  return (
    <div className="bg-cream rounded-t-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 md:p-10 shadow-soft animate-page-enter">
      <div className="flex items-center justify-between mb-6 sm:mb-8 gap-2">
        <h3 className="text-xs font-bold text-bark uppercase tracking-[0.2em] sm:tracking-[0.3em] min-w-0 truncate">
          {isAdding ? 'Thêm món ăn mới' : isEditing ? 'Chỉnh sửa món ăn' : 'Chi tiết món ăn'}
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          {!isEditing ? (
            <>
              <button type="button" onClick={onEdit} className="p-3 bg-hemp/20 text-bark hover:bg-hemp/30 rounded-xl transition-all touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center">
                <Edit2 className="h-4 w-4" />
              </button>
              <button type="button" onClick={onDelete} className="p-3 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-all touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center">
                <Trash2 className="h-4 w-4" />
              </button>
              {onClose && (
                <button type="button" onClick={onClose} className="lg:hidden p-3 bg-hemp/20 text-bark hover:bg-hemp/30 rounded-xl transition-all touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <X className="h-4 w-4" />
                </button>
              )}
            </>
          ) : (
            <button type="button" onClick={onCancel} className="p-3 bg-hemp/20 text-bark hover:bg-hemp/30 rounded-xl transition-all touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-6 sm:space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-bark/40 px-2">Tên món ăn</label>
            <input
              type="text"
              className="w-full bg-hemp/10 border-0 rounded-2xl py-3.5 sm:py-4 px-6 text-bark font-serif text-lg sm:text-xl focus:ring-2 focus:ring-sage/20 transition-all"
              value={formState.name || ''}
              onChange={(e) => setFormState({ ...formState, name: e.target.value })}
              placeholder="Nhập tên món ăn..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-bark/40 px-2">Phân loại</label>
            <select
              className="w-full bg-hemp/10 border-0 rounded-2xl py-3.5 sm:py-4 px-6 text-bark focus:ring-2 focus:ring-sage/20 transition-all appearance-none"
              value={formState.category || 'other'}
              onChange={(e) => setFormState({ ...formState, category: e.target.value as Meal['category'] })}
            >
              <option value="japanese">Japanese</option>
              <option value="western">Western</option>
              <option value="chinese">Chinese</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-bark/40 px-2">Nguyên liệu (mỗi dòng một mục)</label>
            <textarea
              rows={6}
              className="w-full bg-hemp/10 border-0 rounded-2xl py-4 px-6 text-bark focus:ring-2 focus:ring-sage/20 transition-all resize-none"
              value={formState.ingredients || ''}
              onChange={(e) => setFormState({ ...formState, ingredients: e.target.value })}
              placeholder={'Ví dụ:\nThịt bò\nHành tây'}
            />
          </div>
          <button
            type="button"
            onClick={onSave}
            disabled={isLoading}
            className="w-full py-4 sm:py-5 bg-sage text-cream rounded-[1.5rem] font-bold uppercase tracking-widest text-xs shadow-warm hover:bg-sage-deep transition-all flex items-center justify-center gap-3 touch-manipulation min-h-[48px]"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-5 w-5" /> Lưu món ăn</>}
          </button>
        </div>
      ) : selectedMeal ? (
        <div className="space-y-8 sm:space-y-10 animate-page-enter">
          <div>
            <span className="inline-block px-4 py-1.5 bg-sage/10 text-sage-deep rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
              {selectedMeal.category}
            </span>
            <h2 className="text-2xl sm:text-4xl md:text-5xl text-bark font-serif leading-tight">{selectedMeal.name}</h2>
          </div>
          <div className="space-y-4 sm:space-y-6">
            <h4 className="text-xs font-bold text-bark uppercase tracking-[0.2em] flex items-center gap-2">
              <Utensils className="h-4 w-4 text-sage" /> Nguyên liệu
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedMeal.ingredients ? (
                selectedMeal.ingredients.split('\n').filter(Boolean).map((ing, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 sm:p-4 bg-hemp/5 rounded-2xl border border-bark/5">
                    <div className="h-2 w-2 rounded-full bg-sage/40 shrink-0" />
                    <span className="text-sm font-medium text-bark/80">{ing}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-bark/40 italic px-2">Chưa có nguyên liệu nào được liệt kê.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function MealsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [meals, setMeals] = useState<Meal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created_at'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Form State
  const [formState, setFormState] = useState<Partial<Meal>>({});

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchMeals = useCallback(async () => {
    if (!user) return;
    setFetchLoading(true);
    try {
      const response = await mealsApi.getAll();
      if (response.data.success) {
        setMeals(response.data.data.meals);
      }
    } catch (error: any) {
      if (error.message !== 'Network Error') {
        console.error('Failed to fetch meals:', error);
        setNotification({ type: 'error', message: 'Không thể tải danh sách món ăn' });
      }
    } finally {
      setFetchLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchMeals();
    }
  }, [fetchMeals, authLoading, user]);

  // Reset form when selection changes
  useEffect(() => {
    if (selectedMeal) {
      setFormState(selectedMeal);
      setIsEditing(false);
      setIsAdding(false);
    }
  }, [selectedMeal]);

  // Handle Notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Logic: Filtering, Sorting, Pagination
  const filteredMeals = useMemo(() => {
    return meals
      .filter(meal => {
        const matchesSearch = meal.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterCategory === 'all' || meal.category === filterCategory;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
        if (sortBy === 'created_at') comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [meals, searchQuery, filterCategory, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredMeals.length / ITEMS_PER_PAGE);
  const paginatedMeals = filteredMeals.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // CRUD Actions
  const handleAddNew = () => {
    setIsAdding(true);
    setIsEditing(true);
    setSelectedMeal(null);
    setFormState({
      name: '',
      ingredients: '',
      category: 'other'
    });
  };

  const handleSave = async () => {
    if (!formState.name) {
      setNotification({ type: 'error', message: 'Tên món ăn là bắt buộc' });
      return;
    }

    setIsLoading(true);
    try {
      if (isAdding) {
        const response = await mealsApi.create(formState);
        if (response.data.success) {
          const newMeal = response.data.data.meal;
          setMeals([newMeal, ...meals]);
          setSelectedMeal(newMeal);
          setNotification({ type: 'success', message: 'Đã thêm món ăn mới thành công' });
        }
      } else {
        const response = await mealsApi.update(selectedMeal!.id, formState);
        if (response.data.success) {
          const updatedMeal = response.data.data.meal;
          setMeals(meals.map(m => m.id === updatedMeal.id ? updatedMeal : m));
          setSelectedMeal(updatedMeal);
          setNotification({ type: 'success', message: 'Đã cập nhật món ăn thành công' });
        }
      }
      setIsEditing(false);
      setIsAdding(false);
    } catch (error: any) {
      console.error('Failed to save meal:', error);
      // Extract error message from backend response
      let errorMessage = 'Lỗi khi lưu món ăn';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.status === 409) {
        errorMessage = 'Món ăn này đã tồn tại. Vui lòng dùng tên khác.';
      }
      setNotification({ type: 'error', message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      await mealsApi.delete(id);
      setMeals(meals.filter(m => m.id !== id));
      if (selectedMeal?.id === id) setSelectedMeal(null);
      setShowDeleteConfirm(null);
      setNotification({ type: 'success', message: 'Đã xóa món ăn thành công' });
    } catch (error) {
      console.error('Failed to delete meal:', error);
      setNotification({ type: 'error', message: 'Không thể xóa món ăn' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (isAdding) {
      setIsAdding(false);
      setIsEditing(false);
      setSelectedMeal(null);
    } else {
      setIsEditing(false);
      setFormState(selectedMeal!);
    }
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
          <h1 className="text-2xl sm:text-4xl text-bark font-serif">Meals Database</h1>
        </div>
        <button
          type="button"
          onClick={handleAddNew}
          className="w-full sm:w-auto justify-center h-12 sm:h-14 px-6 sm:px-8 bg-sage text-cream rounded-2xl shadow-warm flex items-center gap-3 hover:bg-sage-deep transition-all font-bold uppercase tracking-widest text-xs touch-manipulation min-h-[48px]"
        >
          <Plus className="h-5 w-5 shrink-0" />
          Add New Meal
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 items-start">
        <div className="lg:col-span-5 flex flex-col gap-6 min-w-0">
          <div className="bg-cream rounded-[1.75rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-soft space-y-4 sm:space-y-6">
            {/* Search and Filters */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-bark/30" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm món ăn..."
                  className="w-full bg-hemp/10 border-0 rounded-2xl py-4 pl-12 pr-4 text-bark placeholder:text-bark/20 focus:ring-2 focus:ring-sage/20 transition-all"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {['all', 'japanese', 'western', 'chinese', 'other'].map(category => (
                  <button
                    key={category}
                    onClick={() => setFilterCategory(category)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                      filterCategory === category 
                        ? "bg-sage text-cream shadow-soft" 
                        : "bg-hemp/20 text-bark/40 hover:bg-hemp/30"
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-bark/5">
                <button 
                  onClick={() => setSortBy(sortBy === 'name' ? 'created_at' : 'name')}
                  className="flex items-center gap-2 text-[10px] font-bold text-bark/40 uppercase tracking-widest hover:text-bark transition-colors"
                >
                  <ArrowUpDown className="h-3 w-3" />
                  Sort: {sortBy === 'name' ? 'Name' : 'Date'}
                </button>
                <button 
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="text-[10px] font-bold text-bark/40 uppercase tracking-widest hover:text-bark transition-colors"
                >
                  {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                </button>
              </div>
            </div>

            {/* Meals List */}
            <div className="space-y-3 max-h-[50vh] sm:max-h-[600px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
              {paginatedMeals.length > 0 ? (
                paginatedMeals.map((meal) => (
                  <div 
                    key={meal.id}
                    onClick={() => setSelectedMeal(meal)}
                    className={cn(
                      "group flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border border-transparent",
                      selectedMeal?.id === meal.id 
                        ? "bg-sage/10 border-sage/20" 
                        : "bg-hemp/10 hover:bg-hemp/20"
                    )}
                  >
                    <div className="h-12 w-12 rounded-xl bg-hemp/30 flex items-center justify-center shrink-0">
                      <Utensils className={cn(
                        "h-5 w-5 transition-colors",
                        selectedMeal?.id === meal.id ? "text-sage-deep" : "text-bark/40"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-bark truncate">{meal.name}</h4>
                      <p className="text-[10px] font-bold text-bark/40 uppercase tracking-widest">{meal.category}</p>
                    </div>
                    <button type="button" className="sm:opacity-0 sm:group-hover:opacity-100 p-2 hover:bg-bark/5 rounded-lg transition-all touch-manipulation" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="h-4 w-4 text-bark/40" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center">
                  <div className="h-16 w-16 bg-hemp/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-6 w-6 text-bark/20" />
                  </div>
                  <p className="text-bark/40 font-medium">Không tìm thấy món ăn nào</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4 border-t border-bark/5">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="p-2 disabled:opacity-20 hover:bg-hemp/20 rounded-full transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-xs font-bold text-bark/40">{currentPage} / {totalPages}</span>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-2 disabled:opacity-20 hover:bg-hemp/20 rounded-full transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:block lg:col-span-7 sticky top-8">
          {selectedMeal || isAdding ? (
            <MealDetailPanel
              isAdding={isAdding}
              isEditing={isEditing}
              selectedMeal={selectedMeal}
              formState={formState}
              isLoading={isLoading}
              onEdit={() => setIsEditing(true)}
              onDelete={() => setShowDeleteConfirm(selectedMeal!.id)}
              onCancel={handleCancel}
              onSave={handleSave}
              setFormState={setFormState}
            />
          ) : (
            <div className="h-[600px] border-2 border-dashed border-bark/5 rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center bg-cream/30">
              <div className="h-24 w-24 bg-hemp/10 rounded-full flex items-center justify-center mb-6">
                <Utensils className="h-10 w-10 text-bark/20" />
              </div>
              <h3 className="text-xl font-serif text-bark mb-2">Chọn một món ăn</h3>
              <p className="text-bark/40 max-w-xs">Chọn một món ăn từ danh sách để xem chi tiết hoặc tạo món mới.</p>
            </div>
          )}
        </div>
      </div>

      {(selectedMeal || isAdding) && (
        <div
          className="lg:hidden fixed inset-0 bg-bark/30 backdrop-blur-sm z-50 flex items-end justify-center p-0"
          onClick={() => {
            setSelectedMeal(null);
            setIsAdding(false);
            setIsEditing(false);
          }}
        >
          <div
            className="w-full max-h-[min(92dvh,720px)] overflow-y-auto custom-scrollbar pb-[env(safe-area-inset-bottom)]"
            onClick={(e) => e.stopPropagation()}
          >
            <MealDetailPanel
              isAdding={isAdding}
              isEditing={isEditing}
              selectedMeal={selectedMeal}
              formState={formState}
              isLoading={isLoading}
              onEdit={() => setIsEditing(true)}
              onDelete={() => setShowDeleteConfirm(selectedMeal!.id)}
              onCancel={handleCancel}
              onSave={handleSave}
              onClose={() => {
                setSelectedMeal(null);
                setIsAdding(false);
                setIsEditing(false);
              }}
              setFormState={setFormState}
            />
          </div>
        </div>
      )}

      {/* Notifications */}
      {notification && (
        <div className={cn(
          "fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] sm:bottom-8 left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 px-4 sm:px-8 py-3 sm:py-4 rounded-2xl shadow-warm flex items-center gap-3 animate-slide-up z-[70] max-w-md sm:max-w-none mx-auto sm:mx-0",
          notification.type === 'success' ? "bg-sage text-cream" : "bg-red-500 text-white"
        )}>
          {notification.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span className="text-sm font-bold uppercase tracking-widest">{notification.message}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-bark/30 backdrop-blur-sm z-[80] flex items-end sm:items-center justify-center p-4 pb-[env(safe-area-inset-bottom)]">
          <div className="bg-cream rounded-t-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 max-w-sm w-full shadow-warm animate-scale-in">
            <div className="h-16 w-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-serif text-bark mb-4">Xác nhận xóa?</h3>
            <p className="text-bark/60 mb-8 leading-relaxed">Hành động này không thể hoàn tác. Món ăn này sẽ bị xóa vĩnh viễn khỏi thư viện.</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-4 bg-hemp/20 text-bark rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-hemp/30 transition-all"
              >
                Hủy
              </button>
              <button 
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={isLoading}
                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-red-600 shadow-soft transition-all"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Xóa ngay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

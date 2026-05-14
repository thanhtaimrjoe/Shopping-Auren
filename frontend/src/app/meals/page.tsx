'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Search, Filter, ArrowUpDown, MoreVertical, Edit2, Trash2, 
  X, Save, ChevronLeft, ChevronRight, Clock, Flame, Info, CheckCircle2,
  AlertCircle, Loader2, Utensils
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types
interface Meal {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner';
  suggestedTime: string;
  ingredients: string[];
  calories: number;
  notes: string;
  createdAt: string;
}

// Initial Mock Data
const INITIAL_MEALS: Meal[] = [
  { 
    id: '1', name: 'Oatmeal with Berries', type: 'breakfast', suggestedTime: '08:00', 
    ingredients: ['Oats', 'Blueberries', 'Honey', 'Milk'], calories: 350, notes: 'Good for energy.',
    createdAt: '2024-05-10T08:00:00Z'
  },
  { 
    id: '2', name: 'Avocado Toast', type: 'breakfast', suggestedTime: '09:00', 
    ingredients: ['Sourdough', 'Avocado', 'Egg', 'Chili Flakes'], calories: 420, notes: 'Protein rich.',
    createdAt: '2024-05-10T09:00:00Z'
  },
  { 
    id: '3', name: 'Grilled Chicken Salad', type: 'lunch', suggestedTime: '12:30', 
    ingredients: ['Chicken Breast', 'Kale', 'Cherry Tomatoes', 'Cucumber'], calories: 550, notes: 'Light lunch.',
    createdAt: '2024-05-11T12:30:00Z'
  },
  { 
    id: '4', name: 'Beef Stir-fry', type: 'dinner', suggestedTime: '19:00', 
    ingredients: ['Beef Strips', 'Broccoli', 'Bell Peppers', 'Soy Sauce', 'Ginger'], calories: 720, notes: 'Fast dinner.',
    createdAt: '2024-05-12T19:00:00Z'
  },
  { 
    id: '5', name: 'Mushroom Risotto', type: 'dinner', suggestedTime: '20:00', 
    ingredients: ['Arborio Rice', 'Mushrooms', 'Parmesan', 'White Wine'], calories: 650, notes: 'Comfort food.',
    createdAt: '2024-05-13T20:00:00Z'
  },
];

const ITEMS_PER_PAGE = 15;

export default function MealsPage() {
  const [meals, setMeals] = useState<Meal[]>(INITIAL_MEALS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'calories' | 'time' | 'name'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Form State
  const [formState, setFormState] = useState<Partial<Meal>>({});

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
        const matchesFilter = filterType === 'all' || meal.type === filterType;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'calories') comparison = a.calories - b.calories;
        if (sortBy === 'time') comparison = a.suggestedTime.localeCompare(b.suggestedTime);
        if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [meals, searchQuery, filterType, sortBy, sortOrder]);

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
      type: 'lunch',
      suggestedTime: '12:00',
      ingredients: [],
      calories: 0,
      notes: ''
    });
  };

  const handleSave = async () => {
    if (!formState.name) {
      setNotification({ type: 'error', message: 'Tên món ăn là bắt buộc' });
      return;
    }

    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    if (isAdding) {
      const newMeal: Meal = {
        ...formState as Meal,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
      };
      setMeals([newMeal, ...meals]);
      setSelectedMeal(newMeal);
      setNotification({ type: 'success', message: 'Đã thêm món ăn mới thành công' });
    } else {
      setMeals(meals.map(m => m.id === formState.id ? (formState as Meal) : m));
      setSelectedMeal(formState as Meal);
      setNotification({ type: 'success', message: 'Đã cập nhật món ăn thành công' });
    }

    setIsEditing(false);
    setIsAdding(false);
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setMeals(meals.filter(m => m.id !== id));
    if (selectedMeal?.id === id) setSelectedMeal(null);
    setShowDeleteConfirm(null);
    setNotification({ type: 'success', message: 'Đã xóa món ăn thành công' });
    setIsLoading(false);
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

  return (
    <div className="pb-24 animate-page-enter">
      {/* Header Toolbar */}
      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-bold text-bark/40 uppercase tracking-[0.4em] block mb-2">
            Library
          </span>
          <h1 className="text-4xl text-bark font-serif">Meals Database</h1>
        </div>
        <button 
          onClick={handleAddNew}
          className="h-14 px-8 bg-sage text-cream rounded-2xl shadow-warm flex items-center gap-3 hover:bg-sage-deep hover:-translate-y-0.5 active:translate-y-0 transition-all group font-bold uppercase tracking-widest text-xs"
        >
          <Plus className="h-5 w-5" />
          Add New Meal
        </button>
      </header>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Search & List */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-cream rounded-[2.5rem] p-8 shadow-soft space-y-6">
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
                {['all', 'breakfast', 'lunch', 'dinner'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                      filterType === type 
                        ? "bg-sage text-cream shadow-soft" 
                        : "bg-hemp/20 text-bark/40 hover:bg-hemp/30"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-bark/5">
                <button 
                  onClick={() => {
                    const nextSort = sortBy === 'calories' ? 'time' : sortBy === 'time' ? 'name' : 'calories';
                    setSortBy(nextSort);
                  }}
                  className="flex items-center gap-2 text-[10px] font-bold text-bark/40 uppercase tracking-widest hover:text-bark transition-colors"
                >
                  <ArrowUpDown className="h-3 w-3" />
                  Sort by: {sortBy}
                </button>
                <button 
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="text-[10px] font-bold text-bark/40 uppercase tracking-widest hover:text-bark transition-colors"
                >
                  {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                </button>
              </div>
            </div>

            {/* Meals List */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {paginatedMeals.length > 0 ? (
                paginatedMeals.map((meal) => (
                  <div 
                    key={meal.id}
                    onClick={() => setSelectedMeal(meal)}
                    className={cn(
                      "group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border border-transparent",
                      selectedMeal?.id === meal.id 
                        ? "bg-sage/10 border-sage/20" 
                        : "bg-hemp/10 hover:bg-hemp/20"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-bark truncate">{meal.name}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter",
                          meal.type === 'breakfast' ? "bg-amber-100 text-amber-700" :
                          meal.type === 'lunch' ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                        )}>
                          {meal.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-bark/40">
                        <span className="flex items-center gap-1"><Flame className="h-3 w-3" /> {meal.calories} kcal</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {meal.suggestedTime}</span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(meal.id);
                      }}
                      className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Utensils className="h-12 w-12 text-bark/5 mx-auto mb-4" />
                  <p className="text-sm text-bark/20 italic">No meals found in database</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-bark/5">
                <span className="text-[10px] font-bold text-bark/40 uppercase tracking-widest">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="p-2 bg-hemp/20 rounded-xl disabled:opacity-30 hover:bg-hemp/30 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="p-2 bg-hemp/20 rounded-xl disabled:opacity-30 hover:bg-hemp/30 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Detail / Edit Form */}
        <div className="lg:col-span-7">
          {(selectedMeal || isAdding) ? (
            <div className="bg-cream rounded-[2.5rem] shadow-soft overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Form Header */}
              <div className="p-8 border-b border-bark/5 flex items-center justify-between bg-hemp/5">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-sage/20 flex items-center justify-center text-sage-deep">
                    <Utensils className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl text-bark font-serif">
                      {isAdding ? 'New Meal' : isEditing ? 'Edit Meal' : 'Meal Details'}
                    </h2>
                    <p className="text-xs text-bark/40 uppercase tracking-widest mt-1">
                      {isAdding ? 'Thêm mới vào thư viện' : `ID: ${formState.id?.substr(0, 8)}`}
                    </p>
                  </div>
                </div>
                {!isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="h-12 px-6 bg-cream border border-bark/10 rounded-xl flex items-center gap-2 hover:bg-bark/5 transition-all font-bold text-xs uppercase tracking-widest"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </button>
                )}
              </div>

              {/* Form Body */}
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-bark/40 uppercase tracking-[0.2em] ml-2">Meal Name</label>
                    <input 
                      disabled={!isEditing}
                      type="text"
                      className="w-full bg-hemp/10 border-0 rounded-2xl py-4 px-6 text-bark placeholder:text-bark/20 focus:ring-2 focus:ring-sage/20 transition-all disabled:opacity-60"
                      value={formState.name || ''}
                      onChange={e => setFormState({...formState, name: e.target.value})}
                      placeholder="e.g. Traditional Banh Mi"
                    />
                  </div>

                  {/* Type */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-bark/40 uppercase tracking-[0.2em] ml-2">Meal Type</label>
                    <select 
                      disabled={!isEditing}
                      className="w-full bg-hemp/10 border-0 rounded-2xl py-4 px-6 text-bark focus:ring-2 focus:ring-sage/20 transition-all disabled:opacity-60 appearance-none"
                      value={formState.type}
                      onChange={e => setFormState({...formState, type: e.target.value as Meal['type']})}
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                    </select>
                  </div>

                  {/* Calories */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-bark/40 uppercase tracking-[0.2em] ml-2">Calories (kcal)</label>
                    <div className="relative">
                      <Flame className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-bark/20" />
                      <input 
                        disabled={!isEditing}
                        type="number"
                        className="w-full bg-hemp/10 border-0 rounded-2xl py-4 pl-14 pr-6 text-bark placeholder:text-bark/20 focus:ring-2 focus:ring-sage/20 transition-all disabled:opacity-60"
                        value={formState.calories || 0}
                        onChange={e => setFormState({...formState, calories: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  </div>

                  {/* Suggested Time */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-bark/40 uppercase tracking-[0.2em] ml-2">Suggested Time</label>
                    <div className="relative">
                      <Clock className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-bark/20" />
                      <input 
                        disabled={!isEditing}
                        type="time"
                        className="w-full bg-hemp/10 border-0 rounded-2xl py-4 pl-14 pr-6 text-bark focus:ring-2 focus:ring-sage/20 transition-all disabled:opacity-60"
                        value={formState.suggestedTime || '12:00'}
                        onChange={e => setFormState({...formState, suggestedTime: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Ingredients */}
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-bark/40 uppercase tracking-[0.2em] ml-2">Ingredients</label>
                  <div className="flex flex-wrap gap-2">
                    {formState.ingredients?.map((ing, idx) => (
                      <span key={idx} className="px-4 py-2 bg-sage/10 text-sage-deep rounded-xl text-xs font-medium flex items-center gap-2">
                        {ing}
                        {isEditing && (
                          <button 
                            onClick={() => setFormState({
                              ...formState, 
                              ingredients: formState.ingredients?.filter((_, i) => i !== idx)
                            })}
                            className="hover:text-bark transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    ))}
                    {isEditing && (
                      <button 
                        onClick={() => {
                          const name = window.prompt('Nhập nguyên liệu mới:');
                          if (name) setFormState({...formState, ingredients: [...(formState.ingredients || []), name]});
                        }}
                        className="px-4 py-2 border-2 border-dashed border-bark/10 rounded-xl text-xs text-bark/40 hover:border-sage/40 hover:text-sage transition-all"
                      >
                        + Add Ingredient
                      </button>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-bark/40 uppercase tracking-[0.2em] ml-2">Notes</label>
                  <textarea 
                    disabled={!isEditing}
                    rows={4}
                    className="w-full bg-hemp/10 border-0 rounded-3xl py-4 px-6 text-bark placeholder:text-bark/20 focus:ring-2 focus:ring-sage/20 transition-all disabled:opacity-60 resize-none"
                    value={formState.notes || ''}
                    onChange={e => setFormState({...formState, notes: e.target.value})}
                    placeholder="Add any special instructions or health notes..."
                  />
                </div>
              </div>

              {/* Form Footer */}
              {isEditing && (
                <div className="p-8 bg-hemp/5 border-t border-bark/5 flex items-center justify-end gap-4">
                  <button 
                    onClick={handleCancel}
                    className="h-12 px-8 text-bark/40 font-bold text-xs uppercase tracking-widest hover:text-bark transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isLoading}
                    className="h-12 px-10 bg-sage text-cream rounded-xl shadow-warm flex items-center gap-2 hover:bg-sage-deep transition-all font-bold text-xs uppercase tracking-widest disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-[600px] border-4 border-dashed border-bark/5 rounded-[3rem] flex flex-col items-center justify-center text-center p-12">
              <div className="h-24 w-24 bg-hemp/20 rounded-full flex items-center justify-center mb-6">
                <Utensils className="h-10 w-10 text-bark/20" />
              </div>
              <h2 className="text-2xl text-bark font-serif mb-4">No Meal Selected</h2>
              <p className="text-bark/40 max-w-sm leading-relaxed">
                Select a meal from the library to view details or create a new one to expand your collection.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={cn(
          "fixed top-8 right-8 z-[100] p-6 rounded-3xl shadow-warm animate-in slide-in-from-top duration-500 flex items-center gap-4 max-w-md",
          notification.type === 'success' ? "bg-sage text-cream" : "bg-red-500 text-cream"
        )}>
          {notification.type === 'success' ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
          <p className="font-bold text-sm">{notification.message}</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-bark/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative bg-cream rounded-[3rem] p-10 max-w-sm w-full shadow-warm text-center animate-in zoom-in-95 duration-300">
            <div className="h-20 w-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="h-10 w-10" />
            </div>
            <h3 className="text-2xl text-bark font-serif mb-4">Xác nhận xóa?</h3>
            <p className="text-bark/40 text-sm mb-8 leading-relaxed">
              Hành động này không thể hoàn tác. Món ăn sẽ bị xóa vĩnh viễn khỏi thư viện.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-4 text-bark/40 font-bold text-xs uppercase tracking-widest hover:text-bark transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 py-4 bg-red-500 text-cream rounded-2xl font-bold text-xs uppercase tracking-widest shadow-soft hover:bg-red-600 transition-colors"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

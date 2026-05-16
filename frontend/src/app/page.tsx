'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Search, Loader2 } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { mealsApi, mealPlansApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Meal {
  id: string;
  name: string;
}

interface MealPlanItem {
  day_of_week?: number | string;
  meal?: {
    name?: string;
  };
  name?: string;
}

interface LegacyMealPlanDay {
  meals?: Array<{
    name?: string;
  }>;
}

export default function MealPlanPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMeals, setSelectedMeals] = useState<Record<string, string[]>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDayKey, setActiveDayKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mealDatabase, setMealDatabase] = useState<Meal[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const weekStartKey = useMemo(() => format(weekStart, 'yyyy-MM-dd'), [weekStart]);
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

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
      const response = await mealPlansApi.getCurrent({ week_start: weekStartKey });
      if (response.data.success) {
        // Transform backend format to local state format
        const plan = response.data.data.meal_plan || {};
        const transformed: Record<string, string[]> = {};
        if (Array.isArray(plan.meals)) {
          plan.meals.forEach((item: MealPlanItem) => {
            const dayIndex = Number(item.day_of_week);
            const mealName = item.meal?.name || item.name;
            if (!Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex > 6 || !mealName) return;

            const dateKey = format(addDays(weekStart, dayIndex), 'yyyy-MM-dd');
            transformed[dateKey] = [...(transformed[dateKey] || []), mealName];
          });
        } else {
          Object.entries(plan as Record<string, LegacyMealPlanDay>).forEach(([date, data]) => {
            const meals = Array.isArray(data?.meals) ? data.meals : [];
            transformed[date] = meals
              .map((meal) => meal.name)
              .filter((mealName): mealName is string => Boolean(mealName));
          });
        }
        setSelectedMeals(transformed);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setSelectedMeals({});
        return;
      }
      if (error.message !== 'Network Error') {
        console.error('Failed to fetch meal plan:', error);
      }
    }
  }, [user, weekStart, weekStartKey]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchMeals();
      fetchMealPlan();
    }
  }, [fetchMeals, fetchMealPlan, authLoading, user]);

  // Handle week navigation
  const handlePrevWeek = () => {
    setCurrentDate(addDays(currentDate, -7));
  };

  const handleNextWeek = () => {
    setCurrentDate(addDays(currentDate, 7));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      setCurrentDate(newDate);
    }
  };

  const triggerDatePicker = () => {
    if (dateInputRef.current) {
      try {
        if ('showPicker' in HTMLInputElement.prototype) {
          dateInputRef.current.showPicker();
        } else {
          dateInputRef.current.click();
        }
      } catch (error) {
        dateInputRef.current.click();
      }
    }
  };

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

  const openModal = (dayKey: string) => {
    setActiveDayKey(dayKey);
    setIsModalOpen(true);
    setSearchQuery('');
    if (mealDatabase.length === 0 && !fetchLoading) {
      fetchMeals();
    }
  };

  const handleSelectMeal = async (mealName: string) => {
    if (!activeDayKey || !user) return;
    
    setIsLoading(true);
    try {
      const currentMeals = selectedMeals[activeDayKey] || [];
      if (!currentMeals.includes(mealName)) {
        const updatedMeals = [...currentMeals, mealName];
        
        // Save to backend
        await mealPlansApi.save({
          date: activeDayKey,
          meal_names: updatedMeals
        });

        setSelectedMeals({
          ...selectedMeals,
          [activeDayKey]: updatedMeals
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save meal plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeMeal = async (dayKey: string, mealIndex: number) => {
    if (!user) return;
    const currentMeals = selectedMeals[dayKey] || [];
    const updatedMeals = currentMeals.filter((_, i) => i !== mealIndex);
    
    try {
      await mealPlansApi.save({
        date: dayKey,
        meal_names: updatedMeals
      });

      setSelectedMeals({
        ...selectedMeals,
        [dayKey]: updatedMeals
      });
    } catch (error) {
      console.error('Failed to update meal plan:', error);
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
    <div className="pb-24 animate-page-enter">
      {/* Editorial Header */}
      <header className="mb-20">
        <span className="text-[10px] font-bold text-bark/40 uppercase tracking-[0.4em] block pt-8 mb-4">
          {format(currentDate, 'EEEE, MMMM d')}
        </span>
        <h3 className="text-3xl md:text-4xl text-bark font-serif mb-6 leading-tight">
          Weekly Alignment
        </h3>
        <div className="flex items-center gap-4 text-bark/60">
          <p className="text-xl max-w-2xl leading-relaxed">
            Choose each meal with intention. Begin your day with a nourish mind.
          </p>
        </div>
      </header>

      {/* Week Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
        <h3 className="text-xs font-bold text-bark uppercase tracking-[0.3em]">Week Schedule</h3>
        <div className="relative flex items-center gap-2 md:gap-4 bg-cream rounded-full p-1 shadow-soft w-fit">
          <input 
            type="date"
            ref={dateInputRef}
            className="absolute opacity-0 pointer-events-none w-0 h-0"
            onChange={handleDateChange}
          />
          <button 
            onClick={handlePrevWeek}
            className="p-3 hover:bg-hemp/50 rounded-full transition-all active:scale-95"
            aria-label="Previous week"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div 
            onClick={triggerDatePicker}
            className="text-xs md:text-sm font-bold text-bark min-w-[150px] md:min-w-[200px] text-center uppercase tracking-widest cursor-pointer hover:text-sage-deep transition-colors select-none px-2"
          >
             {format(weekStart, 'MMM d')} — {format(addDays(weekStart, 6), 'MMM d')}
          </div>
          <button 
            onClick={handleNextWeek}
            className="p-3 hover:bg-hemp/50 rounded-full transition-all active:scale-95"
            aria-label="Next week"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
        {daysOfWeek.map((day, idx) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const isToday = dayKey === format(new Date(), 'yyyy-MM-dd');
          const dayMeals = selectedMeals[dayKey] || [];
          
          return (
            <div 
              key={idx}
              className={cn(
                "group bg-cream rounded-[2.5rem] p-8 transition-all duration-700 flex flex-col h-full",
                isToday ? "shadow-warm scale-[1.02] z-10" : "shadow-soft hover:shadow-warm hover:scale-[1.01]"
              )}
            >
              <div className="flex items-end justify-between mb-8">
                <div>
                  <h4 className={cn(
                    "text-base font-bold uppercase tracking-[0.2em] mb-1",
                    isToday ? "text-sage-deep" : "text-bark"
                  )}>
                    {format(day, 'EEEE')}
                  </h4>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-medium text-bark/40">{format(day, 'd')}</span>
                    <span className="text-xs font-medium text-bark/40">{format(day, 'MMMM')}</span>
                  </div>
                </div>
                {isToday && (
                  <div className="px-3 py-1 bg-sage/10 text-sage-deep text-[9px] font-bold rounded-full uppercase tracking-widest">
                    Current
                  </div>
                )}
              </div>

              {/* Selected Meals List */}
              <div className="flex-1 space-y-3 mb-6">
                {dayMeals.length > 0 ? (
                  dayMeals.map((meal, mIdx) => (
                    <div key={mIdx} className="group/meal flex items-center justify-between bg-hemp/10 rounded-xl p-3 border border-bark/5 hover:bg-hemp/20 transition-colors">
                      <span className="text-sm text-bark font-medium">{meal}</span>
                      <button 
                        onClick={() => removeMeal(dayKey, mIdx)}
                        className="opacity-0 group-hover/meal:opacity-100 p-1 hover:bg-bark/10 rounded-full transition-all"
                      >
                        <X className="h-3 w-3 text-bark/40" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="h-24 flex items-center justify-center border-2 border-dashed border-bark/5 rounded-2xl">
                    <p className="text-xs text-bark/20 italic">No meals selected</p>
                  </div>
                )}
              </div>

              {/* Add Button */}
              <button 
                onClick={() => openModal(dayKey)}
                className="w-full py-3 px-4 bg-sage text-cream rounded-xl flex items-center justify-center gap-2 hover:bg-sage-deep shadow-soft transition-all font-bold text-xs uppercase tracking-widest"
              >
                <Plus className="h-4 w-4" />
                Thêm món
              </button>
              
              <div className="mt-8 pt-6 border-t border-bark/5">
                <p className="text-[10px] text-bark/40 italic leading-relaxed">
                  "Let food be thy medicine and medicine be thy food."
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Popup */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-bark/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            ref={modalRef}
            className="bg-cream rounded-[2.5rem] w-full max-w-lg shadow-warm animate-scale-in overflow-hidden"
          >
            <div className="p-8 border-b border-bark/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-bold text-bark uppercase tracking-[0.3em]">Chọn món ăn</h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-hemp/50 rounded-full transition-all"
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
                  className="w-full bg-hemp/10 border-0 rounded-2xl py-4 pl-12 pr-4 text-bark placeholder:text-bark/20 focus:ring-2 focus:ring-sage/20 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {fetchLoading ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-sage" />
                </div>
              ) : filteredMeals.length > 0 ? (
                filteredMeals.map((meal, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectMeal(meal.name)}
                    disabled={isLoading}
                    className="w-full text-left px-6 py-4 rounded-2xl hover:bg-sage/10 hover:text-sage-deep transition-all font-medium text-bark flex items-center justify-between group"
                  >
                    {meal.name}
                    <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
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
    </div>
  );
}

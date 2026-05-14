'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Sparkles, Save, ShoppingCart, Calendar, MoreHorizontal, X, Search, Loader2 } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MEAL_DATABASE = [
  'Oatmeal with Berries', 'Avocado Toast', 'Grilled Chicken Salad', 'Quinoa Buddha Bowl',
  'Pan-Seared Salmon', 'Mushroom Risotto', 'Greek Yogurt Parfait', 'Lentil Soup',
  'Spaghetti Carbonara', 'Beef Stir-fry', 'Tuna Poke Bowl', 'Roasted Vegetable Wrap',
  'Chicken Tikka Masala', 'Shrimp Tacos', 'Eggplant Parmesan', 'Minestrone Soup',
  'Turkey Club Sandwich', 'Caprese Salad', 'Bibimbap', 'Falafel Pita',
  'Beef Bourguignon', 'Pad Thai', 'Lemon Herb Chicken', 'Vegetable Curry',
  'Margherita Pizza', 'Cobb Salad', 'Miso Ramen', 'Fish and Chips',
  'Spinach and Feta Omelet', 'Hummus and Veggie Plate', 'Clam Chowder', 'Chicken Alfredo',
  'Pork Banh Mi', 'Mediterranean Mezze Platter', 'Butternut Squash Soup', 'Steak Frites',
  'Cauliflower Wings', 'Poke Bowl with Salmon', 'French Onion Soup', 'Zucchini Noodles',
  'Classic Cheeseburger', 'Caesar Salad', 'Sushi Platter', 'Ratatouille',
  'Lentil Dahl', 'Eggs Benedict', 'Pulled Pork Sandwich', 'Caprese Skewers',
  'Mango Sticky Rice', 'Greek Salad'
];

export default function MealPlanPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMeals, setSelectedMeals] = useState<Record<string, string[]>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDayKey, setActiveDayKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Handle modal close on click outside or escape key
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
  };

  const handleSelectMeal = (meal: string) => {
    if (!activeDayKey) return;
    
    setIsLoading(true);
    // Simulate loading state
    setTimeout(() => {
      const currentMeals = selectedMeals[activeDayKey] || [];
      if (!currentMeals.includes(meal)) {
        setSelectedMeals({
          ...selectedMeals,
          [activeDayKey]: [...currentMeals, meal]
        });
      }
      setIsLoading(false);
      setIsModalOpen(false);
    }, 300);
  };

  const removeMeal = (dayKey: string, mealIndex: number) => {
    const currentMeals = selectedMeals[dayKey] || [];
    const updatedMeals = currentMeals.filter((_, i) => i !== mealIndex);
    setSelectedMeals({
      ...selectedMeals,
      [dayKey]: updatedMeals
    });
  };

  const filteredMeals = MEAL_DATABASE.filter(meal => 
    meal.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pt-12 px-12 pb-24 animate-page-enter">
      {/* Editorial Header */}
      <header className="mb-20">
        <span className="text-[10px] font-bold text-bark/40 uppercase tracking-[0.4em] block mb-4">
          Wednesday, May 13
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
      <div className="flex items-center justify-between mb-12">
        <h3 className="text-xs font-bold text-bark uppercase tracking-[0.3em]">Week Schedule</h3>
        <div className="flex items-center gap-4 bg-cream rounded-full p-1 shadow-soft">
          <button className="p-3 hover:bg-hemp/50 rounded-full transition-all">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold text-bark min-w-[200px] text-center uppercase tracking-widest">
             {format(weekStart, 'MMM d')} — {format(addDays(weekStart, 6), 'MMM d')}
          </span>
          <button className="p-3 hover:bg-hemp/50 rounded-full transition-all">
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
        <div 
          className="fixed inset-0 bg-bark/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-cream w-full max-w-2xl rounded-[3rem] shadow-warm overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
            onClick={e => e.stopPropagation()}
            ref={modalRef}
          >
            {/* Modal Header */}
            <div className="p-8 border-b border-bark/5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl text-bark font-serif">Chọn món ăn</h2>
                <p className="text-xs text-bark/40 uppercase tracking-widest mt-1">
                  {activeDayKey && format(new Date(activeDayKey), 'EEEE, d MMMM')}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-3 hover:bg-hemp/30 rounded-full transition-colors"
              >
                <X className="h-6 w-6 text-bark/40" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-6 bg-hemp/10">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-bark/30" />
                <input 
                  ref={searchInputRef}
                  type="text" 
                  placeholder="Tìm kiếm món ăn..."
                  className="w-full bg-cream border-0 rounded-2xl py-4 pl-12 pr-4 text-bark placeholder:text-bark/20 shadow-soft focus:ring-2 focus:ring-sage/20 transition-all"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Meals List */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {isLoading ? (
                <div className="h-40 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="h-8 w-8 text-sage animate-spin" />
                  <p className="text-sm text-bark/40">Đang cập nhật thực đơn...</p>
                </div>
              ) : filteredMeals.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredMeals.map((meal) => {
                    const isSelected = activeDayKey && selectedMeals[activeDayKey]?.includes(meal);
                    return (
                      <button
                        key={meal}
                        disabled={isSelected || isLoading}
                        onClick={() => handleSelectMeal(meal)}
                        className={cn(
                          "text-left p-4 rounded-2xl transition-all border border-transparent",
                          isSelected 
                            ? "bg-bark/5 text-bark/30 cursor-not-allowed opacity-60" 
                            : "bg-hemp/20 hover:bg-sage/10 hover:border-sage/20 text-bark"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{meal}</span>
                          {isSelected && <span className="text-[10px] font-bold uppercase tracking-tighter bg-bark/10 px-2 py-0.5 rounded-full">Đã chọn</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-center p-8">
                  <p className="text-bark/40 italic">Không tìm thấy món ăn nào phù hợp với "{searchQuery}"</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-hemp/5 text-center">
              <p className="text-[10px] text-bark/30 uppercase tracking-[0.2em]">
                {filteredMeals.length} món ăn khả dụng
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Bar */}
      <div className="fixed bottom-12 right-12 flex flex-col gap-4 z-50">
        <button className="h-16 w-16 bg-cream rounded-full shadow-warm flex items-center justify-center hover:scale-110 transition-transform group">
          <Save className="h-6 w-6 text-bark group-hover:text-sage-deep" />
        </button>
        <button className="h-20 px-10 bg-sage text-cream rounded-[2.5rem] shadow-warm flex items-center gap-4 hover:bg-sage-deep hover:-translate-y-1 transition-all group">
          <Sparkles className="h-6 w-6 fill-current" />
          <span className="font-bold uppercase tracking-widest text-sm">Review List</span>
          <ShoppingCart className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}

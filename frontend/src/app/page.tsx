'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Sparkles, Save, ShoppingCart, Calendar } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MEAL_CATEGORIES = ['Breakfast', 'Lunch', 'Dinner'];

export default function MealPlanPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

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

      {/* Week Navigation Inline */}
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

      {/* Horizontal Scroll / Adaptive Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-12">
        {daysOfWeek.map((day, idx) => {
          const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          
          return (
            <div 
              key={idx}
              className={cn(
                "group bg-cream rounded-[3rem] p-10 transition-all duration-700",
                isToday ? "shadow-warm scale-[1.03] z-10" : "shadow-soft hover:shadow-warm hover:scale-[1.01]"
              )}
            >
              {/* Day Header */}
              <div className="flex items-end justify-between mb-12">
                <div>
                  <h4 className={cn(
                    "text-lg font-bold uppercase tracking-[0.2em] mb-1",
                    isToday ? "text-sage-deep" : "text-bark"
                  )}>
                    {format(day, 'EEEE')}
                  </h4>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-medium text-bark/40">{format(day, 'd')}</span>
                    <span className="text-sm font-medium text-bark/40">{format(day, 'MMMM')}</span>
                  </div>
                </div>
                {isToday && (
                  <div className="px-4 py-1.5 bg-sage/10 text-sage-deep text-[10px] font-bold rounded-full uppercase tracking-widest">
                    Current
                  </div>
                )}
              </div>

              {/* Meal Entries style - Magazine list */}
              <div className="space-y-10">
                {MEAL_CATEGORIES.map((cat) => (
                  <div key={cat} className="group/item">
                    <button className="w-full text-left bg-hemp/20 rounded-2xl p-6 border-0 group-hover/item:bg-hemp/40 transition-all duration-500">
                      <div className="flex items-center justify-between">
                         <span className="text-lg text-bark/40 font-medium italic">Compose menu...</span>
                         <div className="h-10 w-10 rounded-full bg-cream shadow-soft flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <Plus className="h-4 w-4 text-sage-deep" />
                         </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Day Quote or Note */}
              <div className="mt-12 pt-8 border-t border-bark/5">
                <p className="text-xs text-bark/40 italic leading-relaxed">
                  "Let food be thy medicine and medicine be thy food."
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Action Bar - Magazine Style */}
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

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Search, CheckCircle2, MoreHorizontal, ShoppingBag, ArrowLeft, Filter, Loader2, ListPlus } from 'lucide-react';
import Link from 'next/link';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { shoppingListsApi, mealPlansApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { format, startOfWeek } from 'date-fns';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  is_checked: boolean;
}

interface ShoppingList {
  id: string;
  week_start_date: string;
  status: string;
  items: ShoppingItem[];
  total_items: number;
  checked_items: number;
  progress: number;
}

export default function ShoppingPage() {
  const { user, loading: authLoading } = useAuth();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMealPlanId, setCurrentMealPlanId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('other');

  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);
  const weekStartKey = useMemo(() => format(weekStart, 'yyyy-MM-dd'), [weekStart]);

  const fetchCurrentList = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    
    // Always fetch the current meal plan to allow syncing
    try {
      const planResp = await mealPlansApi.getCurrent({ week_start: weekStartKey });
      if (planResp.data.success) {
        setCurrentMealPlanId(planResp.data.data.meal_plan?.id || null);
      }
    } catch (planError) {
      setCurrentMealPlanId(null);
    }

    try {
      const response = await shoppingListsApi.getCurrent();
      if (response.data.success) {
        setList(response.data.data.shopping_list);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setList(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, weekStartKey]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchCurrentList();
    }
  }, [authLoading, user, fetchCurrentList]);

  const toggleItem = async (itemId: string, currentStatus: boolean) => {
    if (!list) return;
    
    // Optimistic update
    const updatedItems = list.items.map(item => 
      item.id === itemId ? { ...item, is_checked: !currentStatus } : item
    );
    const checkedCount = updatedItems.filter(i => i.is_checked).length;
    setList({
      ...list,
      items: updatedItems,
      checked_items: checkedCount,
      progress: Math.round((checkedCount / updatedItems.length) * 100)
    });

    try {
      await shoppingListsApi.updateItem(list.id, itemId, { is_checked: !currentStatus });
    } catch (error) {
      // Revert if failed
      fetchCurrentList();
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

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!list || !newItemName.trim()) return;

    setIsAddingItem(true);
    try {
      const response = await shoppingListsApi.addItem(list.id, {
        name: newItemName.trim(),
        category: newItemCategory
      });
      if (response.data.success) {
        setNewItemName('');
        setNewItemCategory('other');
        fetchCurrentList();
      }
    } catch (error) {
      console.error('Failed to add item:', error);
    } finally {
      setIsAddingItem(false);
    }
  };

  const filteredItems = list?.items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const categories = Array.from(new Set(filteredItems.map(item => item.category)));

  if (authLoading || (isLoading && !list)) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sage" />
      </div>
    );
  }

  return (
    <div className="pb-24 animate-page-enter">
      {/* Editorial Header */}
      <header className="mb-12 pt-8">
        <div className="flex items-center gap-2 text-bark/40 mb-4">
          <Link href="/" className="hover:text-sage-deep transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="text-[10px] font-bold uppercase tracking-[0.4em]">
            Back to Schedule
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl text-bark font-serif mb-6 leading-tight">
          Shopping List
        </h1>
        <p className="text-xl text-bark/60 max-w-2xl leading-relaxed">
          The essential elements for your weekly nourishment.
        </p>
      </header>

      {!list ? (
        <div className="bg-cream rounded-[2.5rem] p-12 shadow-soft text-center max-w-3xl mx-auto">
          <div className="h-20 w-20 rounded-full bg-sage/10 flex items-center justify-center mx-auto mb-8">
            <ShoppingBag className="h-10 w-10 text-sage" />
          </div>
          <h2 className="text-3xl font-serif text-bark mb-4">No active list found</h2>
          <p className="text-bark/60 mb-10 text-lg">
            {currentMealPlanId 
              ? "You have a meal plan for this week. Generate a shopping list to get started."
              : "Plan your meals first to automatically generate a shopping list."}
          </p>
          {currentMealPlanId ? (
            <button 
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
          {/* Progress & Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-2 bg-cream rounded-[2.5rem] p-8 shadow-soft flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div>
                  <h3 className="text-xs font-bold text-bark uppercase tracking-[0.3em] mb-2">Completion</h3>
                  <p className="text-3xl font-serif text-bark">
                    {list.checked_items} <span className="text-bark/20">/</span> {list.total_items}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {currentMealPlanId && (
                    <button 
                      onClick={handleGenerateList}
                      disabled={isGenerating}
                      className="h-12 px-6 rounded-full bg-sage text-cream text-sm font-bold uppercase tracking-widest shadow-soft hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2"
                    >
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListPlus className="h-4 w-4" />}
                      Sync Plan
                    </button>
                  )}
                  <div className="h-16 w-16 rounded-full bg-sage/10 flex items-center justify-center">
                    <ShoppingBag className="h-6 w-6 text-sage-deep" />
                  </div>
                </div>
              </div>
              <div className="w-full h-2 bg-hemp rounded-full overflow-hidden relative z-10">
                <div 
                  className="h-full bg-sage transition-all duration-1000 ease-out"
                  style={{ width: `${list.progress}%` }}
                />
              </div>
            </div>

            <div className="bg-sage text-cream rounded-[2.5rem] p-8 shadow-warm">
              <h3 className="text-xs font-bold uppercase tracking-[0.3em] opacity-80 mb-6">Quick Add</h3>
              <form onSubmit={handleAddItem} className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Item name..."
                  className="w-full bg-cream/10 border-0 rounded-xl py-3 px-4 text-cream placeholder:text-cream/40 focus:ring-2 focus:ring-cream/20 transition-all text-sm"
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  disabled={isAddingItem}
                />
                <div className="flex gap-2">
                  <select
                    className="flex-1 bg-cream/10 border-0 rounded-xl py-3 px-3 text-cream text-xs focus:ring-2 focus:ring-cream/20 transition-all appearance-none"
                    value={newItemCategory}
                    onChange={e => setNewItemCategory(e.target.value)}
                    disabled={isAddingItem}
                  >
                    <option value="vegetables" className="text-bark">Vegetables</option>
                    <option value="meat" className="text-bark">Meat</option>
                    <option value="seafood" className="text-bark">Seafood</option>
                    <option value="dairy" className="text-bark">Dairy</option>
                    <option value="grains" className="text-bark">Grains</option>
                    <option value="condiments" className="text-bark">Condiments</option>
                    <option value="frozen" className="text-bark">Frozen</option>
                    <option value="daily" className="text-bark">Daily</option>
                    <option value="consumable" className="text-bark">Consumable</option>
                    <option value="other" className="text-bark">Other</option>
                  </select>
                  <button 
                    type="submit"
                    disabled={isAddingItem || !newItemName.trim()}
                    className="h-11 w-11 bg-cream text-sage-deep rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isAddingItem ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-bark/30" />
              <input 
                type="text" 
                placeholder="Search items..."
                className="w-full bg-cream border-0 rounded-2xl py-4 pl-12 pr-4 text-bark placeholder:text-bark/20 shadow-soft focus:ring-2 focus:ring-sage/20 transition-all"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="h-[56px] px-6 bg-cream rounded-2xl shadow-soft flex items-center gap-3 text-bark/60 hover:text-bark transition-colors">
              <Filter className="h-5 w-5" />
              <span className="text-sm font-medium">Categories</span>
            </button>
          </div>

          {/* Items List */}
          <div className="space-y-12">
            {categories.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-bark/40 font-serif text-xl">No items found matching your search.</p>
              </div>
            ) : (
              categories.sort().map(category => {
                const categoryItems = filteredItems.filter(item => item.category === category);
                if (categoryItems.length === 0) return null;

                return (
                  <section key={category}>
                    <h3 className="text-xs font-bold text-bark/40 uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
                      {category}
                      <div className="h-px flex-1 bg-bark/5" />
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryItems.map(item => (
                        <button
                          key={item.id}
                          onClick={() => toggleItem(item.id, item.is_checked)}
                          className={cn(
                            "group flex items-center justify-between p-6 rounded-[2rem] transition-all duration-300 text-left",
                            item.is_checked 
                              ? "bg-hemp/20 opacity-60" 
                              : "bg-cream shadow-soft hover:shadow-warm hover:scale-[1.01]"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "h-6 w-6 rounded-full flex items-center justify-center transition-colors",
                              item.is_checked ? "bg-sage text-cream" : "border-2 border-bark/10 group-hover:border-sage/40"
                            )}>
                              {item.is_checked ? <CheckCircle2 className="h-4 w-4" /> : null}
                            </div>
                            <span className={cn(
                              "font-medium transition-all",
                              item.is_checked ? "text-bark/40 line-through" : "text-bark"
                            )}>
                              {item.name}
                            </span>
                          </div>
                          <MoreHorizontal className="h-5 w-5 text-bark/10 group-hover:text-bark/40 transition-colors" />
                        </button>
                      ))}
                    </div>
                  </section>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Plus, Search, CheckCircle2, Circle, MoreHorizontal, ShoppingBag, ArrowLeft, Filter } from 'lucide-react';
import Link from 'next/link';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  isChecked: boolean;
}

const INITIAL_ITEMS: ShoppingItem[] = [
  { id: '1', name: 'Avocados', category: 'Produce', isChecked: false },
  { id: '2', name: 'Sourdough Bread', category: 'Bakery', isChecked: true },
  { id: '3', name: 'Greek Yogurt', category: 'Dairy', isChecked: false },
  { id: '4', name: 'Chicken Breast', category: 'Meat', isChecked: false },
  { id: '5', name: 'Quinoa', category: 'Pantry', isChecked: true },
  { id: '6', name: 'Spinach', category: 'Produce', isChecked: false },
  { id: '7', name: 'Blueberries', category: 'Produce', isChecked: false },
];

export default function ShoppingPage() {
  const [items, setItems] = useState<ShoppingItem[]>(INITIAL_ITEMS);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleItem = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, isChecked: !item.isChecked } : item
    ));
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const checkedCount = items.filter(item => item.isChecked).length;
  const progress = (checkedCount / items.length) * 100;

  const categories = Array.from(new Set(items.map(item => item.category)));

  return (
    <div className="pb-24 animate-page-enter">
      {/* Editorial Header */}
      <header className="mb-12">
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

      {/* Progress & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 bg-cream rounded-[2.5rem] p-8 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xs font-bold text-bark uppercase tracking-[0.3em] mb-2">Completion</h3>
              <p className="text-3xl font-serif text-bark">{checkedCount} <span className="text-bark/20">/</span> {items.length}</p>
            </div>
            <div className="h-16 w-16 rounded-full bg-sage/10 flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-sage-deep" />
            </div>
          </div>
          <div className="w-full h-2 bg-hemp rounded-full overflow-hidden">
            <div 
              className="h-full bg-sage transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-sage text-cream rounded-[2.5rem] p-8 shadow-warm flex flex-col justify-center gap-6">
          <h3 className="text-xs font-bold uppercase tracking-[0.3em] opacity-80">Quick Action</h3>
          <button className="w-full py-4 bg-cream text-sage-deep rounded-2xl font-bold uppercase tracking-widest text-xs shadow-soft hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" />
            Add Custom Item
          </button>
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
        {categories.map(category => {
          const categoryItems = filteredItems.filter(item => item.category === category);
          if (categoryItems.length === 0) return null;

          return (
            <section key={category}>
              <h3 className="text-xs font-bold text-bark/40 uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
                {category}
                <div className="h-px flex-1 bg-bark/5" />
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={cn(
                      "group flex items-center justify-between p-6 rounded-[2rem] transition-all duration-300 text-left",
                      item.isChecked 
                        ? "bg-hemp/20 opacity-60" 
                        : "bg-cream shadow-soft hover:shadow-warm hover:scale-[1.01]"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-6 w-6 rounded-full flex items-center justify-center transition-colors",
                        item.isChecked ? "bg-sage text-cream" : "border-2 border-bark/10 group-hover:border-sage/40"
                      )}>
                        {item.isChecked ? <CheckCircle2 className="h-4 w-4" /> : null}
                      </div>
                      <span className={cn(
                        "font-medium transition-all",
                        item.isChecked ? "text-bark/40 line-through" : "text-bark"
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
        })}
      </div>
    </div>
  );
}

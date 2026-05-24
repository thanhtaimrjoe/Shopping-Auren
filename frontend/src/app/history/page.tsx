'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ChevronRight, History, Loader2, X } from 'lucide-react';
import { shoppingListsApi } from '@/lib/api';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { cn } from '@/lib/cn';
import { sortShoppingGroups } from '@/lib/shopping-groups';

interface HistorySummary {
  id: string;
  week_from_date: string;
  week_to_date: string;
  status: string;
  total_items: number;
  checked_items: number;
  completed_at: string;
}

interface HistoryItem {
  id: string;
  name: string;
  category: string;
  is_checked: boolean;
  note?: string | null;
}

interface HistoryDetail {
  id: string;
  week_from_date?: string;
  week_to_date?: string;
  status: string;
  items: HistoryItem[];
  total_items: number;
  checked_items: number;
  completed_at?: string;
}

export default function HistoryPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const [history, setHistory] = useState<HistorySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<HistoryDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await shoppingListsApi.getHistory({ weeks: 2 });
      if (response.data.success) {
        setHistory(response.data.data.history);
      }
    } catch (error) {
      console.error('Failed to load shopping history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchHistory();
    }
  }, [authLoading, user, fetchHistory]);

  const openDetail = async (listId: string) => {
    setDetailLoading(true);
    try {
      const response = await shoppingListsApi.getById(listId);
      if (response.data.success) {
        setSelected(response.data.data.shopping_list);
      }
    } catch (error) {
      console.error('Failed to load list detail:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  if (authLoading || !user || isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sage" />
      </div>
    );
  }

  return (
    <div className="page-shell animate-page-enter min-w-0">
      <header className="mb-6 sm:mb-10">
        <h1 className="page-title text-2xl sm:text-4xl md:text-5xl text-bark font-serif mb-3 sm:mb-6 leading-tight">
          Shopping history
        </h1>
      </header>

      {history.length === 0 ? (
        <div className="bg-cream rounded-[1.75rem] sm:rounded-[2.5rem] p-8 sm:p-12 shadow-soft text-center max-w-lg mx-auto">
          <History className="h-12 w-12 text-bark/20 mx-auto mb-6" />
          <p className="text-bark/50 font-serif text-xl">No completed lists yet.</p>
          <Link
            href="/shopping"
            className="inline-block mt-8 text-sage-deep font-bold uppercase tracking-widest text-xs"
          >
            Go to shopping list
          </Link>
        </div>
      ) : (
        <div className="space-y-4 max-w-2xl">
          {history.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => openDetail(entry.id)}
              className="w-full bg-cream rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6 shadow-soft flex items-center justify-between gap-4 text-left touch-manipulation min-h-[56px] hover:shadow-warm transition-shadow"
            >
              <div>
                <p className="font-serif text-lg text-bark">
                  {format(parseISO(entry.week_from_date), 'MMM d, yyyy')}
                  {' — '}
                  {format(parseISO(entry.week_to_date), 'MMM d, yyyy')}
                </p>
                <p className="text-sm text-bark/50 mt-1">
                  {entry.checked_items}/{entry.total_items} items ·{' '}
                  {entry.completed_at
                    ? format(parseISO(entry.completed_at), 'MMM d, yyyy')
                    : 'Completed'}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-bark/30 shrink-0" />
            </button>
          ))}
        </div>
      )}

      {(selected || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-bark/40 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => !detailLoading && setSelected(null)}
          />
          <div className="relative w-full max-w-lg bg-cream rounded-t-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 max-h-[85vh] overflow-y-auto shadow-warm animate-page-enter">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-bold text-bark uppercase tracking-[0.2em]">List detail</h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-3 bg-hemp/20 rounded-xl touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {detailLoading || !selected ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-sage" />
              </div>
            ) : (
              <>
                <p className="text-sm text-bark/50 mb-6">
                  {selected.checked_items}/{selected.total_items} checked
                </p>
                <div className="space-y-8">
                  {sortShoppingGroups(
                    Array.from(new Set(selected.items.map((item) => item.category)))
                  ).map((group) => {
                    const groupItems = selected.items.filter((item) => item.category === group);
                    if (groupItems.length === 0) return null;
                    return (
                      <section key={group}>
                        <h3 className="text-xs font-bold text-bark/40 uppercase tracking-[0.3em] mb-3">
                          {group}
                        </h3>
                        <ul className="space-y-2">
                          {groupItems.map((item) => (
                            <li
                              key={item.id}
                              className={cn(
                                'flex items-start gap-3 p-4 rounded-2xl',
                                item.is_checked ? 'bg-hemp/20 opacity-70' : 'bg-hemp/10'
                              )}
                            >
                              <div className="min-w-0 flex-1">
                                <span
                                  className={cn(
                                    'font-medium block',
                                    item.is_checked && 'line-through text-bark/40'
                                  )}
                                >
                                  {item.name}
                                </span>
                                {item.note ? (
                                  <span className="block text-xs text-bark/50 mt-1">{item.note}</span>
                                ) : null}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </section>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

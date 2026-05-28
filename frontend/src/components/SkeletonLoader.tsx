'use client';

import { cn } from '@/lib/cn';

interface SkeletonLoaderProps {
  count?: number;
  type?: 'card' | 'text' | 'row';
}

export function SkeletonLoader({ count = 6, type = 'card' }: SkeletonLoaderProps) {
  if (type === 'text') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-hemp/20 rounded-lg animate-pulse"
            style={{ width: `${70 + Math.random() * 30}%` }}
          />
        ))}
      </div>
    );
  }

  if (type === 'row') {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-4 bg-hemp/5 rounded-xl animate-pulse"
          >
            <div className="h-12 w-12 bg-hemp/20 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-hemp/20 rounded w-1/4" />
              <div className="h-2 bg-hemp/10 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-cream rounded-2xl p-4 animate-pulse shadow-soft">
          <div className="h-40 bg-hemp/20 rounded-xl mb-3" />
          <div className="h-4 bg-hemp/20 rounded w-3/4 mb-2" />
          <div className="h-3 bg-hemp/10 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

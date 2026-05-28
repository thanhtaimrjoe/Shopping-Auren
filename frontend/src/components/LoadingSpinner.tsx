'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  fullHeight?: boolean;
}

export function LoadingSpinner({ size = 'md', label, fullHeight = false }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const containerClasses = fullHeight ? 'h-[60vh] flex items-center justify-center' : 'flex items-center justify-center';

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className={cn('animate-spin text-sage', sizeClasses[size])} />
        {label && (
          <p className="text-sm text-bark/60">{label}</p>
        )}
      </div>
    </div>
  );
}

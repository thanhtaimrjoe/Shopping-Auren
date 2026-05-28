'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4', className)}>
      {icon && (
        <div className="mb-4 text-bark/20">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-serif font-bold text-bark mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-bark/60 text-center mb-6 max-w-xs">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2 bg-sage text-cream rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-sage-deep transition-all shadow-soft"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

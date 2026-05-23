'use client';

import { useEffect } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface ToastMessage {
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps extends ToastMessage {
  onDismiss: () => void;
  durationMs?: number;
}

export function Toast({ type, message, onDismiss, durationMs = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [onDismiss, durationMs]);

  return (
    <div
      role="status"
      className={cn(
        'fixed left-1/2 -translate-x-1/2 z-[70] px-6 py-4 rounded-2xl shadow-warm flex items-center gap-3 max-w-[min(24rem,calc(100vw-2rem))]',
        'bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:bottom-8',
        type === 'success' && 'bg-sage text-cream',
        type === 'error' && 'bg-red-500 text-white',
        type === 'info' && 'bg-bark text-cream'
      )}
    >
      {type === 'error' ? (
        <AlertCircle className="h-5 w-5 shrink-0" />
      ) : (
        <CheckCircle2 className="h-5 w-5 shrink-0" />
      )}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}

'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  isSelected?: boolean;
}

export function Card({ children, className, onClick, isSelected }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-cream rounded-2xl p-4 sm:p-6 transition-all duration-200 shadow-soft',
        onClick && 'cursor-pointer hover:shadow-md',
        isSelected && 'ring-2 ring-sage',
        className
      )}
    >
      {children}
    </div>
  );
}

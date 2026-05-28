'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-soft flex items-center justify-center gap-2 touch-manipulation min-h-[44px]';

  const variantClasses = {
    primary: 'bg-sage text-cream hover:bg-sage-deep disabled:opacity-50',
    secondary: 'bg-hemp/10 text-bark hover:bg-hemp/20 disabled:opacity-50',
    destructive: 'bg-red-500 text-white hover:bg-red-600 disabled:opacity-50',
    outline: 'border-2 border-bark text-bark hover:bg-bark/5 disabled:opacity-50',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-[10px]',
    md: 'px-4 py-3 text-xs',
    lg: 'px-6 py-4 text-sm',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {icon && !isLoading && icon}
      {isLoading && (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}

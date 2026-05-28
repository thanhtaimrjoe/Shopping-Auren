'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, hint, icon, className, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-xs font-bold uppercase tracking-widest text-bark/40 px-2 block">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-bark/40">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-hemp/10 border border-hemp/30 rounded-2xl py-3 px-4 text-bark placeholder:text-bark/30',
              'focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-transparent',
              'transition-all duration-200',
              icon && 'pl-12',
              error && 'border-red-300 focus:ring-red-300/30',
              'disabled:bg-bark/5 disabled:text-bark/40 disabled:cursor-not-allowed',
              className
            )}
            aria-invalid={!!error}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-red-500 px-2 flex items-center gap-1">
            <span>✕</span> {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs text-bark/40 px-2">{hint}</p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

'use client';

import { SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';
import { ChevronDown } from 'lucide-react';

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: Array<{ value: string; label: string }>;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, error, hint, options, className, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-xs font-bold uppercase tracking-widest text-bark/40 px-2 block">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'w-full bg-hemp/10 border border-hemp/30 rounded-2xl py-3 px-4 pr-10 text-bark',
              'focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-transparent',
              'transition-all duration-200 appearance-none',
              error && 'border-red-300 focus:ring-red-300/30',
              'disabled:bg-bark/5 disabled:text-bark/40 disabled:cursor-not-allowed',
              className
            )}
            aria-invalid={!!error}
            {...props}
          >
            <option value="">Select an option</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-bark/40 pointer-events-none" />
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

FormSelect.displayName = 'FormSelect';

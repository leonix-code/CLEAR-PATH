"use client";

import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, rightIcon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground-secondary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            className={cn(
              "w-full rounded-xl border border-border bg-white/50 dark:bg-neutral-900/50 px-4 py-2.5 text-sm text-foreground",
              "placeholder:text-foreground-muted/60",
              "backdrop-blur-sm transition-all duration-200",
              "hover:border-foreground-muted/40",
              "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-100 dark:disabled:bg-neutral-800/30",
              icon && "pl-10",
              rightIcon && "pr-10",
              error && "border-danger focus:border-danger focus:ring-danger/20",
              className
            )}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-danger" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-foreground-muted">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };

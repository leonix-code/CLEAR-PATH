"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-sm hover:from-brand-600 hover:to-brand-700 hover:shadow-md active:scale-[0.97]",
        secondary:
          "bg-white/50 dark:bg-neutral-900/50 text-foreground border border-border hover:bg-white/80 dark:hover:bg-neutral-800/50 hover:border-brand-500/30 active:scale-[0.97]",
        ghost:
          "text-foreground-secondary hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800/50 active:scale-[0.97]",
        danger:
          "bg-danger text-white shadow-sm hover:bg-red-600 active:scale-[0.97]",
        outline:
          "border-2 border-brand-500/30 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/20 active:scale-[0.97]",
        link:
          "text-brand-600 dark:text-brand-400 underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        xs: "h-7 px-2.5 text-xs gap-1.5",
        sm: "h-9 px-3.5 text-sm gap-1.5",
        md: "h-10 px-5 text-sm gap-2",
        lg: "h-11 px-6 text-base gap-2",
        xl: "h-12 px-8 text-base gap-2.5",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  icon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, icon, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : icon ? (
          <span className="flex-shrink-0">{icon}</span>
        ) : null}
        {children && <span>{children}</span>}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

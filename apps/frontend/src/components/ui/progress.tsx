"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProgressProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "success" | "warning" | "danger";
  showLabel?: boolean;
  label?: string;
  className?: string;
  animated?: boolean;
}

const sizeMap = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

const variantMap = {
  primary: "bg-gradient-to-r from-brand-500 to-brand-600",
  success: "bg-gradient-to-r from-emerald-500 to-emerald-600",
  warning: "bg-gradient-to-r from-amber-500 to-amber-600",
  danger: "bg-gradient-to-r from-red-500 to-red-600",
};

export function Progress({
  value,
  max = 100,
  size = "md",
  variant = "primary",
  showLabel = false,
  label,
  className,
  animated = true,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn("w-full", className)}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs font-medium text-foreground-secondary">{label}</span>}
          {showLabel && <span className="text-xs text-foreground-muted">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div
        className={cn(
          "w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden",
          sizeMap[size]
        )}
      >
        <motion.div
          initial={animated ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full",
            variantMap[variant]
          )}
        />
      </div>
    </div>
  );
}

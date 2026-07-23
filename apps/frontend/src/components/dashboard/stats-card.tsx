"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient: string;
  href?: string;
  suffix?: string;
  trend?: { value: number; positive: boolean };
  subtitle?: string;
  delay?: number;
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  gradient,
  href,
  suffix,
  trend,
  subtitle,
  delay = 0,
  className,
}: StatsCardProps) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "glass-card p-5 cursor-pointer group relative overflow-hidden",
        "hover:-translate-y-1 hover:shadow-glass-lg transition-all duration-300",
        className
      )}
    >
      {/* Background gradient accent */}
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-500"
        style={{ background: `linear-gradient(135deg, ${gradient.split(" ")[1] || "#6366f1"}, transparent)` }}
      />

      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-1">
          <p className="text-sm text-foreground-secondary font-medium">{title}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight">{value}</span>
            {suffix && <span className="text-sm text-foreground-muted font-medium">{suffix}</span>}
          </div>
          {subtitle && (
            <p className="text-xs text-foreground-muted">{subtitle}</p>
          )}
        </div>
        <div
          className={cn(
            "p-2.5 rounded-xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110",
            `bg-gradient-to-br ${gradient}`
          )}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          <span
            className={cn(
              "text-xs font-medium px-1.5 py-0.5 rounded",
              trend.positive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/10 text-red-600 dark:text-red-400"
            )}
          >
            {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-foreground-muted">vs last period</span>
        </div>
      )}
    </motion.div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

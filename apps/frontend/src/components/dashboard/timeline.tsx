"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  time: string;
  icon: LucideIcon;
  color: string;
  status?: "complete" | "current" | "pending" | "rejected";
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Vertical line */}
      <div className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-glass-border" />

      <div className="space-y-6">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative pl-12"
          >
            {/* Dot */}
            <div
              className={cn(
                "absolute left-[12px] top-1 w-[15px] h-[15px] rounded-full border-[3px] bg-card-bg z-10",
                item.status === "complete" ? "border-green-500" :
                item.status === "current" ? "border-primary" :
                item.status === "rejected" ? "border-red-500" :
                "border-foreground-muted"
              )}
            >
              {item.status === "current" && (
                <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
              )}
            </div>

            <div className="glass p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <item.icon className={cn("w-4 h-4", item.color)} />
                <h4 className="font-medium text-sm">{item.title}</h4>
              </div>
              {item.description && (
                <p className="text-xs text-foreground-secondary">{item.description}</p>
              )}
              <p className="text-[10px] text-foreground-muted mt-2">{item.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

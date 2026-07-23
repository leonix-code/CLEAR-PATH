"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon, ChevronRight } from "lucide-react";
import Link from "next/link";

interface QuickAction {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  link: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
  title?: string;
  className?: string;
}

export function QuickActions({ actions, title = "Quick Actions", className }: QuickActionsProps) {
  return (
    <div className={className}>
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action, index) => (
          <Link key={action.title} href={action.link}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card p-4 flex items-start gap-4 cursor-pointer group hover:-translate-y-1"
            >
              <div className={cn("p-3 rounded-xl", action.bg)}>
                <action.icon className={cn("w-5 h-5", action.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium group-hover:text-primary transition-colors text-sm">
                  {action.title}
                </h3>
                <p className="text-xs text-foreground-secondary mt-1">
                  {action.description}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-foreground-muted self-center flex-shrink-0" />
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}

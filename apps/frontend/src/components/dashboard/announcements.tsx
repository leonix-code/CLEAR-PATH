"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon, Megaphone, X, ChevronRight } from "lucide-react";
import { useState } from "react";

interface Announcement {
  id: string;
  title: string;
  message: string;
  time: string;
  icon?: LucideIcon;
  color?: string;
  bg?: string;
  dismissible?: boolean;
}

interface AnnouncementsProps {
  announcements: Announcement[];
  className?: string;
  title?: string;
}

export function Announcements({ announcements, className, title = "Announcements" }: AnnouncementsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const visible = announcements.filter((a) => !dismissed.has(a.id));

  if (visible.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Megaphone className="w-5 h-5 text-primary" />
        {title}
      </h2>
      <AnimatePresence>
        {visible.map((announcement, i) => (
          <motion.div
            key={announcement.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              "glass-card p-4 flex items-start gap-3",
              announcement.bg
            )}
          >
            {announcement.icon && (
              <div className={cn("p-2 rounded-lg flex-shrink-0", announcement.bg || "bg-primary/10")}>
                <announcement.icon className={cn("w-4 h-4", announcement.color || "text-primary")} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium text-sm">{announcement.title}</h4>
                {announcement.dismissible && (
                  <button
                    onClick={() => setDismissed((s) => new Set(s).add(announcement.id))}
                    className="p-0.5 hover:bg-glass-bg rounded transition-colors flex-shrink-0"
                  >
                    <X className="w-3.5 h-3.5 text-foreground-muted" />
                  </button>
                )}
              </div>
              <p className="text-xs text-foreground-secondary mt-1">{announcement.message}</p>
              <p className="text-[10px] text-foreground-muted mt-1.5">{announcement.time}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

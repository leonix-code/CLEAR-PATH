"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface Activity {
  id: string;
  action: string;
  description?: string;
  user: string;
  time: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  className?: string;
  title?: string;
  icon?: LucideIcon;
  maxItems?: number;
}

export function ActivityFeed({
  activities,
  className,
  title = "Recent Activity",
  icon: TitleIcon,
  maxItems = 10,
}: ActivityFeedProps) {
  return (
    <div className={cn("glass-card p-6", className)}>
      {title && (
        <div className="flex items-center gap-2 mb-4">
          {TitleIcon && <TitleIcon className="w-5 h-5 text-primary" />}
          <h2 className="font-semibold">{title}</h2>
        </div>
      )}

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-foreground-muted">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-1">
          {activities.slice(0, maxItems).map((activity, i) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-start gap-3 py-3 border-b border-glass-border last:border-0 group hover:bg-glass-bg -mx-2 px-2 rounded-lg transition-colors"
            >
              <div className={cn("p-2 rounded-lg flex-shrink-0 mt-0.5", activity.bg)}>
                <activity.icon className={cn("w-4 h-4", activity.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{activity.action}</p>
                {activity.description && (
                  <p className="text-xs text-foreground-muted mt-0.5">{activity.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-foreground-muted">{activity.user}</span>
                  <span className="text-foreground-muted">·</span>
                  <span className="text-xs text-foreground-muted">{activity.time}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

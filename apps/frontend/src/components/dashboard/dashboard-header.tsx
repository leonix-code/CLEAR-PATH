"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Search, Bell } from "lucide-react";
import { useState } from "react";

interface DashboardHeaderProps {
  title: string;
  description: string;
  actions?: React.ReactNode;
  searchable?: boolean;
  className?: string;
}

export function DashboardHeader({
  title,
  description,
  actions,
  searchable = true,
  className,
}: DashboardHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
        className
      )}
    >
      <div>
        <h1 className="text-2xl font-bold gradient-text">{title}</h1>
        <p className="text-foreground-secondary mt-1 text-sm">{description}</p>
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto">
        {searchable && (
          <div className="flex items-center gap-2 glass px-3 py-2 rounded-xl flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-foreground-muted" />
            <input
              type="text"
              placeholder="Quick search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full sm:w-48"
            />
          </div>
        )}
        {actions}
      </div>
    </motion.div>
  );
}

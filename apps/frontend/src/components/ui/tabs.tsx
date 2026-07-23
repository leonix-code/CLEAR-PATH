"use client";

import { useState, createContext, useContext } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType>({
  activeTab: "",
  setActiveTab: () => {},
});

interface TabsProps {
  defaultValue: string;
  value?: string;
  onChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ defaultValue, value, onChange, children, className }: TabsProps) {
  const [internalTab, setInternalTab] = useState(defaultValue);
  const activeTab = value ?? internalTab;

  const setActiveTab = (tab: string) => {
    if (!onChange) setInternalTab(tab);
    onChange?.(tab);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn(className)}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800/50 border border-border",
        className
      )}
      role="tablist"
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function TabsTrigger({ value, children, className, disabled }: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      className={cn(
        "relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        isActive
          ? "text-foreground shadow-sm bg-white dark:bg-neutral-800"
          : "text-foreground-muted hover:text-foreground",
        className
      )}
    >
      {isActive && (
        <motion.div
          layoutId="tab-indicator"
          className="absolute inset-0 rounded-lg bg-white dark:bg-neutral-800 shadow-sm"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { activeTab } = useContext(TabsContext);

  if (activeTab !== value) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      role="tabpanel"
      className={cn("pt-4", className)}
    >
      {children}
    </motion.div>
  );
}

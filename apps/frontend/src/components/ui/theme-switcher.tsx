"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeSwitcherProps {
  variant?: "icon" | "dropdown";
  className?: string;
}

export function ThemeSwitcher({ variant = "icon", className }: ThemeSwitcherProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-10 w-10" />;
  }

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  if (variant === "dropdown") {
    return (
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl text-sm",
            "bg-white/50 dark:bg-neutral-900/50 border border-border",
            "hover:bg-white/80 dark:hover:bg-neutral-800/50 transition-all",
            className
          )}
          aria-label="Select theme"
        >
          {resolvedTheme === "dark" ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4" />
          )}
          <span className="capitalize">{theme}</span>
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-1 w-36 glass-card p-1 shadow-xl z-50"
            >
              {themes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => {
                    setTheme(t.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors",
                    theme === t.value
                      ? "bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 font-medium"
                      : "text-foreground-secondary hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
                  )}
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn(
        "p-2 rounded-xl transition-all duration-200",
        "text-foreground-muted hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800/50",
        className
      )}
      aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={resolvedTheme}
          initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.25 }}
        >
          {resolvedTheme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </motion.div>
      </AnimatePresence>
    </button>
  );
}

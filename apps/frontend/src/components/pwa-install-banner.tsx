"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone, Shield, Zap } from "lucide-react";
import { usePWA } from "@/providers/pwa-provider";

export function PWAInstallBanner() {
  const { isInstallable, installPrompt, isPWA } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [showAfterLoad, setShowAfterLoad] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowAfterLoad(true), 3000);
    return () => clearTimeout(t);
  }, []);

  if (isPWA || dismissed || !isInstallable || !showAfterLoad) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed bottom-6 left-4 right-4 z-50 mx-auto max-w-md"
      >
        <div className="glass-card p-5 shadow-2xl border-primary/20 relative">
          <button onClick={() => setDismissed(true)}
            className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-card-bg border border-glass-border flex items-center justify-center hover:bg-glass-bg transition-colors"
            aria-label="Dismiss">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/25">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">Install ClearPath</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Install for offline access, faster loading, and a full-screen experience.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-[10px] font-medium text-primary">
                  <Zap className="w-3 h-3" /> Fast
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-500/10 text-[10px] font-medium text-green-600 dark:text-green-400">
                  <Shield className="w-3 h-3" /> Offline
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                  <Smartphone className="w-3 h-3" /> App-like
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button onClick={installPrompt}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]">
              <Download className="w-4 h-4" />
              Install App
            </button>
            <button onClick={() => setDismissed(true)}
              className="px-4 py-2.5 rounded-xl glass text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Not now
            </button>
          </div>

          <p className="text-[10px] text-muted-foreground text-center mt-3 opacity-60">
            {/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
              ? "Add to home screen for the best experience"
              : "Works offline once installed"}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

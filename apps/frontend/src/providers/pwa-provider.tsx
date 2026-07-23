"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useOffline } from "@/hooks/useOffline";
import { getSetting, saveSetting } from "@/lib/db";

interface PWAContextType {
  isInstallable: boolean;
  installPrompt: () => Promise<void>;
  isOffline: boolean;
  pendingActions: number;
  isSyncing: boolean;
  lastSyncTime: string | null;
  sync: () => void;
  storageUsage: { usage: number; quota: number; percentage: number } | null;
  isPWA: boolean;
}

const PWAContext = createContext<PWAContextType>({
  isInstallable: false,
  installPrompt: async () => {},
  isOffline: false,
  pendingActions: 0,
  isSyncing: false,
  lastSyncTime: null,
  sync: () => {},
  storageUsage: null,
  isPWA: false,
});

export const usePWA = () => useContext(PWAContext);

export function PWAProvider({ children }: { children: ReactNode }) {
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPWA, setIsPWA] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const offline = useOffline();

  useEffect(() => {
    setIsPWA(window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true);
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const register = async () => {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
          navigator.serviceWorker.addEventListener("message", (event) => {
            if (event.data?.type === "SYNC_COMPLETE") setLastSyncTime(new Date().toISOString());
          });
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  if (window.confirm("A new version of ClearPath is available. Update now?")) {
                    newWorker.postMessage({ type: "SKIP_WAITING" });
                    window.location.reload();
                  }
                }
              });
            }
          });
        } catch (e) { console.error("SW registration failed:", e); }
      };
      register();
    }
  }, []);

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); setIsInstallable(true); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    getSetting<string>("last-sync-time").then((t) => { if (t) setLastSyncTime(t); });
  }, []);

  useEffect(() => {
    if (offline.lastSyncResult) {
      const now = new Date().toISOString();
      setLastSyncTime(now);
      saveSetting("last-sync-time", now);
    }
  }, [offline.lastSyncResult]);

  const installPrompt = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === "accepted") setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  return (
    <PWAContext.Provider value={{
      isInstallable, installPrompt,
      isOffline: offline.isOffline,
      pendingActions: offline.pendingActions,
      isSyncing: offline.isSyncing,
      lastSyncTime,
      sync: offline.sync,
      storageUsage: offline.storageUsage,
      isPWA,
    }}>
      {children}
    </PWAContext.Provider>
  );
}

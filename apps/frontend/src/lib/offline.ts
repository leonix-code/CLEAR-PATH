import {
  queueAction,
  getPendingActionCount,
  cacheApiResponse,
  getCachedApiResponse,
  clearExpiredCache,
  getCachedClearances,
  cacheClearances,
  getCachedStudents as dbGetCachedStudents,
  cacheStudents as dbCacheStudents,
  getCachedNotifications,
  cacheNotifications,
} from "./db";

export type NetworkStatus = "online" | "offline" | "slow";

export function getNetworkStatus(): NetworkStatus {
  if (typeof navigator === "undefined") return "online";
  return navigator.onLine ? "online" : "offline";
}

export function onNetworkChange(callback: (status: NetworkStatus) => void) {
  const handler = () => callback(getNetworkStatus());
  window.addEventListener("online", handler);
  window.addEventListener("offline", handler);
  return () => {
    window.removeEventListener("online", handler);
    window.removeEventListener("offline", handler);
  };
}

export interface SyncResult {
  success: number;
  failed: number;
  total: number;
}

export async function syncOfflineActions(): Promise<SyncResult> {
  const { getPendingActions, removePendingAction } = await import("./db");
  const actions = await getPendingActions();
  let success = 0;
  let failed = 0;

  for (const action of actions) {
    if (action.retryCount >= action.maxRetries) {
      await removePendingAction(action.id!);
      failed++;
      continue;
    }
    try {
      const token = localStorage.getItem("accessToken");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...action.headers,
      };
      const response = await fetch(action.url, {
        method: action.method,
        headers,
        body: JSON.stringify(action.data),
      });
      if (response.ok) {
        await removePendingAction(action.id!);
        success++;
      } else {
        action.retryCount++;
        const { getDB } = await import("./db");
        const db = await getDB();
        await db.put("pending-actions", action);
        failed++;
      }
    } catch {
      action.retryCount++;
      const { getDB } = await import("./db");
      const db = await getDB();
      await db.put("pending-actions", action);
      failed++;
    }
  }
  return { success, failed, total: actions.length };
}

export async function getPendingCount(): Promise<number> {
  return getPendingActionCount();
}

export async function offlineFetch<T>(
  url: string,
  options?: {
    ttlSeconds?: number;
    cacheKey?: string;
    onCacheHit?: (data: T) => void;
  }
): Promise<{ data: T; source: "cache" | "network" | "offline-fallback" }> {
  const cacheKey = options?.cacheKey || url;

  if (navigator.onLine) {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (response.ok) {
        const data: T = await response.json();
        await cacheApiResponse(cacheKey, data, options?.ttlSeconds || 300);
        return { data, source: "network" };
      }
    } catch {
      // Fall through to cache
    }
  }

  const cached = await getCachedApiResponse<T>(cacheKey);
  if (cached !== null) {
    options?.onCacheHit?.(cached);
    return { data: cached, source: "cache" };
  }

  if (url.includes("/clearance")) {
    const clearances = (await getCachedClearances()) as unknown as T;
    if (clearances) return { data: clearances, source: "offline-fallback" };
  }
  if (url.includes("/students")) {
    const students = (await dbGetCachedStudents()) as unknown as T;
    if (students) return { data: students, source: "offline-fallback" };
  }
  if (url.includes("/notifications")) {
    const notifications = (await getCachedNotifications()) as unknown as T;
    if (notifications)
      return { data: notifications, source: "offline-fallback" };
  }

  throw new Error("No data available offline");
}

export async function submitOfflineAction(
  url: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  data: any,
  label: string,
  options?: { maxRetries?: number; headers?: Record<string, string> }
) {
  await queueAction({
    url,
    method,
    data,
    headers: options?.headers,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    maxRetries: options?.maxRetries ?? 3,
    label,
  });

  if ("serviceWorker" in navigator && "SyncManager" in window) {
    try {
      const registration = await navigator.serviceWorker.ready as any;
      if (registration.sync) {
        await registration.sync.register("sync-all");
      }
    } catch {
      // Background sync not available
    }
  }
}

export async function runCacheCleanup() {
  await clearExpiredCache();
}

export async function getStorageEstimate() {
  if ("storage" in navigator && "estimate" in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
      percentage: estimate.quota
        ? Math.round(((estimate.usage || 0) / estimate.quota) * 100)
        : 0,
    };
  }
  return null;
}

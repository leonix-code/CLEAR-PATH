// ClearPath PWA Service Worker
// Version: 2.0.0

const CACHE_NAME = "clearpath-v2";
const STATIC_CACHE = "clearpath-static-v2";
const API_CACHE = "clearpath-api-v2";
const FONT_CACHE = "clearpath-fonts-v2";

const STATIC_ASSETS = [
  "/",
  "/login",
  "/offline",
  "/manifest.json",
];

// Install - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== API_CACHE && key !== FONT_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Helper: network-first with cache fallback
async function networkFirst(request, cacheName = API_CACHE, ttl = 300) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // For navigation requests, serve offline page
    if (request.mode === "navigate") {
      return caches.match("/offline");
    }
    return new Response(JSON.stringify({ error: "offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Helper: cache-first with network update
async function cacheFirst(request, cacheName = STATIC_CACHE) {
  const cached = await caches.match(request);
  if (cached) {
    // Update cache in background
    fetch(request).then((response) => {
      if (response.ok) {
        caches.open(cacheName).then((cache) => cache.put(request, response));
      }
    }).catch(() => {});
    return cached;
  }
  return fetch(request).then((response) => {
    if (response.ok) {
      caches.open(cacheName).then((cache) => cache.put(request, response));
    }
    return response;
  });
}

// Fetch - smart caching strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Same-origin only
  if (url.origin !== self.location.origin) {
    // For CDN fonts and images, use cache-first
    if (url.hostname.includes("fonts") || url.hostname.includes("google")) {
      event.respondWith(cacheFirst(request, FONT_CACHE));
    }
    return;
  }

  // API requests - network first with cache fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Next.js static assets (_next/static) - cache first
  if (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/static")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Navigation requests - network first
  if (request.mode === "navigate") {
    event.respondWith(
      networkFirst(request, STATIC_CACHE).catch(() => {
        return caches.match("/offline");
      })
    );
    return;
  }

  // Everything else - network first
  event.respondWith(networkFirst(request));
});

// ── IndexedDB helper (inlined for SW context) ──────────

function openDB(dbName, version, upgradeCallback) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version);
    request.onupgradeneeded = (event) => upgradeCallback(request.result, event);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getPendingActions() {
  try {
    const db = await openDB("clearpath-offline", 2, (db) => {
      if (!db.objectStoreNames.contains("pending-actions")) {
        db.createObjectStore("pending-actions", { keyPath: "id", autoIncrement: true });
      }
    });
    const tx = db.transaction("pending-actions", "readonly");
    const store = tx.objectStore("pending-actions");
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

async function removePendingAction(id) {
  try {
    const db = await openDB("clearpath-offline", 2, () => {});
    const tx = db.transaction("pending-actions", "readwrite");
    tx.objectStore("pending-actions").delete(id);
    await new Promise((resolve) => { tx.oncomplete = resolve; });
  } catch {}
}

// ── Background Sync ────────────────────────────────────

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-all" || event.tag === "sync-clearance") {
    event.waitUntil(processPendingActions());
  }
});

async function processPendingActions() {
  const actions = await getPendingActions();
  let synced = 0;

  for (const action of actions) {
    try {
      const response = await fetch(action.url, {
        method: action.method,
        headers: {
          "Content-Type": "application/json",
          ...(action.headers || {}),
        },
        body: JSON.stringify(action.data),
      });

      if (response.ok) {
        await removePendingAction(action.id);
        synced++;
      }
    } catch (e) {
      console.error("Sync failed for action:", action.id, e);
    }
  }

  // Notify all clients of sync result
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({
      type: "SYNC_COMPLETE",
      payload: { synced, total: actions.length },
    });
  });
}

// ── Push Notifications ─────────────────────────────────

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.message || data.body || "",
      icon: data.icon || "/icon-192x192.png",
      badge: data.badge || "/icon-192x192.png",
      data: data.data || {},
      actions: data.actions || [
        { action: "view", title: "View" },
        { action: "dismiss", title: "Dismiss" },
      ],
      vibrate: [200, 100, 200],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "ClearPath", options)
    );
  } catch {}
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const urlToOpen = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// ── Message handling for client communication ──────────

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data && event.data.type === "SYNC_NOW") {
    event.waitUntil(processPendingActions());
  }
});

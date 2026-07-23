import { openDB, DBSchema, IDBPDatabase } from 'idb';

// ── Database Schema ───────────────────────────────────

interface ClearPathDB extends DBSchema {
  'clearance-requests': {
    key: string;
    value: {
      id: string;
      studentId: string;
      status: string;
      semesterName: string;
      academicYear: string;
      approvals: Array<{ role: string; status: string }>;
      createdAt: string;
      syncedAt: string;
    };
    indexes: {
      'by-student': string;
      'by-status': string;
    };
  };
  'students-cache': {
    key: string;
    value: {
      id: string;
      studentId: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      department?: string;
      course?: string;
      level: number;
      clearanceStatus?: string;
      eligibilityStatus?: string;
      syncedAt: string;
    };
    indexes: {
      'by-studentId': string;
      'by-name': string;
    };
  };
  'notifications': {
    key: string;
    value: {
      id: string;
      title: string;
      message: string;
      type: string;
      isRead: boolean;
      createdAt: string;
    };
    indexes: {
      'by-read': number;
      'by-date': string;
    };
  };
  'api-cache': {
    key: string;
    value: {
      url: string;
      data: any;
      headers: Record<string, string>;
      cachedAt: string;
      ttl: number;
    };
    indexes: {
      'by-url': string;
    };
  };
  'pending-actions': {
    key: number;
    value: {
      id?: number;
      url: string;
      method: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
      data: any;
      headers?: Record<string, string>;
      createdAt: string;
      retryCount: number;
      maxRetries: number;
      label: string;
    };
  };
  'user-settings': {
    key: string;
    value: {
      key: string;
      value: any;
      updatedAt: string;
    };
  };
}

const DB_NAME = 'clearpath-offline';
const DB_VERSION = 2;

let dbInstance: IDBPDatabase<ClearPathDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<ClearPathDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<ClearPathDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, _newVersion, transaction) {
      if (oldVersion < 1) {
        const clearanceStore = db.createObjectStore('clearance-requests', { keyPath: 'id' });
        clearanceStore.createIndex('by-student', 'studentId');
        clearanceStore.createIndex('by-status', 'status');

        const studentStore = db.createObjectStore('students-cache', { keyPath: 'id' });
        studentStore.createIndex('by-studentId', 'studentId');
        studentStore.createIndex('by-name', 'lastName');

        db.createObjectStore('notifications', { keyPath: 'id' }).createIndex('by-read', 'isRead');
        db.createObjectStore('api-cache', { keyPath: 'url' }).createIndex('by-url', 'url');
        db.createObjectStore('pending-actions', { keyPath: 'id', autoIncrement: true });
      }

      if (oldVersion < 2) {
        if (!transaction.objectStoreNames.contains('user-settings')) {
          db.createObjectStore('user-settings', { keyPath: 'key' });
        }
      }
    },
  });

  return dbInstance;
}

export async function cacheClearances(clearances: ClearPathDB['clearance-requests']['value'][]) {
  const db = await getDB();
  const tx = db.transaction('clearance-requests', 'readwrite');
  const now = new Date().toISOString();
  for (const c of clearances) await tx.store.put({ ...c, syncedAt: now });
  await tx.done;
}

export async function getCachedClearances(studentId?: string): Promise<ClearPathDB['clearance-requests']['value'][]> {
  const db = await getDB();
  if (studentId) return db.getAllFromIndex('clearance-requests', 'by-student', studentId);
  return db.getAll('clearance-requests');
}

export async function cacheStudents(students: ClearPathDB['students-cache']['value'][]) {
  const db = await getDB();
  const tx = db.transaction('students-cache', 'readwrite');
  const now = new Date().toISOString();
  for (const s of students) await tx.store.put({ ...s, syncedAt: now });
  await tx.done;
}

export async function getCachedStudent(studentId: string) {
  const db = await getDB();
  const index = db.transaction('students-cache').store.index('by-studentId');
  return index.get(studentId);
}

export async function getCachedStudents(search?: string) {
  const db = await getDB();
  const all = await db.getAll('students-cache');
  if (!search) return all;
  const q = search.toLowerCase();
  return all.filter(s => s.firstName.toLowerCase().includes(q) || s.lastName.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q));
}

export async function cacheNotifications(notifications: ClearPathDB['notifications']['value'][]) {
  const db = await getDB();
  const tx = db.transaction('notifications', 'readwrite');
  for (const n of notifications) await tx.store.put(n);
  await tx.done;
}

export async function getCachedNotifications(unreadOnly = false) {
  const db = await getDB();
  if (unreadOnly) return db.getAllFromIndex('notifications', 'by-read', 0);
  return db.getAll('notifications');
}

export async function markNotificationRead(id: string) {
  const db = await getDB();
  const tx = db.transaction('notifications', 'readwrite');
  const notif = await tx.store.get(id);
  if (notif) await tx.store.put({ ...notif, isRead: true });
  await tx.done;
}

export async function cacheApiResponse(url: string, data: any, ttlSeconds = 300) {
  const db = await getDB();
  await db.put('api-cache', { url, data, headers: {}, cachedAt: new Date().toISOString(), ttl: ttlSeconds });
}

export async function getCachedApiResponse<T>(url: string): Promise<T | null> {
  const db = await getDB();
  const cached = await db.get('api-cache', url);
  if (!cached) return null;
  const age = (Date.now() - new Date(cached.cachedAt).getTime()) / 1000;
  if (age > cached.ttl) { await db.delete('api-cache', url); return null; }
  return cached.data as T;
}

export async function queueAction(action: Omit<ClearPathDB['pending-actions']['value'], 'id'>) {
  const db = await getDB();
  return db.add('pending-actions', action);
}

export async function getPendingActions() {
  const db = await getDB();
  return db.getAll('pending-actions');
}

export async function removePendingAction(id: number) {
  const db = await getDB();
  await db.delete('pending-actions', id);
}

export async function getPendingActionCount(): Promise<number> {
  const db = await getDB();
  const all = await db.getAllKeys('pending-actions');
  return all.length;
}

export async function clearExpiredCache() {
  const db = await getDB();
  const tx = db.transaction('api-cache', 'readwrite');
  const all = await tx.store.getAll();
  const now = Date.now();
  for (const cached of all) {
    const age = (now - new Date(cached.cachedAt).getTime()) / 1000;
    if (age > cached.ttl) await tx.store.delete(cached.url);
  }
  await tx.done;
}

export async function saveSetting(key: string, value: any) {
  const db = await getDB();
  await db.put('user-settings', { key, value, updatedAt: new Date().toISOString() });
}

export async function getSetting<T>(key: string): Promise<T | null> {
  const db = await getDB();
  const entry = await db.get('user-settings', key);
  return entry?.value ?? null;
}

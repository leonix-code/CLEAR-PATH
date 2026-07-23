'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getNetworkStatus,
  onNetworkChange,
  syncOfflineActions,
  getPendingCount,
  submitOfflineAction,
  getStorageEstimate,
  NetworkStatus,
  SyncResult,
} from '@/lib/offline';

interface OfflineState {
  isOnline: NetworkStatus;
  pendingActions: number;
  isSyncing: boolean;
  lastSyncResult: SyncResult | null;
  storageUsage: { usage: number; quota: number; percentage: number } | null;
}

export function useOffline() {
  const [state, setState] = useState<OfflineState>({
    isOnline: 'online',
    pendingActions: 0,
    isSyncing: false,
    lastSyncResult: null,
    storageUsage: null,
  });
  const isSyncingRef = useRef(false);

  useEffect(() => {
    setState((prev) => ({ ...prev, isOnline: getNetworkStatus() }));
    const cleanup = onNetworkChange((status) => {
      setState((prev) => ({ ...prev, isOnline: status }));
    });
    return cleanup;
  }, []);

  useEffect(() => {
    if (state.isOnline === 'online' && state.pendingActions > 0) {
      handleSync();
    }
  }, [state.isOnline, state.pendingActions]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const count = await getPendingCount();
      setState((prev) => ({ ...prev, pendingActions: count }));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    getStorageEstimate().then((estimate) => {
      if (estimate) setState((prev) => ({ ...prev, storageUsage: estimate }));
    });
  }, []);

  const handleSync = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setState((prev) => ({ ...prev, isSyncing: true }));
    try {
      const result = await syncOfflineActions();
      const count = await getPendingCount();
      setState((prev) => ({ ...prev, isSyncing: false, lastSyncResult: result, pendingActions: count }));
    } catch {
      setState((prev) => ({ ...prev, isSyncing: false }));
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  const submitAction = useCallback(async (url: string, method: 'POST' | 'PATCH' | 'PUT' | 'DELETE', data: any, label: string) => {
    await submitOfflineAction(url, method, data, label);
    const count = await getPendingCount();
    setState((prev) => ({ ...prev, pendingActions: count }));
  }, []);

  const refreshPendingCount = useCallback(async () => {
    const count = await getPendingCount();
    setState((prev) => ({ ...prev, pendingActions: count }));
  }, []);

  return { ...state, isOffline: state.isOnline === 'offline', sync: handleSync, submitAction, refreshPendingCount };
}

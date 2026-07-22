"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

function readRaw(key: string, fallback: string) {
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeRaw(key: string, value: string) {
  window.localStorage.setItem(key, value);
  window.dispatchEvent(new CustomEvent(`lifeos-storage:${key}`));
}

/**
 * Browser-local JSON state with SSR-safe hydration via useSyncExternalStore.
 * This is private to the current browser; it is not Obsidian or cross-device sync.
 */
export function useBrowserStorage<T>(key: string, fallback: T): [T, (value: T) => void] {
  const fallbackRaw = useMemo(() => JSON.stringify(fallback), [fallback]);

  const subscribe = useCallback((onStoreChange: () => void) => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === key) onStoreChange();
    };
    const onLocal = () => onStoreChange();
    window.addEventListener("storage", onStorage);
    window.addEventListener(`lifeos-storage:${key}`, onLocal);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(`lifeos-storage:${key}`, onLocal);
    };
  }, [key]);

  const getSnapshot = useCallback(() => readRaw(key, fallbackRaw), [key, fallbackRaw]);
  const getServerSnapshot = useCallback(() => fallbackRaw, [fallbackRaw]);
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const value = useMemo(() => {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }, [raw, fallback]);

  const setValue = useCallback((next: T) => {
    writeRaw(key, JSON.stringify(next));
  }, [key]);

  return [value, setValue];
}

export function useBrowserStorageString(key: string, fallback = ""): [string, (value: string) => void] {
  const subscribe = useCallback((onStoreChange: () => void) => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === key) onStoreChange();
    };
    const onLocal = () => onStoreChange();
    window.addEventListener("storage", onStorage);
    window.addEventListener(`lifeos-storage:${key}`, onLocal);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(`lifeos-storage:${key}`, onLocal);
    };
  }, [key]);

  const getSnapshot = useCallback(() => readRaw(key, fallback), [key, fallback]);
  const getServerSnapshot = useCallback(() => fallback, [fallback]);
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback((next: string) => {
    writeRaw(key, next);
  }, [key]);

  return [value, setValue];
}

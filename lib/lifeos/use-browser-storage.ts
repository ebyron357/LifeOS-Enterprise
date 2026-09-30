"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

export const STORAGE_READ_ERROR = "Browser storage is unavailable (private mode or blocked). Showing defaults; changes may not persist.";
export const STORAGE_WRITE_ERROR = "Browser storage refused the save (storage full or private mode). Your last change was not saved.";

/** Last storage failure per key. Surfaced as a diagnostic instead of throwing into React. */
const storageErrors = new Map<string, string>();

function eventName(key: string) {
  return `lifeos-storage:${key}`;
}

function notify(key: string) {
  try {
    window.dispatchEvent(new CustomEvent(eventName(key)));
  } catch {
    // Event dispatch must never break a render or click handler.
  }
}

function setStorageError(key: string, message: string | null) {
  const previous = storageErrors.get(key) ?? null;
  if (previous === message) return false;
  if (message) storageErrors.set(key, message);
  else storageErrors.delete(key);
  return true;
}

/** Reads a raw value without throwing. Returns `fallback` when storage is missing or blocked. */
export function safeReadStorage(key: string, fallback: string): string {
  try {
    const value = window.localStorage.getItem(key);
    // Access recovered: drop a stale read error, but keep a write error until a write succeeds.
    if (storageErrors.get(key) === STORAGE_READ_ERROR) storageErrors.delete(key);
    return value ?? fallback;
  } catch {
    // Recorded for the diagnostic snapshot; no event here because reads run during render.
    storageErrors.set(key, STORAGE_READ_ERROR);
    return fallback;
  }
}

/** Writes a raw value without throwing. Returns an error message when the write failed. */
export function safeWriteStorage(key: string, value: string): string | null {
  let error: string | null = null;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    error = STORAGE_WRITE_ERROR;
  }
  setStorageError(key, error);
  notify(key);
  return error;
}

function useStorageSubscription(key: string) {
  return useCallback((onStoreChange: () => void) => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === key) onStoreChange();
    };
    const onLocal = () => onStoreChange();
    window.addEventListener("storage", onStorage);
    window.addEventListener(eventName(key), onLocal);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(eventName(key), onLocal);
    };
  }, [key]);
}

/** Current storage diagnostic for `key`, or null when reads and writes are healthy. */
export function useBrowserStorageError(key: string): string | null {
  const subscribe = useStorageSubscription(key);
  const getSnapshot = useCallback(() => storageErrors.get(key) ?? null, [key]);
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

/**
 * Browser-local JSON state with SSR-safe hydration via useSyncExternalStore.
 * This is private to the current browser; it is not Obsidian or cross-device sync.
 * Reads and writes never throw; failures are exposed as the third tuple entry.
 */
export function useBrowserStorage<T>(key: string, fallback: T): [T, (value: T) => void, string | null] {
  const fallbackRaw = useMemo(() => JSON.stringify(fallback), [fallback]);
  const subscribe = useStorageSubscription(key);

  const getSnapshot = useCallback(() => safeReadStorage(key, fallbackRaw), [key, fallbackRaw]);
  const getServerSnapshot = useCallback(() => fallbackRaw, [fallbackRaw]);
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const storageError = useBrowserStorageError(key);

  const value = useMemo(() => {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }, [raw, fallback]);

  const setValue = useCallback((next: T) => {
    let serialized: string;
    try {
      serialized = JSON.stringify(next);
    } catch {
      if (setStorageError(key, STORAGE_WRITE_ERROR)) notify(key);
      return;
    }
    safeWriteStorage(key, serialized);
  }, [key]);

  return [value, setValue, storageError];
}

export function useBrowserStorageString(key: string, fallback = ""): [string, (value: string) => void, string | null] {
  const subscribe = useStorageSubscription(key);
  const getSnapshot = useCallback(() => safeReadStorage(key, fallback), [key, fallback]);
  const getServerSnapshot = useCallback(() => fallback, [fallback]);
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const storageError = useBrowserStorageError(key);

  const setValue = useCallback((next: string) => {
    safeWriteStorage(key, next);
  }, [key]);

  return [value, setValue, storageError];
}

"use client";

import { useCallback, useMemo } from "react";
import { useBrowserStorage } from "@/lib/lifeos/use-browser-storage";
import type { DailyBriefStoreState } from "./types";
import { emptyStoreState } from "./types";

const STORAGE_KEY = "lifeos-daily-brief-store-v1";

/**
 * Browser-local persistence for Daily Operations Brief runtime state
 * (revision history, end-of-day reviews). This mirrors the existing
 * `useBrowserStorage` pattern already used for operations-surface view
 * state and voice preferences — it is private to the current browser, not
 * Obsidian or cross-device sync. Canonical project metadata changes are
 * never written here; those still route through the existing
 * ChangePlanPersistence → draft-PR path.
 */
export function useDailyBriefStore(): [DailyBriefStoreState, (next: DailyBriefStoreState) => void] {
  const fallback = useMemo(() => emptyStoreState(), []);
  const [state, setState] = useBrowserStorage<DailyBriefStoreState>(STORAGE_KEY, fallback);

  const setValidated = useCallback((next: DailyBriefStoreState) => {
    setState(next);
  }, [setState]);

  return [state, setValidated];
}

/**
 * Reads the persisted store directly from localStorage, bypassing React
 * state. Used only for the one-time "generate today's brief if missing"
 * bootstrap effect, so it is never racing a not-yet-hydrated
 * `useSyncExternalStore` snapshot on the very first client render.
 */
export function readStoredDailyBriefState(): DailyBriefStoreState {
  if (typeof window === "undefined") return emptyStoreState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStoreState();
    return JSON.parse(raw) as DailyBriefStoreState;
  } catch {
    return emptyStoreState();
  }
}

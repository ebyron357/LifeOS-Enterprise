"use client";

import { useCallback, useMemo } from "react";
import { useBrowserStorage } from "@/lib/lifeos/use-browser-storage";
import type { DailyBriefStoreState } from "./types";
import { emptyStoreState } from "./types";

const STORAGE_KEY = "lifeos-daily-brief-store-v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Rejects valid JSON that does not match the current top-level store shape.
 * This prevents an older schema, manual edit, or partial write from crashing
 * the Daily Brief UI before it can recover.
 */
export function isDailyBriefStoreState(value: unknown): value is DailyBriefStoreState {
  if (!isRecord(value) || value.schemaVersion !== 1) return false;
  if (!isRecord(value.revisionsByDate) || !isRecord(value.endOfDayReviewsByDate)) return false;
  return Object.values(value.revisionsByDate).every(Array.isArray);
}

/**
 * Browser-local persistence for Daily Operations Brief runtime state
 * (revision history, end-of-day reviews). This mirrors the existing
 * useBrowserStorage pattern already used for operations-surface view
 * state and voice preferences. Canonical project metadata changes are
 * never written here; those still route through the existing
 * ChangePlanPersistence → draft-PR path.
 */
export function useDailyBriefStore(): [DailyBriefStoreState, (next: DailyBriefStoreState) => void] {
  const fallback = useMemo(() => emptyStoreState(), []);
  const [rawState, setState] = useBrowserStorage<unknown>(STORAGE_KEY, fallback);
  const state = isDailyBriefStoreState(rawState) ? rawState : fallback;

  const setValidated = useCallback((next: DailyBriefStoreState) => {
    if (!isDailyBriefStoreState(next)) throw new Error("Invalid Daily Brief store state.");
    setState(next);
  }, [setState]);

  return [state, setValidated];
}

/**
 * Reads the persisted store directly from localStorage, bypassing React
 * state. Used only for the one-time generate-if-missing bootstrap effect.
 */
export function readStoredDailyBriefState(): DailyBriefStoreState {
  if (typeof window === "undefined") return emptyStoreState();
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
    return isDailyBriefStoreState(parsed) ? parsed : emptyStoreState();
  } catch {
    return emptyStoreState();
  }
}

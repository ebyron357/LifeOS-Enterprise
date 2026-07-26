"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { COMMAND_CENTER_WIDGET_IDS, createDefaultWorkspaceLayout, LAYOUT_STORAGE_KEY } from "@/lib/workspace/default-layout";
import { parseWorkspaceLayout, serializeWorkspaceLayout } from "@/lib/workspace/layout-storage";
import type { BreakpointLayouts, WorkspaceLayoutState } from "@/lib/workspace/types";

type WorkspaceContextValue = {
  state: WorkspaceLayoutState;
  hydrated: boolean;
  setLayouts: (layouts: BreakpointLayouts) => void;
  resetLayout: () => void;
  setFocusedWidget: (id: string | null) => void;
  focusNextWidget: () => void;
  toggleMinimized: (id: string) => void;
  setReducedMotion: (value: boolean) => void;
  toggleReducedMotion: () => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);
const STORAGE_EVENT = `lifeos-storage:${LAYOUT_STORAGE_KEY}`;
const defaultRaw = serializeWorkspaceLayout(createDefaultWorkspaceLayout());

function readRaw() {
  try {
    return window.localStorage.getItem(LAYOUT_STORAGE_KEY) ?? defaultRaw;
  } catch {
    return defaultRaw;
  }
}

function writeRaw(value: string) {
  try {
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, value);
    window.localStorage.setItem("lifeos-workspace-os-v1-last-workspace", parseWorkspaceLayout(value).workspaceId);
  } catch {
    // Ignore quota / private-mode write failures.
  }
  window.dispatchEvent(new CustomEvent(STORAGE_EVENT));
}

function updateState(updater: (current: WorkspaceLayoutState) => WorkspaceLayoutState) {
  const current = parseWorkspaceLayout(readRaw());
  writeRaw(serializeWorkspaceLayout(updater(current)));
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const subscribe = useCallback((onStoreChange: () => void) => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === LAYOUT_STORAGE_KEY) onStoreChange();
    };
    const onLocal = () => onStoreChange();
    window.addEventListener("storage", onStorage);
    window.addEventListener(STORAGE_EVENT, onLocal);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(STORAGE_EVENT, onLocal);
    };
  }, []);

  const raw = useSyncExternalStore(subscribe, readRaw, () => defaultRaw);
  const state = useMemo(() => parseWorkspaceLayout(raw), [raw]);

  useEffect(() => {
    document.documentElement.dataset.lifeosReducedMotion = state.reducedMotion ? "true" : "false";
  }, [state.reducedMotion]);

  const setLayouts = useCallback((layouts: BreakpointLayouts) => {
    updateState((current) => ({ ...current, layouts }));
  }, []);

  const resetLayout = useCallback(() => {
    writeRaw(defaultRaw);
  }, []);

  const setFocusedWidget = useCallback((id: string | null) => {
    updateState((current) => ({ ...current, focusedWidgetId: id }));
  }, []);

  const focusNextWidget = useCallback(() => {
    updateState((current) => {
      const visible = COMMAND_CENTER_WIDGET_IDS.filter((id) => !current.widgets[id]?.hidden);
      if (!visible.length) return current;
      const index = current.focusedWidgetId ? visible.indexOf(current.focusedWidgetId as typeof visible[number]) : -1;
      const next = visible[(index + 1) % visible.length];
      return { ...current, focusedWidgetId: next };
    });
  }, []);

  const toggleMinimized = useCallback((id: string) => {
    updateState((current) => {
      const existing = current.widgets[id] ?? { minimized: false, hidden: false };
      return {
        ...current,
        widgets: {
          ...current.widgets,
          [id]: { ...existing, minimized: !existing.minimized },
        },
      };
    });
  }, []);

  const setReducedMotion = useCallback((value: boolean) => {
    updateState((current) => ({ ...current, reducedMotion: value }));
  }, []);

  const toggleReducedMotion = useCallback(() => {
    updateState((current) => ({ ...current, reducedMotion: !current.reducedMotion }));
  }, []);

  const value = useMemo(
    () => ({
      state,
      hydrated: true,
      setLayouts,
      resetLayout,
      setFocusedWidget,
      focusNextWidget,
      toggleMinimized,
      setReducedMotion,
      toggleReducedMotion,
    }),
    [
      state,
      setLayouts,
      resetLayout,
      setFocusedWidget,
      focusNextWidget,
      toggleMinimized,
      setReducedMotion,
      toggleReducedMotion,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return value;
}

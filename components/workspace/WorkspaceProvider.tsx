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
import {
  moveWidgetInLayout,
  parseWorkspaceLayout,
  parseWorkspaceLayoutWithDiagnostics,
  repairWorkspaceLayout,
  serializeWorkspaceLayout,
} from "@/lib/workspace/layout-storage";
import type { BreakpointLayouts, WorkspaceLayoutState } from "@/lib/workspace/types";

type WorkspaceContextValue = {
  state: WorkspaceLayoutState;
  hydrated: boolean;
  setLayouts: (layouts: BreakpointLayouts) => void;
  /** Restores the default layout. Returns false when the browser refused to save it. */
  resetLayout: () => boolean;
  /** Normalizes the stored layout. `saved` is false when the browser refused the write, so callers never claim success. */
  repairLayout: () => { repairs: string[]; saved: boolean };
  setFocusedWidget: (id: string | null) => void;
  focusNextWidget: () => void;
  toggleMinimized: (id: string) => void;
  setWidgetHidden: (id: string, hidden: boolean) => void;
  moveWidget: (id: string, direction: "up" | "down", options?: { visibleOnly?: boolean }) => void;
  diagnostics: string[];
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

/** Returns false when the browser refused the write (quota, private mode, or storage disabled). */
function writeRaw(value: string): boolean {
  let saved = true;
  try {
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, value);
    window.localStorage.setItem("lifeos-workspace-os-v1-last-workspace", parseWorkspaceLayout(value).workspaceId);
  } catch {
    saved = false;
  }
  window.dispatchEvent(new CustomEvent(STORAGE_EVENT));
  return saved;
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
  const parsed = useMemo(() => parseWorkspaceLayoutWithDiagnostics(raw), [raw]);
  const state = parsed.state;

  useEffect(() => {
    document.documentElement.dataset.lifeosReducedMotion = state.reducedMotion ? "true" : "false";
  }, [state.reducedMotion]);

  const setLayouts = useCallback((layouts: BreakpointLayouts) => {
    updateState((current) => ({ ...current, layouts }));
  }, []);

  const resetLayout = useCallback(() => writeRaw(defaultRaw), []);

  const repairLayout = useCallback(() => {
    const result = repairWorkspaceLayout(readRaw());
    const saved = writeRaw(serializeWorkspaceLayout(result.state));
    return { repairs: result.repairs, saved };
  }, []);

  const setFocusedWidget = useCallback((id: string | null) => {
    updateState((current) => ({ ...current, focusedWidgetId: id }));
  }, []);

  const focusNextWidget = useCallback(() => {
    updateState((current) => {
      const visible = current.widgetOrder.filter((id) => !current.widgets[id]?.hidden);
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

  const setWidgetHidden = useCallback((id: string, hidden: boolean) => {
    updateState((current) => {
      const existing = current.widgets[id] ?? { minimized: false, hidden: false };
      return {
        ...current,
        widgets: {
          ...current.widgets,
          [id]: { ...existing, hidden, minimized: hidden ? false : existing.minimized },
        },
      };
    });
  }, []);

  const moveWidget = useCallback((id: string, direction: "up" | "down", options?: { visibleOnly?: boolean }) => {
    updateState((current) => moveWidgetInLayout(current, id, direction, options));
  }, []);

  const diagnostics = useMemo(() => {
    const messages: string[] = [...parsed.messages];
    if (!state.widgetOrder.length) messages.push("Widget order was empty and repaired.");
    const hiddenAll = COMMAND_CENTER_WIDGET_IDS.every((id) => state.widgets[id]?.hidden);
    if (hiddenAll) messages.push("All widgets are hidden. Use Widget Library to re-add one.");
    return messages;
  }, [parsed.messages, state.widgetOrder, state.widgets]);

  const value = useMemo(
    () => ({
      state,
      hydrated: true,
      setLayouts,
      resetLayout,
      repairLayout,
      setFocusedWidget,
      focusNextWidget,
      toggleMinimized,
      setWidgetHidden,
      moveWidget,
      diagnostics,
      setReducedMotion,
      toggleReducedMotion,
    }),
    [
      state,
      setLayouts,
      resetLayout,
      repairLayout,
      setFocusedWidget,
      focusNextWidget,
      toggleMinimized,
      setWidgetHidden,
      moveWidget,
      diagnostics,
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

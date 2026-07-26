import { createDefaultWorkspaceLayout } from "./default-layout";
import type { BreakpointLayouts, LayoutItem, WorkspaceId, WorkspaceLayoutState } from "./types";

const BREAKPOINTS = ["lg", "md", "sm", "xs"] as const;

function isLayoutItem(value: unknown): value is LayoutItem {
  if (!value || typeof value !== "object") return false;
  const item = value as LayoutItem;
  return (
    typeof item.i === "string"
    && typeof item.x === "number"
    && typeof item.y === "number"
    && typeof item.w === "number"
    && typeof item.h === "number"
    && Number.isFinite(item.x)
    && Number.isFinite(item.y)
    && Number.isFinite(item.w)
    && Number.isFinite(item.h)
  );
}

function isBreakpointLayouts(value: unknown): value is BreakpointLayouts {
  if (!value || typeof value !== "object") return false;
  const layouts = value as BreakpointLayouts;
  return BREAKPOINTS.every((key) => Array.isArray(layouts[key]) && layouts[key].every(isLayoutItem));
}

export function parseWorkspaceLayout(raw: string | null): WorkspaceLayoutState {
  const fallback = createDefaultWorkspaceLayout();
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<WorkspaceLayoutState>;
    if (parsed.version !== 1) return fallback;
    if (!parsed.layouts || !isBreakpointLayouts(parsed.layouts)) return fallback;

    return {
      version: 1,
      workspaceId: (parsed.workspaceId as WorkspaceId) ?? fallback.workspaceId,
      layouts: {
        lg: parsed.layouts.lg.map((item) => ({ ...item })),
        md: parsed.layouts.md.map((item) => ({ ...item })),
        sm: parsed.layouts.sm.map((item) => ({ ...item })),
        xs: parsed.layouts.xs.map((item) => ({ ...item })),
      },
      widgets: {
        ...fallback.widgets,
        ...(parsed.widgets ?? {}),
      },
      focusedWidgetId: typeof parsed.focusedWidgetId === "string" || parsed.focusedWidgetId === null
        ? parsed.focusedWidgetId
        : null,
      reducedMotion: Boolean(parsed.reducedMotion),
    };
  } catch {
    return fallback;
  }
}

export function serializeWorkspaceLayout(state: WorkspaceLayoutState): string {
  return JSON.stringify(state);
}

export function readWorkspaceLayoutFromStorage(storage: Pick<Storage, "getItem"> | null): WorkspaceLayoutState {
  if (!storage) return createDefaultWorkspaceLayout();
  try {
    return parseWorkspaceLayout(storage.getItem("lifeos-workspace-os-v1-layout"));
  } catch {
    return createDefaultWorkspaceLayout();
  }
}

export function writeWorkspaceLayoutToStorage(
  storage: Pick<Storage, "setItem"> | null,
  state: WorkspaceLayoutState,
): void {
  if (!storage) return;
  storage.setItem("lifeos-workspace-os-v1-layout", serializeWorkspaceLayout(state));
}

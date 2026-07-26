import { createDefaultWorkspaceLayout, WORKSPACE_LAYOUT_VERSION } from "./default-layout";
import type { BreakpointLayouts, LayoutItem, WorkspaceId, WorkspaceLayoutState } from "./types";

const BREAKPOINTS = ["lg", "md", "sm", "xs"] as const;
const SUPPORTED_VERSIONS = new Set([1, 2, WORKSPACE_LAYOUT_VERSION]);

function sanitizeLayoutItem(value: unknown): LayoutItem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as LayoutItem;
  if (
    typeof item.i !== "string"
    || typeof item.x !== "number"
    || typeof item.y !== "number"
    || typeof item.w !== "number"
    || typeof item.h !== "number"
    || !Number.isFinite(item.x)
    || !Number.isFinite(item.y)
    || !Number.isFinite(item.w)
    || !Number.isFinite(item.h)
  ) {
    return null;
  }

  // Persist only stable fields. react-grid-layout may emit transient flags.
  const next: LayoutItem = {
    i: item.i,
    x: item.x,
    y: item.y,
    w: item.w,
    h: item.h,
  };
  if (typeof item.minW === "number") next.minW = item.minW;
  if (typeof item.minH === "number") next.minH = item.minH;
  if (typeof item.maxW === "number") next.maxW = item.maxW;
  if (typeof item.maxH === "number") next.maxH = item.maxH;
  if (typeof item.static === "boolean") next.static = item.static;
  return next;
}

function isLayoutItem(value: unknown): value is LayoutItem {
  return sanitizeLayoutItem(value) !== null;
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
    if (!SUPPORTED_VERSIONS.has(parsed.version as number)) return fallback;
    if (!parsed.layouts || !isBreakpointLayouts(parsed.layouts)) return fallback;

    // v1 defaults stacked the md board; migrate those sessions to the v2 board.
    if (parsed.version === 1) return fallback;

    return {
      version: WORKSPACE_LAYOUT_VERSION,
      workspaceId: (parsed.workspaceId as WorkspaceId) ?? fallback.workspaceId,
      layouts: {
        lg: parsed.layouts.lg.map((item) => sanitizeLayoutItem(item)!),
        md: parsed.layouts.md.map((item) => sanitizeLayoutItem(item)!),
        sm: parsed.layouts.sm.map((item) => sanitizeLayoutItem(item)!),
        xs: parsed.layouts.xs.map((item) => sanitizeLayoutItem(item)!),
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

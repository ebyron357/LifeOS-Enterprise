import { createDefaultWorkspaceLayout, WORKSPACE_LAYOUT_VERSION } from "./default-layout";
import type { BreakpointLayouts, CommandCenterWidgetId, LayoutItem, WorkspaceId, WorkspaceLayoutState } from "./types";

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
  return parseWorkspaceLayoutWithDiagnostics(raw).state;
}

export function parseWorkspaceLayoutWithDiagnostics(raw: string | null): {
  state: WorkspaceLayoutState;
  repaired: boolean;
  messages: string[];
} {
  const fallback = createDefaultWorkspaceLayout();
  if (!raw) return { state: fallback, repaired: false, messages: [] };

  try {
    const parsed = JSON.parse(raw) as Partial<WorkspaceLayoutState>;
    if (!SUPPORTED_VERSIONS.has(parsed.version as number)) {
      return {
        state: fallback,
        repaired: true,
        messages: ["Unsupported layout version detected. Default layout restored."],
      };
    }
    if (!parsed.layouts || !isBreakpointLayouts(parsed.layouts)) {
      return {
        state: fallback,
        repaired: true,
        messages: ["Corrupted layout geometry detected. Default layout restored."],
      };
    }

    // v1 defaults stacked the md board; migrate those sessions to the v2 board.
    if (parsed.version === 1) {
      return {
        state: fallback,
        repaired: true,
        messages: ["Legacy v1 layout migrated to v2 multi-column defaults."],
      };
    }

    return {
      state: {
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
      widgetOrder: sanitizeWidgetOrder(parsed.widgetOrder, fallback),
      focusedWidgetId: typeof parsed.focusedWidgetId === "string" || parsed.focusedWidgetId === null
        ? parsed.focusedWidgetId
        : null,
      reducedMotion: Boolean(parsed.reducedMotion),
      },
      repaired: false,
      messages: [],
    };
  } catch {
    return {
      state: fallback,
      repaired: true,
      messages: ["Corrupted layout state JSON detected. Default layout restored."],
    };
  }

  function sanitizeWidgetOrder(value: unknown, fallback: WorkspaceLayoutState): CommandCenterWidgetId[] {
    if (!Array.isArray(value)) return fallback.widgetOrder;
    const known = new Set(fallback.widgetOrder);
    const fromState = value.filter((item): item is CommandCenterWidgetId => typeof item === "string" && known.has(item as CommandCenterWidgetId));
    const missing = fallback.widgetOrder.filter((item) => !fromState.includes(item));
    return [...fromState, ...missing];
  }
}

export function swapLayoutItemPositions(
  layouts: BreakpointLayouts,
  firstId: string,
  secondId: string,
): BreakpointLayouts {
  const next = { ...layouts };
  for (const key of BREAKPOINTS) {
    next[key] = layouts[key].map((item) => ({ ...item }));
    const first = next[key].find((item) => item.i === firstId);
    const second = next[key].find((item) => item.i === secondId);
    if (!first || !second) continue;
    const x = first.x;
    const y = first.y;
    first.x = second.x;
    first.y = second.y;
    second.x = x;
    second.y = y;
  }
  return next;
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

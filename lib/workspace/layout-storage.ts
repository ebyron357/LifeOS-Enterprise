import {
  COMMAND_CENTER_WIDGET_IDS,
  COMMAND_CENTER_WIDGET_META,
  createDefaultWorkspaceLayout,
  WORKSPACE_GRID_COLS,
  WORKSPACE_LAYOUT_VERSION,
} from "./default-layout";
import type { BreakpointLayouts, CommandCenterWidgetId, LayoutItem, WorkspaceId, WorkspaceLayoutState } from "./types";
import { WORKSPACES } from "./workspaces";

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
    // Deduplicated so a corrupt order can never render the same widget twice.
    const fromState = [...new Set(value.filter((item): item is CommandCenterWidgetId => typeof item === "string" && known.has(item as CommandCenterWidgetId)))];
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

export type LayoutRepairResult = {
  state: WorkspaceLayoutState;
  /** Human-readable list of what was fixed. Empty when the stored layout was already healthy. */
  repairs: string[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function widgetTitle(id: string): string {
  return COMMAND_CENTER_WIDGET_META[id as CommandCenterWidgetId]?.title ?? id;
}

function hasSaneGeometry(item: LayoutItem): boolean {
  return item.x >= 0 && item.y >= 0 && item.w >= 1 && item.h >= 1;
}

function finiteWhole(value: number | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value) : undefined;
}

/**
 * Snaps an item to whole grid units, fits it inside `cols` columns, and makes its size
 * constraints consistent (1 <= minW <= w <= maxW <= cols; 1 <= minH <= h <= maxH).
 */
function clampToGrid(item: LayoutItem, cols: number): LayoutItem {
  const minWRaw = finiteWhole(item.minW);
  const maxWRaw = finiteWhole(item.maxW);
  const minHRaw = finiteWhole(item.minH);
  const maxHRaw = finiteWhole(item.maxH);

  const minW = minWRaw === undefined ? undefined : Math.min(cols, Math.max(1, minWRaw));
  const maxW = maxWRaw === undefined ? undefined : Math.min(cols, Math.max(minW ?? 1, maxWRaw));
  const minH = minHRaw === undefined ? undefined : Math.max(1, minHRaw);
  const maxH = maxHRaw === undefined ? undefined : Math.max(minH ?? 1, maxHRaw);

  const w = Math.min(maxW ?? cols, Math.max(minW ?? 1, Math.round(item.w)));
  const h = Math.min(maxH ?? Number.MAX_SAFE_INTEGER, Math.max(minH ?? 1, Math.round(item.h)));
  const x = Math.min(cols - w, Math.max(0, Math.round(item.x)));
  const y = Math.max(0, Math.round(item.y));

  const next: LayoutItem = { i: item.i, x, y, w, h };
  if (minW !== undefined) next.minW = minW;
  if (minH !== undefined) next.minH = minH;
  if (maxW !== undefined) next.maxW = maxW;
  if (maxH !== undefined) next.maxH = maxH;
  if (item.static !== undefined) next.static = item.static;
  return next;
}

/**
 * Normalizes a stored layout instead of only re-parsing it: drops unknown or duplicate
 * widgets, restores missing default items, fixes invalid chrome values, and clears a stale
 * focus. Returns what was repaired so the owner can see it.
 */
export function repairWorkspaceLayout(raw: string | null): LayoutRepairResult {
  const defaults = createDefaultWorkspaceLayout();
  if (!raw) return { state: defaults, repairs: [] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { state: defaults, repairs: ["Unreadable layout JSON replaced with the default layout."] };
  }
  const input = asRecord(parsed);
  if (!input) {
    return { state: defaults, repairs: ["Stored layout was not an object. Default layout restored."] };
  }
  if (!SUPPORTED_VERSIONS.has(input.version as number)) {
    return { state: defaults, repairs: ["Unsupported layout version. Default layout restored."] };
  }
  if (input.version === 1) {
    return { state: defaults, repairs: ["Legacy v1 layout migrated to v2 multi-column defaults."] };
  }

  const repairs: string[] = [];
  const known = new Set<string>(COMMAND_CENTER_WIDGET_IDS);
  const unknownIds = new Set<string>();
  const duplicateIds = new Set<string>();
  const restoredIds = new Set<string>();
  const rebuiltBreakpoints: string[] = [];
  const clampedItems: string[] = [];
  let invalidItems = 0;

  const rawLayouts = asRecord(input.layouts);
  const layouts = {} as BreakpointLayouts;
  for (const key of BREAKPOINTS) {
    const list = rawLayouts?.[key];
    if (!Array.isArray(list)) {
      rebuiltBreakpoints.push(key);
      layouts[key] = defaults.layouts[key].map((item) => ({ ...item }));
      continue;
    }
    const seen = new Set<string>();
    const items: LayoutItem[] = [];
    for (const entry of list) {
      const item = sanitizeLayoutItem(entry);
      if (!item || !hasSaneGeometry(item)) {
        invalidItems += 1;
        continue;
      }
      if (!known.has(item.i)) {
        unknownIds.add(item.i);
        continue;
      }
      if (seen.has(item.i)) {
        duplicateIds.add(item.i);
        continue;
      }
      seen.add(item.i);
      const fitted = clampToGrid(item, WORKSPACE_GRID_COLS[key]);
      const changed = (["x", "y", "w", "h", "minW", "minH", "maxW", "maxH"] as const)
        .some((field) => fitted[field] !== item[field]);
      if (changed) {
        clampedItems.push(`${widgetTitle(item.i)} (${key})`);
      }
      items.push(fitted);
    }
    for (const fallbackItem of defaults.layouts[key]) {
      if (seen.has(fallbackItem.i)) continue;
      restoredIds.add(fallbackItem.i);
      items.push({ ...fallbackItem });
    }
    layouts[key] = items;
  }

  const rawWidgets = asRecord(input.widgets);
  if (input.widgets === undefined) repairs.push("Widget show/hide settings were missing and were rebuilt from defaults.");
  else if (!rawWidgets) repairs.push("Widget show/hide settings were invalid and were reset.");
  for (const key of Object.keys(rawWidgets ?? {})) {
    if (!known.has(key)) unknownIds.add(key);
  }
  const fixedChrome: string[] = [];
  const widgets: WorkspaceLayoutState["widgets"] = {};
  for (const id of COMMAND_CENTER_WIDGET_IDS) {
    const present = Boolean(rawWidgets && id in rawWidgets);
    const entry = asRecord(rawWidgets?.[id]);
    const hidden = typeof entry?.hidden === "boolean" ? entry.hidden : false;
    const minimized = typeof entry?.minimized === "boolean" ? entry.minimized : false;
    const invalid = present && (
      !entry
      || ("hidden" in entry && typeof entry.hidden !== "boolean")
      || ("minimized" in entry && typeof entry.minimized !== "boolean")
    );
    if (invalid) fixedChrome.push(widgetTitle(id));
    widgets[id] = { hidden, minimized };
  }

  let widgetOrder: CommandCenterWidgetId[] = [...defaults.widgetOrder];
  if (Array.isArray(input.widgetOrder)) {
    const seen = new Set<string>();
    const order: CommandCenterWidgetId[] = [];
    for (const entry of input.widgetOrder) {
      if (typeof entry !== "string" || !known.has(entry)) {
        unknownIds.add(String(entry));
        continue;
      }
      if (seen.has(entry)) {
        duplicateIds.add(entry);
        continue;
      }
      seen.add(entry);
      order.push(entry as CommandCenterWidgetId);
    }
    const missing = defaults.widgetOrder.filter((id) => !seen.has(id));
    if (missing.length) repairs.push(`Added missing widgets back to the order: ${missing.map(widgetTitle).join(", ")}.`);
    widgetOrder = [...order, ...missing];
  } else if (input.widgetOrder === undefined) {
    repairs.push("Widget order was missing and was rebuilt from the default order.");
  } else {
    repairs.push("Widget order was invalid and was reset to the default order.");
  }

  if (unknownIds.size) repairs.push(`Removed unknown widget ids: ${[...unknownIds].join(", ")}.`);
  if (duplicateIds.size) repairs.push(`Removed duplicate entries for: ${[...duplicateIds].map(widgetTitle).join(", ")}.`);
  if (invalidItems) repairs.push(`Dropped ${invalidItems} layout item${invalidItems === 1 ? "" : "s"} with invalid geometry.`);
  if (rebuiltBreakpoints.length) repairs.push(`Rebuilt the ${rebuiltBreakpoints.join(", ")} layout from defaults.`);
  if (restoredIds.size) repairs.push(`Restored default positions for: ${[...restoredIds].map(widgetTitle).join(", ")}.`);
  if (clampedItems.length) repairs.push(`Moved or resized to fit the grid: ${clampedItems.join(", ")}.`);
  if (fixedChrome.length) repairs.push(`Fixed invalid show/hide or minimize values for: ${fixedChrome.join(", ")}.`);

  let focusedWidgetId: string | null = null;
  const focused = input.focusedWidgetId;
  if (typeof focused === "string" && known.has(focused) && !widgets[focused].hidden) {
    focusedWidgetId = focused;
  } else if (focused !== null && focused !== undefined) {
    repairs.push(`Cleared stale focus on "${String(focused)}".`);
  }

  let reducedMotion = false;
  if (typeof input.reducedMotion === "boolean") reducedMotion = input.reducedMotion;
  else if (input.reducedMotion !== undefined) repairs.push("Reset an invalid reduced-motion preference.");

  let workspaceId: WorkspaceId = defaults.workspaceId;
  if (typeof input.workspaceId === "string" && WORKSPACES.some((workspace) => workspace.id === input.workspaceId)) {
    workspaceId = input.workspaceId as WorkspaceId;
  } else if (input.workspaceId !== undefined) {
    repairs.push("Reset an unknown workspace id.");
  }

  return {
    state: {
      version: WORKSPACE_LAYOUT_VERSION,
      workspaceId,
      layouts,
      widgets,
      widgetOrder,
      focusedWidgetId,
      reducedMotion,
    },
    repairs,
  };
}

/** One status line describing a repair run, suitable for an aria-live region. */
/** Shown when the browser refuses to save a layout change (private mode, storage full, or blocked). */
export const LAYOUT_SAVE_FAILED_MESSAGE =
  "This browser blocked saving the layout (private mode, storage full, or storage disabled). Nothing was saved.";

export function describeLayoutRepairs(repairs: string[], saved = true): string {
  if (!saved) return `Layout repair could not be saved. ${LAYOUT_SAVE_FAILED_MESSAGE}`;
  return repairs.length
    ? `Layout state repaired (${repairs.length} fix${repairs.length === 1 ? "" : "es"}).`
    : "Layout checked: no problems found.";
}

/**
 * Moves a widget one step in the order. With `visibleOnly`, it swaps with the nearest
 * visible neighbor so hidden widgets in between never make a move look like a no-op.
 */
export function moveWidgetInLayout(
  state: WorkspaceLayoutState,
  id: string,
  direction: "up" | "down",
  options: { visibleOnly?: boolean } = {},
): WorkspaceLayoutState {
  const order = [...state.widgetOrder];
  const index = order.indexOf(id as CommandCenterWidgetId);
  if (index === -1) return state;
  const step = direction === "up" ? -1 : 1;
  let target = index + step;
  if (options.visibleOnly) {
    while (target >= 0 && target < order.length && state.widgets[order[target]]?.hidden) target += step;
  }
  if (target < 0 || target >= order.length) return state;
  const neighbor = order[target];
  order[target] = order[index];
  order[index] = neighbor;
  return {
    ...state,
    widgetOrder: order,
    layouts: swapLayoutItemPositions(state.layouts, id, neighbor),
  };
}

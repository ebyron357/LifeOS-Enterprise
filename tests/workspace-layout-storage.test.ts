import { describe, expect, it } from "vitest";
import { createDefaultWorkspaceLayout, WORKSPACE_LAYOUT_VERSION } from "@/lib/workspace/default-layout";
import {
  describeLayoutRepairs,
  moveWidgetInLayout,
  parseWorkspaceLayout,
  repairWorkspaceLayout,
  serializeWorkspaceLayout,
  swapLayoutItemPositions,
} from "@/lib/workspace/layout-storage";

describe("workspace layout storage", () => {
  it("returns default layout for invalid stored JSON", () => {
    const parsed = parseWorkspaceLayout("{not-json");
    expect(parsed.version).toBe(WORKSPACE_LAYOUT_VERSION);
    expect(parsed.layouts.lg.length).toBeGreaterThan(0);
    expect(parsed.focusedWidgetId).toBeNull();
    expect(parsed.widgetOrder).toContain("mission-status");
  });

  it("returns default layout when version or layouts are missing", () => {
    const parsed = parseWorkspaceLayout(JSON.stringify({ version: 99, layouts: null }));
    expect(parsed.layouts.lg.map((item) => item.i)).toContain("mission-status");
  });

  it("migrates legacy v1 layouts to the v2 multi-column defaults", () => {
    const legacy = createDefaultWorkspaceLayout();
    legacy.version = 1;
    // Simulate the broken v1 stacked md board.
    legacy.layouts.md = legacy.layouts.md.map((item, index) => ({ ...item, x: 0, y: index * 8 }));

    const parsed = parseWorkspaceLayout(serializeWorkspaceLayout(legacy));
    expect(parsed.version).toBe(WORKSPACE_LAYOUT_VERSION);
    expect(parsed.layouts.md.some((item) => item.x > 0)).toBe(true);
  });

  it("keeps a real multi-column md default for sidebar-adjusted desktops", () => {
    const defaults = createDefaultWorkspaceLayout();
    expect(defaults.layouts.md.some((item) => item.x > 0 || item.w < 10)).toBe(true);
    expect(defaults.layouts.md.every((item) => item.x === 0)).toBe(false);
  });

  it("round-trips a valid layout including minimized widgets", () => {
    const original = createDefaultWorkspaceLayout();
    original.widgets["morning-brief"] = { minimized: true, hidden: false };
    original.focusedWidgetId = "decision-queue";
    original.reducedMotion = true;

    const restored = parseWorkspaceLayout(serializeWorkspaceLayout(original));
    expect(restored.widgets["morning-brief"]?.minimized).toBe(true);
    expect(restored.focusedWidgetId).toBe("decision-queue");
    expect(restored.reducedMotion).toBe(true);
    expect(restored.layouts.lg.find((item) => item.i === "ai-workforce")?.w).toBe(12);
    expect(restored.widgetOrder[0]).toBe("mission-status");
  });

  it("strips transient react-grid-layout flags when restoring", () => {
    const original = createDefaultWorkspaceLayout();
    const dirty = {
      ...original,
      layouts: {
        ...original.layouts,
        lg: original.layouts.lg.map((item) => ({ ...item, moved: true, static: false })),
      },
    };

    const restored = parseWorkspaceLayout(JSON.stringify(dirty));
    expect(restored.layouts.lg[0]).not.toHaveProperty("moved");
  });

  it("swaps widget x/y across breakpoints for accessible reorder", () => {
    const original = createDefaultWorkspaceLayout();
    const first = original.layouts.lg[0];
    const second = original.layouts.lg[1];
    const swapped = swapLayoutItemPositions(original.layouts, first.i, second.i);
    const nextFirst = swapped.lg.find((item) => item.i === first.i);
    const nextSecond = swapped.lg.find((item) => item.i === second.i);
    expect(nextFirst?.x).toBe(second.x);
    expect(nextFirst?.y).toBe(second.y);
    expect(nextSecond?.x).toBe(first.x);
    expect(nextSecond?.y).toBe(first.y);
    expect(swapped.md.find((item) => item.i === first.i)?.y).toBe(original.layouts.md.find((item) => item.i === second.i)?.y);
  });

  it("reports nothing to repair for a healthy layout", () => {
    const healthy = createDefaultWorkspaceLayout();
    const result = repairWorkspaceLayout(serializeWorkspaceLayout(healthy));
    expect(result.repairs).toEqual([]);
    expect(result.state).toEqual(healthy);
    expect(describeLayoutRepairs(result.repairs)).toBe("Layout checked: no problems found.");
  });

  it("fits off-grid, oversized, and fractional items to each breakpoint's columns", () => {
    const defaults = createDefaultWorkspaceLayout();
    const layouts = JSON.parse(JSON.stringify(defaults.layouts)) as typeof defaults.layouts;
    layouts.lg[0] = { ...layouts.lg[0], x: 12, w: 4 };
    layouts.xs[0] = { ...layouts.xs[0], w: 99 };
    layouts.md[0] = { ...layouts.md[0], x: 1.5 };
    const raw = JSON.stringify({ ...defaults, layouts });

    const result = repairWorkspaceLayout(raw);
    const lg = result.state.layouts.lg.find((item) => item.i === layouts.lg[0].i)!;
    const xs = result.state.layouts.xs.find((item) => item.i === layouts.xs[0].i)!;
    const md = result.state.layouts.md.find((item) => item.i === layouts.md[0].i)!;
    expect(lg.x + lg.w).toBeLessThanOrEqual(12);
    expect(lg).toMatchObject({ x: 8, w: 4 });
    expect(xs.w).toBe(4);
    expect(Number.isInteger(md.x)).toBe(true);
    expect(result.repairs.join(" ")).toMatch(/Moved or resized to fit the grid: .*\(lg\).*\(md\).*\(xs\)|Moved or resized to fit the grid/);
    expect(repairWorkspaceLayout(serializeWorkspaceLayout(result.state)).repairs).toEqual([]);
  });

  it("reports missing widget settings and order as repairs", () => {
    const defaults = createDefaultWorkspaceLayout();
    const { widgets: _widgets, widgetOrder: _order, ...rest } = defaults;
    void _widgets;
    void _order;
    const result = repairWorkspaceLayout(JSON.stringify(rest));
    expect(result.repairs).toContain("Widget show/hide settings were missing and were rebuilt from defaults.");
    expect(result.repairs).toContain("Widget order was missing and was rebuilt from the default order.");
    expect(describeLayoutRepairs(result.repairs)).not.toBe("Layout checked: no problems found.");
  });

  it("normalizes a deliberately corrupted stored layout and lists each repair", () => {
    const defaults = createDefaultWorkspaceLayout();
    const corrupted = {
      version: WORKSPACE_LAYOUT_VERSION,
      workspaceId: "not-a-workspace",
      layouts: {
        lg: [
          // prayer is missing; decision-queue only has an entry with invalid geometry.
          ...defaults.layouts.lg.filter((item) => item.i !== "prayer" && item.i !== "decision-queue"),
          { i: "mission-status", x: 3, y: 3, w: 3, h: 3 },
          { i: "legacy-widget", x: 0, y: 80, w: 3, h: 3 },
          { i: "decision-queue", x: 0, y: 0, w: "wide", h: 3 },
        ],
        md: defaults.layouts.md,
        sm: "broken",
        xs: defaults.layouts.xs,
      },
      widgets: {
        ...defaults.widgets,
        "morning-brief": { minimized: "nope", hidden: false },
        "github-health": { minimized: false, hidden: 1 },
        "legacy-widget": { minimized: false, hidden: false },
      },
      widgetOrder: ["legacy-widget", "mission-status", "mission-status", ...defaults.widgetOrder.filter((id) => id !== "ai-workforce"), 42],
      focusedWidgetId: "legacy-widget",
      reducedMotion: "sometimes",
    };

    const result = repairWorkspaceLayout(JSON.stringify(corrupted));

    expect(result.repairs).toEqual([
      "Added missing widgets back to the order: AI workforce.",
      "Removed unknown widget ids: legacy-widget, 42.",
      "Removed duplicate entries for: Mission status.",
      "Dropped 1 layout item with invalid geometry.",
      "Rebuilt the sm layout from defaults.",
      "Restored default positions for: Decision queue, Prayer.",
      "Fixed invalid show/hide or minimize values for: Morning brief, GitHub health.",
      'Cleared stale focus on "legacy-widget".',
      "Reset an invalid reduced-motion preference.",
      "Reset an unknown workspace id.",
    ]);
    expect(describeLayoutRepairs(result.repairs)).toBe("Layout state repaired (10 fixes).");

    const state = result.state;
    expect(state.workspaceId).toBe("command-center");
    expect(state.focusedWidgetId).toBeNull();
    expect(state.reducedMotion).toBe(false);
    expect(state.widgetOrder).toEqual(defaults.widgetOrder);
    expect(state.widgets["morning-brief"]).toEqual({ minimized: false, hidden: false });
    expect(state.widgets["github-health"]).toEqual({ minimized: false, hidden: false });
    expect(state.widgets).not.toHaveProperty("legacy-widget");
    for (const key of ["lg", "md", "sm", "xs"] as const) {
      const ids = state.layouts[key].map((item) => item.i);
      expect(new Set(ids).size).toBe(ids.length);
      expect([...ids].sort()).toEqual([...defaults.widgetOrder].sort());
    }
    // Healthy entries keep their saved geometry; the first mission-status entry wins.
    expect(state.layouts.lg.find((item) => item.i === "mission-status")).toMatchObject({ x: 0, y: 0, w: 12, h: 3 });
    expect(state.layouts.sm).toEqual(defaults.layouts.sm);

    // Repair is idempotent: a second run finds nothing left to fix.
    expect(repairWorkspaceLayout(serializeWorkspaceLayout(state)).repairs).toEqual([]);
  });

  it("replaces unreadable layout JSON with defaults and says so", () => {
    const result = repairWorkspaceLayout("{not-json");
    expect(result.state).toEqual(createDefaultWorkspaceLayout());
    expect(result.repairs).toEqual(["Unreadable layout JSON replaced with the default layout."]);
  });

  it("moves past hidden widgets when reordering visible widgets only", () => {
    const layout = createDefaultWorkspaceLayout();
    layout.widgetOrder = ["mission-status", "cognitive-support", "project-command-board", ...layout.widgetOrder.slice(3)];
    layout.widgets["cognitive-support"] = { minimized: false, hidden: true };
    const visible = (state: typeof layout) => state.widgetOrder.filter((id) => !state.widgets[id]?.hidden);

    // Full-order move swaps with the hidden neighbor: the visible order does not change.
    const fullOrder = moveWidgetInLayout(layout, "project-command-board", "up");
    expect(visible(fullOrder).slice(0, 2)).toEqual(["mission-status", "project-command-board"]);

    const moved = moveWidgetInLayout(layout, "project-command-board", "up", { visibleOnly: true });
    expect(visible(moved).slice(0, 2)).toEqual(["project-command-board", "mission-status"]);
    expect(moved.widgetOrder.slice(0, 3)).toEqual(["project-command-board", "cognitive-support", "mission-status"]);
    const originalMission = layout.layouts.lg.find((item) => item.i === "mission-status");
    expect(moved.layouts.lg.find((item) => item.i === "project-command-board")).toMatchObject({ x: originalMission?.x, y: originalMission?.y });

    const back = moveWidgetInLayout(moved, "project-command-board", "down", { visibleOnly: true });
    expect(back.widgetOrder).toEqual(layout.widgetOrder);
    expect(moveWidgetInLayout(layout, "mission-status", "up", { visibleOnly: true })).toBe(layout);
  });
});

import { describe, expect, it } from "vitest";
import { createDefaultWorkspaceLayout, WORKSPACE_LAYOUT_VERSION } from "@/lib/workspace/default-layout";
import { parseWorkspaceLayout, serializeWorkspaceLayout, swapLayoutItemPositions } from "@/lib/workspace/layout-storage";

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
});

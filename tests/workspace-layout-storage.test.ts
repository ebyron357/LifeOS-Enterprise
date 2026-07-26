import { describe, expect, it } from "vitest";
import { createDefaultWorkspaceLayout } from "@/lib/workspace/default-layout";
import { parseWorkspaceLayout, serializeWorkspaceLayout } from "@/lib/workspace/layout-storage";

describe("workspace layout storage", () => {
  it("returns default layout for invalid stored JSON", () => {
    const parsed = parseWorkspaceLayout("{not-json");
    expect(parsed.version).toBe(1);
    expect(parsed.layouts.lg.length).toBeGreaterThan(0);
    expect(parsed.focusedWidgetId).toBeNull();
  });

  it("returns default layout when version or layouts are missing", () => {
    const parsed = parseWorkspaceLayout(JSON.stringify({ version: 99, layouts: null }));
    expect(parsed.layouts.lg.map((item) => item.i)).toContain("mission-status");
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
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { getWidget, widgetRegistry } from "@/components/widgets/registry";

describe("executive dashboard", () => {
  it("registers each required LifeOS widget exactly once", () => {
    expect(widgetRegistry.map((widget) => widget.id)).toEqual([
      "morning-brief", "prayer", "revenue-radar", "ai-workforce", "github-health",
    ]);
    expect(new Set(widgetRegistry.map((widget) => widget.id)).size).toBe(widgetRegistry.length);
  });

  it("resolves a widget by its stable id", () => {
    expect(getWidget("prayer")?.title).toBe("Prayer Widget");
  });

  it("renders the complete executive dashboard", () => {
    render(<DashboardLayout widgets={widgetRegistry} />);
    expect(screen.getByRole("heading", { name: /good morning, byron/i })).toBeInTheDocument();
    expect(screen.getByText("What deserves attention")).toBeInTheDocument();
    expect(screen.getByText("Lead with wisdom")).toBeInTheDocument();
    expect(screen.getByText("Revenue radar")).toBeInTheDocument();
    expect(screen.getByText("AI workforce")).toBeInTheDocument();
    expect(screen.getByText("GitHub health")).toBeInTheDocument();
  });
});

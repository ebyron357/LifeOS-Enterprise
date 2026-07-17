import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { getWidget, widgetRegistry } from "@/components/widgets/registry";

const data = {
  priorities: [{ name: "LifeOS Enterprise", status: "active", priority: "P0", business: "LifeOS", nextAction: "Verify the dashboard.", reviewDate: "2026-07-17", waitingOn: "", blocker: "" }],
  activeProjects: 1,
  waitingOn: 0,
  reviewsDue: 1,
  agents: [{ name: "Chief of Staff", status: "active", reviewDate: "2026-07-17", purpose: "Choose what deserves attention." }],
};

describe("executive dashboard", () => {
  it("registers each required LifeOS widget exactly once", () => {
    expect(widgetRegistry.map((widget) => widget.id)).toEqual(["prayer", "revenue-radar", "github-health"]);
    expect(new Set(widgetRegistry.map((widget) => widget.id)).size).toBe(widgetRegistry.length);
  });

  it("resolves a widget by its stable id", () => {
    expect(getWidget("prayer")?.title).toBe("Prayer Widget");
  });

  it("renders the complete executive dashboard", () => {
    render(<DashboardLayout widgets={widgetRegistry} data={data} />);
    expect(screen.getByRole("heading", { name: /good morning,\s*bwa/i })).toBeInTheDocument();
    expect(screen.getByText("What deserves attention")).toBeInTheDocument();
    expect(screen.getByText("Lead with wisdom")).toBeInTheDocument();
    expect(screen.getByText("Revenue radar")).toBeInTheDocument();
    expect(screen.getByText(/AI workforce/i)).toBeInTheDocument();
    expect(screen.getByText("GitHub health")).toBeInTheDocument();
  });
});

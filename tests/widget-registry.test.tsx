import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { getWidget, widgetRegistry } from "@/components/widgets/registry";

const data = {
  priorities: [{ name: "LifeOS Enterprise", status: "active", priority: "P0", business: "LifeOS", nextAction: "Verify the dashboard.", reviewDate: "2026-07-17", waitingOn: "", blocker: "" }],
  projects: [
    { name: "LifeOS Enterprise", status: "active", priority: "P0", business: "LifeOS", nextAction: "Verify the dashboard.", reviewDate: "2026-07-17", waitingOn: "", blocker: "" },
    { name: "Blocked Ops", status: "blocked", priority: "P1", business: "LifeOS", nextAction: "Clear blocker.", reviewDate: "2026-07-18", waitingOn: "", blocker: "Access" },
    { name: "Waiting Ops", status: "waiting", priority: "P2", business: "LifeOS", nextAction: "Follow up.", reviewDate: "2026-07-19", waitingOn: "Partner", blocker: "" },
  ],
  activeProjects: 1,
  waitingOn: 1,
  reviewsDue: 1,
  agents: [{ name: "Chief of Staff", status: "active", reviewDate: "2026-07-17", purpose: "Choose what deserves attention." }],
  growth: { focus: "One useful habit", currentValue: "3", targetValue: "24", reviewDate: "2026-07-20" },
};
const github = { connected: true, openPullRequests: 1, failedWorkflows: 0, defaultBranch: "main", lastWorkflow: "success", updatedAt: "2026-07-17T00:00:00Z" };

describe("executive dashboard", () => {
  afterEach(() => {
    cleanup();
  });

  it("registers each required LifeOS widget exactly once", () => {
    expect(widgetRegistry.map((widget) => widget.id)).toEqual(["prayer", "revenue-radar"]);
    expect(new Set(widgetRegistry.map((widget) => widget.id)).size).toBe(widgetRegistry.length);
  });

  it("resolves a widget by its stable id", () => {
    expect(getWidget("prayer")?.title).toBe("Prayer Widget");
  });

  it("renders the navigable LifeOS application with verified dashboard counts", () => {
    render(<DashboardLayout widgets={widgetRegistry} data={data} github={github} />);
    expect(screen.getByRole("heading", { name: /good day,\s*bwa/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /projects/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /growth/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /intelligence/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /agents/i })).toBeInTheDocument();
    expect(screen.getByText("What deserves attention")).toBeInTheDocument();
    expect(screen.getByText("Lead with wisdom")).toBeInTheDocument();
    expect(screen.getByText("Revenue radar")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /ai workforce/i })).toBeInTheDocument();
    expect(screen.getByText(/GitHub health/i)).toBeInTheDocument();
    const mission = screen.getByLabelText("Current operating status");
    expect(mission).toHaveTextContent(/Active work\s*1/);
    expect(mission).toHaveTextContent(/Blocked\s*1/);
    expect(mission).toHaveTextContent(/Waiting\s*1/);
    expect(mission).toHaveTextContent(/Reviews due\s*1/);
    expect(screen.getByText("1 active projects")).toBeInTheDocument();
  });
});

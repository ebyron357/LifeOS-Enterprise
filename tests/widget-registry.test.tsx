import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { getWidget, widgetRegistry } from "@/components/widgets/registry";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/dashboard",
}));

const data = {
  priorities: [{ name: "LifeOS Enterprise", path: "Projects/LifeOS Enterprise.md", status: "active", priority: "P0", business: "LifeOS", nextAction: "Verify the dashboard.", reviewDate: "2026-07-17", waitingOn: "", blocker: "" }],
  projects: [
    { name: "LifeOS Enterprise", path: "Projects/LifeOS Enterprise.md", status: "active", priority: "P0", business: "LifeOS", nextAction: "Verify the dashboard.", reviewDate: "2026-07-17", waitingOn: "", blocker: "" },
    { name: "Blocked Ops", path: "Projects/Blocked Ops.md", status: "blocked", priority: "P1", business: "LifeOS", nextAction: "Clear blocker.", reviewDate: "2026-07-18", waitingOn: "", blocker: "Access" },
    { name: "Waiting Ops", path: "Projects/Waiting Ops.md", status: "waiting", priority: "P2", business: "LifeOS", nextAction: "Follow up.", reviewDate: "2026-07-19", waitingOn: "Partner", blocker: "" },
  ],
  activeProjects: 1,
  waitingOn: 1,
  reviewsDue: 1,
  agents: [{ name: "Chief of Staff", status: "active", reviewDate: "2026-07-17", purpose: "Choose what deserves attention." }],
  businesses: [{ name: "LifeOS", path: "Businesses/LifeOS.md", status: "active" }],
  people: [{ name: "Bwa", path: "50 People/Bwa.md", organization: "LifeOS", role: "Operator" }],
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
    render(<DashboardLayout widgets={widgetRegistry} data={data} github={github} counts={{ search: 120, projects: 3, tasks: 8 }} />);
    expect(screen.getByRole("heading", { name: /good day,\s*bwa/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Command Center" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /overview/i })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /projects/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /growth/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /intelligence/i })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /agents/i }).length).toBeGreaterThan(0);
    expect(screen.getByText("What deserves attention")).toBeInTheDocument();
    expect(screen.getByText("Lead with wisdom")).toBeInTheDocument();
    expect(screen.getAllByText("Revenue radar").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("heading", { name: /ai workforce/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/GitHub health/i).length).toBeGreaterThan(0);
    const mission = screen.getByLabelText("Current operating status");
    expect(mission).toHaveTextContent(/Active work\s*1/);
    expect(mission).toHaveTextContent(/Blocked\s*1/);
    expect(mission).toHaveTextContent(/Waiting\s*1/);
    expect(mission).toHaveTextContent(/Reviews due\s*1/);
    expect(screen.getByText("120 indexed notes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /restore default layout/i })).toBeInTheDocument();
  });

  it("renders board and map view switches", () => {
    render(<DashboardLayout widgets={widgetRegistry} data={data} github={github} counts={{ search: 120, projects: 3, tasks: 8 }} />);
    expect(screen.getByRole("tab", { name: /command board/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /command map/i })).toBeInTheDocument();
  });
});

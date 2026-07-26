import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommandCenterWorkspace } from "@/components/workspace/CommandCenterWorkspace";
import { LAYOUT_STORAGE_KEY } from "@/lib/workspace/default-layout";
import { serializeWorkspaceLayout, parseWorkspaceLayout } from "@/lib/workspace/layout-storage";
import { createDefaultWorkspaceLayout } from "@/lib/workspace/default-layout";

const data = {
  priorities: [{
    name: "LifeOS Enterprise",
    path: "Projects/LifeOS Enterprise.md",
    status: "active",
    priority: "P0",
    business: "LifeOS",
    nextAction: "Verify the dashboard.",
    reviewDate: "2026-07-17",
    waitingOn: "",
    blocker: "",
  }],
  projects: [
    {
      name: "LifeOS Enterprise",
      path: "Projects/LifeOS Enterprise.md",
      status: "active",
      priority: "P0",
      business: "LifeOS",
      nextAction: "Verify the dashboard.",
      reviewDate: "2026-07-17",
      waitingOn: "",
      blocker: "",
    },
    {
      name: "Blocked Ops",
      path: "Projects/Blocked Ops.md",
      status: "blocked",
      priority: "P1",
      business: "LifeOS",
      nextAction: "Clear blocker.",
      reviewDate: "2026-07-18",
      waitingOn: "",
      blocker: "Access",
    },
  ],
  activeProjects: 1,
  waitingOn: 0,
  reviewsDue: 1,
  agents: [{ name: "Chief of Staff", status: "active", reviewDate: "2026-07-17", purpose: "Choose what deserves attention." }],
  growth: { focus: "One useful habit", currentValue: "3", targetValue: "24", reviewDate: "2026-07-20" },
};

const github = {
  connected: true,
  openPullRequests: 1,
  failedWorkflows: 0,
  defaultBranch: "main",
  lastWorkflow: "success",
  updatedAt: "2026-07-17T00:00:00Z",
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/dashboard",
}));

describe("Workspace OS Command Center", () => {
  beforeEach(() => {
    window.localStorage.clear();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: query.includes("max-width: 900px") ? false : false,
        media: query,
        onchange: null,
        addListener() {},
        removeListener() {},
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent() {
          return false;
        },
      }),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the default Command Center widgets", async () => {
    render(<CommandCenterWorkspace data={data} github={github} />);
    expect(await screen.findByRole("heading", { name: "Command Center" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /good day,\s*bwa/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Mission status")).toBeInTheDocument();
    expect(screen.getByLabelText("Project command board")).toBeInTheDocument();
    expect(screen.getByLabelText("Decision queue")).toBeInTheDocument();
    expect(screen.getByLabelText("Morning brief")).toBeInTheDocument();
    expect(screen.getByText("Restore default layout")).toBeInTheDocument();
  });

  it("opens the command palette and runs reset layout", async () => {
    const custom = createDefaultWorkspaceLayout();
    custom.focusedWidgetId = "morning-brief";
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, serializeWorkspaceLayout(custom));

    render(<CommandCenterWorkspace data={data} github={github} />);
    fireEvent.click(await screen.findByRole("button", { name: /command palette/i }));
    expect(screen.getByLabelText("Search commands")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Reset dashboard layout"));
    expect(screen.getByText(/default layout restored/i)).toBeInTheDocument();
  });

  it("minimizes and restores a widget", async () => {
    render(<CommandCenterWorkspace data={data} github={github} />);
    const widget = await screen.findByLabelText("Decision queue");
    const minimize = within(widget).getByRole("button", { name: "Minimize" });
    fireEvent.click(minimize);
    expect(within(widget).getByRole("button", { name: "Restore" })).toBeInTheDocument();
    expect(within(widget).getByText(/restore to continue/i)).toBeInTheDocument();
    fireEvent.click(within(widget).getByRole("button", { name: "Restore" }));
    expect(within(widget).getByRole("button", { name: "Minimize" })).toBeInTheDocument();
  });

  it("focuses the next widget via toolbar control", async () => {
    render(<CommandCenterWorkspace data={data} github={github} />);
    fireEvent.click(await screen.findByRole("button", { name: "Focus next" }));
    expect(document.querySelector(".workspace-widget.is-focused")).not.toBeNull();
  });

  it("toggles reduced motion and persists layout preferences", async () => {
    render(<CommandCenterWorkspace data={data} github={github} />);
    fireEvent.click(await screen.findByRole("button", { name: /motion: full/i }));
    expect(screen.getByRole("button", { name: /motion: reduced/i })).toBeInTheDocument();
    expect(document.documentElement.dataset.lifeosReducedMotion).toBe("true");

    const stored = parseWorkspaceLayout(window.localStorage.getItem(LAYOUT_STORAGE_KEY));
    expect(stored.reducedMotion).toBe(true);
  });

  it("persists layout changes after restore and local-storage recovery", async () => {
    render(<CommandCenterWorkspace data={data} github={github} />);
    fireEvent.click(await screen.findByRole("button", { name: /restore default layout/i }));
    expect(screen.getByText(/default layout restored/i)).toBeInTheDocument();

    const stored = parseWorkspaceLayout(window.localStorage.getItem(LAYOUT_STORAGE_KEY));
    expect(stored.layouts.md.some((item) => item.x > 0)).toBe(true);

    window.localStorage.setItem(LAYOUT_STORAGE_KEY, "{bad");
    const recovered = parseWorkspaceLayout(window.localStorage.getItem(LAYOUT_STORAGE_KEY));
    expect(recovered.layouts.lg.length).toBe(stored.layouts.lg.length);
  });

  it("keeps mobile stacked mode free of horizontal overflow wrappers", async () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: query.includes("max-width: 900px"),
        media: query,
        onchange: null,
        addListener() {},
        removeListener() {},
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent() {
          return false;
        },
      }),
    });

    const { container } = render(<CommandCenterWorkspace data={data} github={github} />);
    expect(await screen.findByLabelText("Mission status")).toBeInTheDocument();
    expect(container.querySelector('[data-workspace-layout="stacked"]')).not.toBeNull();
  });
});

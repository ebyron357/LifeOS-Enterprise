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
  businesses: [{ name: "LifeOS", path: "Businesses/LifeOS.md", status: "active" }],
  people: [{ name: "Bwa", path: "50 People/Bwa.md", organization: "LifeOS", role: "Operator" }],
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
    vi.restoreAllMocks();
  });

  it("renders the default Command Center widgets", async () => {
    render(<CommandCenterWorkspace data={data} github={github} />);
    expect(await screen.findByRole("heading", { name: "Command Center" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /good day,\s*bwa/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Mission status")).toBeInTheDocument();
    expect(screen.getByLabelText("Project command board")).toBeInTheDocument();
    expect(screen.getByLabelText("Decision queue")).toBeInTheDocument();
    expect(screen.getByLabelText("Morning brief")).toBeInTheDocument();
    expect(screen.getByLabelText("Game loop")).toBeInTheDocument();
    expect(screen.getByText("Restore default layout")).toBeInTheDocument();
  });

  it("opens the command palette and runs reset layout", async () => {
    const custom = createDefaultWorkspaceLayout();
    custom.focusedWidgetId = "morning-brief";
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, serializeWorkspaceLayout(custom));

    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<CommandCenterWorkspace data={data} github={github} />);
    fireEvent.click(await screen.findByRole("button", { name: /command palette/i }));
    expect(screen.getByLabelText("Search commands")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Reset dashboard layout"));
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/default layout restored/i)).toBeInTheDocument();
    expect(parseWorkspaceLayout(window.localStorage.getItem(LAYOUT_STORAGE_KEY)).focusedWidgetId).toBeNull();
  });

  it("keeps the custom layout when the reset confirmation is cancelled", async () => {
    const custom = createDefaultWorkspaceLayout();
    custom.focusedWidgetId = "morning-brief";
    custom.widgets["prayer"] = { minimized: false, hidden: true };
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, serializeWorkspaceLayout(custom));
    const before = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);

    render(<CommandCenterWorkspace data={data} github={github} />);
    fireEvent.click(await screen.findByRole("button", { name: /restore default layout/i }));
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/restore cancelled/i)).toBeInTheDocument();
    expect(window.localStorage.getItem(LAYOUT_STORAGE_KEY)).toBe(before);

    fireEvent.click(screen.getByRole("button", { name: /command palette/i }));
    fireEvent.click(screen.getByText("Reset dashboard layout"));
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(window.localStorage.getItem(LAYOUT_STORAGE_KEY)).toBe(before);
  });

  it("opens the command palette and repairs layout", async () => {
    render(<CommandCenterWorkspace data={data} github={github} />);
    fireEvent.click(await screen.findByRole("button", { name: /command palette/i }));
    fireEvent.click(screen.getByText("Repair dashboard layout"));
    expect(screen.getByText(/layout checked: no problems found/i)).toBeInTheDocument();
  });

  it("repairs a corrupted stored layout and lists what was fixed", async () => {
    const corrupted = createDefaultWorkspaceLayout() as unknown as Record<string, unknown>;
    const defaults = createDefaultWorkspaceLayout();
    corrupted.layouts = {
      ...defaults.layouts,
      lg: [
        ...defaults.layouts.lg.filter((item) => item.i !== "game-loop"),
        { i: "ghost-widget", x: 0, y: 99, w: 4, h: 4 },
      ],
    };
    corrupted.widgets = { ...defaults.widgets, "game-loop": { minimized: 3, hidden: "yes" } };
    corrupted.widgetOrder = ["ghost-widget", ...defaults.widgetOrder, "mission-status"];
    corrupted.focusedWidgetId = "ghost-widget";
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(corrupted));

    render(<CommandCenterWorkspace data={data} github={github} />);
    // The truthy "yes" string hides the widget until the layout is repaired.
    expect(screen.queryByLabelText("Game loop")).not.toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: /^repair layout$/i }));

    expect(screen.getByText(/layout state repaired \(\d+ fixes\)/i)).toBeInTheDocument();
    const report = screen.getByLabelText("Layout repair report");
    expect(report).toHaveTextContent("Removed unknown widget ids: ghost-widget.");
    expect(report).toHaveTextContent("Removed duplicate entries for: Mission status.");
    expect(report).toHaveTextContent("Restored default positions for: Game loop.");
    expect(report).toHaveTextContent("Fixed invalid show/hide or minimize values for: Game loop.");
    expect(report).toHaveTextContent('Cleared stale focus on "ghost-widget".');
    expect(await screen.findByLabelText("Game loop")).toBeInTheDocument();

    const stored = parseWorkspaceLayout(window.localStorage.getItem(LAYOUT_STORAGE_KEY));
    expect(stored.widgets["game-loop"]).toEqual({ minimized: false, hidden: false });
    expect(stored.focusedWidgetId).toBeNull();
    expect(stored.widgetOrder).toEqual(defaults.widgetOrder);
    expect(stored.layouts.lg.map((item) => item.i).sort()).toEqual([...defaults.widgetOrder].sort());
  });

  it("treats the layout as saved when only the last-workspace hint fails to store", async () => {
    render(<CommandCenterWorkspace data={data} github={github} />);
    const repair = await screen.findByRole("button", { name: /^repair layout$/i });
    const original = Storage.prototype.setItem;
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === "lifeos-workspace-os-v1-last-workspace") throw new DOMException("Quota exceeded", "QuotaExceededError");
      return original.call(this, key, value);
    });
    try {
      fireEvent.click(repair);
      expect(screen.queryByText(/could not be saved/i)).not.toBeInTheDocument();
      expect(screen.getByText(/layout checked: no problems found|layout state repaired/i)).toBeInTheDocument();
    } finally {
      setItem.mockRestore();
    }
  });

  it("reports a storage failure instead of claiming the layout was repaired or restored", async () => {
    render(<CommandCenterWorkspace data={data} github={github} />);
    const repair = await screen.findByRole("button", { name: /^repair layout$/i });
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });
    try {
      fireEvent.click(repair);
      expect(screen.getByText(/layout repair could not be saved/i)).toBeInTheDocument();
      expect(screen.queryByText(/layout state repaired|no problems found/i)).not.toBeInTheDocument();

      const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
      fireEvent.click(screen.getByRole("button", { name: /^restore default layout$/i }));
      expect(screen.getByText(/default layout could not be saved/i)).toBeInTheDocument();
      expect(screen.queryByText(/^default layout restored\.$/i)).not.toBeInTheDocument();
      confirm.mockRestore();
    } finally {
      setItem.mockRestore();
    }
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
    vi.spyOn(window, "confirm").mockReturnValue(true);
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

  it("moves a mobile widget past a hidden neighbor so the visible order changes", async () => {
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
    const layout = createDefaultWorkspaceLayout();
    // mission-status, [cognitive-support hidden], project-command-board ...
    layout.widgets["cognitive-support"] = { minimized: false, hidden: true };
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, serializeWorkspaceLayout(layout));

    const { container } = render(<CommandCenterWorkspace data={data} github={github} />);
    await screen.findByLabelText("Mission status");
    const visibleOrder = () => Array.from(container.querySelectorAll("[data-grid-id]")).map((node) => node.getAttribute("data-grid-id"));
    expect(visibleOrder().slice(0, 2)).toEqual(["mission-status", "project-command-board"]);

    const toolbar = screen.getByRole("toolbar", { name: "mission-status mobile controls" });
    fireEvent.click(within(toolbar).getByRole("button", { name: "Move down" }));
    expect(visibleOrder().slice(0, 2)).toEqual(["project-command-board", "mission-status"]);
    const stored = parseWorkspaceLayout(window.localStorage.getItem(LAYOUT_STORAGE_KEY));
    expect(stored.widgetOrder.slice(0, 3)).toEqual(["project-command-board", "cognitive-support", "mission-status"]);
  });

  it("supports widget library add/remove and ordering controls", async () => {
    render(<CommandCenterWorkspace data={data} github={github} />);
    fireEvent.click(await screen.findByRole("button", { name: /widget library \/ customize/i }));
    const library = screen.getByLabelText("Widget Library");
    expect(within(library).getByRole("heading", { name: /widget library \/ customize/i })).toBeInTheDocument();

    const gameItem = within(library).getByText("Game loop").closest("li");
    expect(gameItem).not.toBeNull();
    fireEvent.click(within(gameItem as HTMLElement).getByRole("button", { name: "Remove widget" }));
    expect(screen.queryByLabelText("Game loop")).not.toBeInTheDocument();

    fireEvent.click(within(gameItem as HTMLElement).getByRole("button", { name: "Add widget" }));
    expect(await screen.findByLabelText("Game loop")).toBeInTheDocument();

    const firstBefore = window.localStorage.getItem(LAYOUT_STORAGE_KEY) || "";
    const beforeLayout = parseWorkspaceLayout(firstBefore);
    const gameId = "game-loop";
    const index = beforeLayout.widgetOrder.indexOf(gameId);
    const neighbor = beforeLayout.widgetOrder[index - 1];
    const beforeGame = beforeLayout.layouts.lg.find((item) => item.i === gameId);
    const beforeNeighbor = beforeLayout.layouts.lg.find((item) => item.i === neighbor);
    fireEvent.click(within(gameItem as HTMLElement).getByRole("button", { name: "Move up" }));
    const firstAfter = window.localStorage.getItem(LAYOUT_STORAGE_KEY) || "";
    expect(firstAfter).not.toEqual(firstBefore);
    const afterLayout = parseWorkspaceLayout(firstAfter);
    expect(afterLayout.layouts.lg.find((item) => item.i === gameId)?.y).toBe(beforeNeighbor?.y);
    expect(afterLayout.layouts.lg.find((item) => item.i === neighbor)?.y).toBe(beforeGame?.y);
  });
});

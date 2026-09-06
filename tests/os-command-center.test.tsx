import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CommandCenterHome } from "@/components/os/CommandCenterHome";
import { LearningHome } from "@/components/os/LearningHome";
import { JournalToday } from "@/components/os/JournalToday";
import { TemplateCatalog } from "@/components/os/TemplateCatalog";
import { ProjectCards } from "@/components/os/ProjectCards";

const vault = {
  priorities: [{
    name: "D'Affordable Homes",
    path: "Projects/DAffordable Homes.md",
    status: "active",
    priority: "P0",
    business: "Housing",
    nextAction: "Call the inspector.",
    reviewDate: "2026-09-07",
    waitingOn: "",
    blocker: "",
  }],
  projects: [
    {
      name: "D'Affordable Homes",
      path: "Projects/DAffordable Homes.md",
      status: "active",
      priority: "P0",
      business: "Housing",
      nextAction: "Call the inspector.",
      reviewDate: "2026-09-07",
      waitingOn: "",
      blocker: "",
    },
    {
      name: "Blocked Ops",
      path: "Projects/Blocked Ops.md",
      status: "blocked",
      priority: "P1",
      business: "LifeOS",
      nextAction: "Clear access.",
      reviewDate: "2026-09-08",
      waitingOn: "",
      blocker: "Missing credential",
    },
  ],
  activeProjects: 1,
  waitingOn: 0,
  reviewsDue: 1,
  agents: [],
  businesses: [],
  people: [],
  growth: { focus: "", currentValue: "", targetValue: "", reviewDate: "" },
};

const github = {
  connected: false,
  openPullRequests: 0,
  failedWorkflows: 0,
  defaultBranch: "main",
  lastWorkflow: "unavailable",
  updatedAt: "",
};

const hermes = {
  id: "hermes" as const,
  role: "Delegated agent runtime",
  available: false,
  state: "unavailable" as const,
  lastResponse: null,
  delegatedTasks: 0,
  evidence: [],
  approvalBoundary: "Approval required.",
  limitation: "No Hermes endpoint is configured.",
};

describe("command center and rebuilt surfaces", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("answers what to do next without inventing agent work", () => {
    render(
      <CommandCenterHome
        greeting="Good afternoon"
        dateLabel="Sunday, September 6, 2026"
        vault={vault}
        integrations={[]}
        hermes={hermes}
        github={github}
      />,
    );
    expect(screen.getByRole("heading", { name: "Good afternoon" })).toBeInTheDocument();
    expect(screen.getAllByText("D'Affordable Homes").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Call the inspector/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Missing credential/)).toBeInTheDocument();
    expect(screen.getByText(/Hermes is unavailable/)).toBeInTheDocument();
    expect(screen.queryByText(/\{\{/)).not.toBeInTheDocument();
  });

  it("shows journal writing, not template tokens", () => {
    render(<JournalToday todayNotes={[]} recent={[]} />);
    expect(screen.getByRole("heading", { name: /today's journal/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/today's journal entry/i)).toBeInTheDocument();
    expect(screen.queryByText("{{title}}")).not.toBeInTheDocument();
  });

  it("gives learning a useful empty state", () => {
    render(<LearningHome notes={[]} />);
    expect(screen.getByText(/add something you want to learn/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/add a learning topic/i)).toBeInTheDocument();
  });

  it("renders project resume cards", () => {
    render(<ProjectCards projects={vault.projects} />);
    expect(screen.getAllByRole("link", { name: /resume work/i }).length).toBe(2);
    expect(screen.getByText(/Missing credential/)).toBeInTheDocument();
  });

  it("catalogs templates without raw source tokens", () => {
    render(<TemplateCatalog templates={[{ id: "1", path: "99 Templates/Daily.md", name: "Daily note", purpose: "Start the day.", preview: "Date and one prompt." }]} />);
    expect(screen.getByRole("heading", { name: "Daily note" })).toBeInTheDocument();
    expect(screen.queryByText("{{title}}")).not.toBeInTheDocument();
  });
});

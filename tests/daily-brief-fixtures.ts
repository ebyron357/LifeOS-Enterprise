import type { PortfolioProject } from "@/lib/portfolio/types";

let counter = 0;

export function portfolioProject(overrides: Partial<PortfolioProject> = {}): PortfolioProject {
  counter += 1;
  const id = overrides.projectId ?? `project-${counter}`;
  return {
    projectId: id,
    name: overrides.name ?? `Project ${counter}`,
    outcome: "",
    projectType: "Other",
    status: "Active",
    legacyStatus: "active",
    priority: "Medium",
    legacyPriority: "P2",
    health: "On Track",
    phase: "",
    nextAction: "Ship the release notes",
    blocker: "",
    waitingOn: "",
    dueDate: "",
    reviewDate: "",
    lastVerified: "2026-08-01",
    humanOwner: "Owner",
    assignedAgentRecord: "",
    canonicalRepository: "",
    referenceRepositories: [],
    githubProjectItemId: "",
    evidence: [],
    syncStatus: "Not Synced",
    createdAt: "2026-01-01",
    updatedAt: "2026-08-01",
    sourcePath: `10 Projects/${overrides.name ?? `Project ${counter}`}.md`,
    ...overrides,
  };
}

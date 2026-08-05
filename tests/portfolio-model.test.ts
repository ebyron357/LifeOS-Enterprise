import { describe, expect, it } from "vitest";
import { buildPortfolioProject, isStale, isTrackableProjectNote, needsAttention, toPortfolioPriority, toPortfolioStatus } from "@/lib/portfolio/model";
import type { VaultNote } from "@/lib/vault/types";

function note(overrides: Partial<VaultNote> & { frontmatter?: Record<string, unknown> } = {}): VaultNote {
  return {
    path: "10 Projects/Example.md",
    slug: "10-projects/example",
    title: "Example Project",
    type: "project",
    status: "active",
    priority: "P1",
    tags: ["project"],
    owner: "Byron",
    reviewDate: "2026-08-01",
    nextAction: "Ship the thing",
    blocker: "",
    waitingOn: "",
    business: "LifeOS",
    area: null,
    goal: null,
    organization: null,
    role: null,
    relationship: null,
    lastContact: null,
    nextContact: null,
    created: "2026-01-01",
    updated: "2026-07-01",
    folder: "10 Projects",
    section: "projects",
    legacy: false,
    excerpt: "",
    headings: [],
    links: [],
    embeds: [],
    tasks: [],
    body: "",
    frontmatter: {},
    modifiedAt: null,
    ...overrides,
  } as VaultNote;
}

describe("portfolio status/priority normalization", () => {
  it("maps every legacy status to a controlled Portfolio Status value", () => {
    expect(toPortfolioStatus("active")).toBe("Active");
    expect(toPortfolioStatus("blocked")).toBe("Blocked");
    expect(toPortfolioStatus("paused")).toBe("Waiting");
    expect(toPortfolioStatus("complete")).toBe("Completed");
    expect(toPortfolioStatus("archived")).toBe("Archived");
    expect(toPortfolioStatus(null)).toBe("Needs Review");
    expect(toPortfolioStatus("some-unknown-legacy-value")).toBe("Needs Review");
  });

  it("prefers an explicit portfolio_status when it is a controlled value", () => {
    expect(toPortfolioStatus("active", "Needs Audit")).toBe("Needs Audit");
    expect(toPortfolioStatus("active", "not-a-real-value")).toBe("Active");
  });

  it("maps P0-P3 to Critical..Someday and defaults to Medium", () => {
    expect(toPortfolioPriority("P0")).toBe("Critical");
    expect(toPortfolioPriority("P3")).toBe("Someday");
    expect(toPortfolioPriority(null)).toBe("Medium");
  });
});

describe("buildPortfolioProject", () => {
  it("test case 1: a project with exactly one canonical repository", () => {
    const project = buildPortfolioProject(note({ frontmatter: { canonical_repo: "ebyron357/cv-engine" } }));
    expect(project.canonicalRepository).toBe("ebyron357/cv-engine");
    expect(project.referenceRepositories).toEqual([]);
  });

  it("test case 2: a project with multiple reference repositories", () => {
    const project = buildPortfolioProject(
      note({ frontmatter: { canonical_repo: "ebyron357/cv-engine", reference_repos: ["ebyron357/cv-engine-old", "ebyron357/cv-engine-experiment"] } }),
    );
    expect(project.referenceRepositories).toHaveLength(2);
    expect(project.referenceRepositories).toContain("ebyron357/cv-engine-old");
  });

  it("test case 3: a project with no repository at all", () => {
    const project = buildPortfolioProject(note({ frontmatter: {} }));
    expect(project.canonicalRepository).toBe("");
    expect(project.referenceRepositories).toEqual([]);
  });

  it("test case 8: a project with a missing next action stays empty rather than being invented", () => {
    const project = buildPortfolioProject(note({ nextAction: null as unknown as string }));
    expect(project.nextAction).toBe("");
  });

  it("test case 18: a project note with incomplete metadata still resolves to safe defaults", () => {
    const project = buildPortfolioProject(
      note({ status: null, priority: null, owner: null, reviewDate: null, nextAction: null, frontmatter: {} } as Partial<VaultNote>),
    );
    expect(project.status).toBe("Needs Review");
    expect(project.priority).toBe("Medium");
    expect(project.health).toBe("Unknown");
    expect(project.syncStatus).toBe("Not Synced");
  });

  it("test case 19: a stale Last Verified date is detected relative to today", () => {
    const fresh = buildPortfolioProject(note({ frontmatter: { last_verified: "2026-07-30" } }));
    const stale = buildPortfolioProject(note({ frontmatter: { last_verified: "2026-01-01" } }));
    const never = buildPortfolioProject(note({ frontmatter: {} }));
    expect(isStale(fresh, "2026-08-01")).toBe(false);
    expect(isStale(stale, "2026-08-01")).toBe(true);
    expect(isStale(never, "2026-08-01")).toBe(true);
  });

  it("derives a stable project ID from the title when no explicit project_id is set", () => {
    const a = buildPortfolioProject(note({ title: "Build AI Consultant Portfolio" }));
    const b = buildPortfolioProject(note({ title: "Build AI Consultant Portfolio" }));
    expect(a.projectId).toBe(b.projectId);
    expect(a.projectId).toBe("build-ai-consultant-portfolio");
  });

  it("respects an explicit project_id override", () => {
    const project = buildPortfolioProject(note({ frontmatter: { project_id: "custom-id" } }));
    expect(project.projectId).toBe("custom-id");
  });
});

describe("attention and trackability filters", () => {
  it("flags blocked and waiting projects, and overdue reviews, as needing attention", () => {
    const blocked = buildPortfolioProject(note({ status: "blocked" }));
    const waiting = buildPortfolioProject(note({ status: "waiting" }));
    const overdue = buildPortfolioProject(note({ status: "active", reviewDate: "2026-01-01" }));
    const fine = buildPortfolioProject(note({ status: "active", reviewDate: "2099-01-01" }));

    expect(needsAttention(blocked, "2026-08-01")).toBe(true);
    expect(needsAttention(waiting, "2026-08-01")).toBe(true);
    expect(needsAttention(overdue, "2026-08-01")).toBe(true);
    expect(needsAttention(fine, "2026-08-01")).toBe(false);
  });

  it("excludes templates, README index notes, and placeholder titles from the trackable set", () => {
    expect(isTrackableProjectNote(note({ path: "99 Templates/Project Template.md", section: "templates" }))).toBe(false);
    expect(isTrackableProjectNote(note({ title: "README", type: "project" }))).toBe(false);
    expect(isTrackableProjectNote(note({ title: "{{project_name}}", type: "project" }))).toBe(false);
    expect(isTrackableProjectNote(note({ type: "project" }))).toBe(true);
  });
});

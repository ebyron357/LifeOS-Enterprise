import { describe, expect, it } from "vitest";
import { buildCanonicalSideQuests, missingSideQuestCategories } from "@/lib/game/state";
import { getVaultDashboardData } from "@/lib/lifeos/vault-data";
import { getVaultIndex } from "@/lib/vault/index";

describe("vault dashboard data", () => {
  it("loads active project priorities from canonical vault notes", async () => {
    const data = await getVaultDashboardData(new Date("2026-07-31T12:00:00Z"));
    expect(data.priorities.length).toBeGreaterThan(0);
    expect(data.priorities[0].priority).toBe("P0");
    expect(data.priorities.every((project) => project.nextAction.length > 0)).toBe(true);
    expect(data.reviewsDue).toBeGreaterThan(0);
  });

  it("keeps active, blocked, and waiting counts accurate and distinct", async () => {
    const data = await getVaultDashboardData(new Date("2026-07-17T12:00:00Z"));
    const activeOnly = data.projects.filter((project) => project.status === "active");
    const waiting = data.projects.filter((project) => project.status === "waiting" || Boolean(project.waitingOn));

    expect(data.projects.length).toBeGreaterThan(0);
    expect(data.activeProjects).toBe(activeOnly.length);
    expect(data.waitingOn).toBe(waiting.length);
    expect(data.projects.length).toBeGreaterThanOrEqual(data.activeProjects);
    expect(activeOnly.every((project) => project.status === "active")).toBe(true);
    expect(activeOnly.some((project) => project.status === "blocked" || project.status === "waiting")).toBe(false);
  });

  it("excludes reusable templates and placeholder records from live project metrics", async () => {
    const data = await getVaultDashboardData(new Date("2026-07-17T12:00:00Z"));

    expect(data.projects.every((project) => !project.path.toLowerCase().includes("templates/"))).toBe(true);
    expect(data.projects.every((project) => !/\{\{[^}]+\}\}/.test(project.name))).toBe(true);
    expect(data.priorities.every((project) => !/\{\{[^}]+\}\}/.test(project.name))).toBe(true);
  });

  it("parses vault frontmatter with Windows CRLF line endings", async () => {
    const data = await getVaultDashboardData(new Date("2026-07-17T12:00:00Z"));
    expect(data.projects.some((project) => project.status === "active")).toBe(true);
    expect(data.activeProjects).toBeGreaterThan(0);
  });

  it("includes canonical projects from 10 Projects", async () => {
    const data = await getVaultDashboardData();
    expect(data.projects.map((project) => project.name)).toContain("Build AI Consultant Portfolio");
  });

  it("loads the AI role registry from vault files", async () => {
    const data = await getVaultDashboardData();
    expect(data.agents.map((agent) => agent.name)).toContain("Chief of Staff");
    expect(data.agents.every((agent) => agent.purpose.length > 0)).toBe(true);
  });

  it("derives active area briefs that back canonical game side quests", async () => {
    const data = await getVaultDashboardData(new Date("2026-09-30T12:00:00Z"));
    const index = await getVaultIndex();
    const areas = data.areas ?? [];

    expect(areas.length).toBeGreaterThan(0);
    for (const area of areas) {
      const note = index.byPath[area.path];
      expect(note?.type).toBe("area");
      expect(note?.status).toBe("active");
      expect(area.path.toLowerCase()).not.toContain("readme");
    }
    const health = areas.find((area) => area.path === "20 Areas/Physical Health and Mobility.md");
    expect(health?.tags).toContain("health");
    expect(health?.purpose).toBe("Protect mobility, reduce avoidable flare-ups, maintain strength, and prepare for safe rehabilitation under medical supervision.");
    expect(areas.find((area) => area.tags.includes("learning"))?.standard).toMatch(/purpose/i);
    expect(data.people.some((person) => person.path.toLowerCase().includes("readme"))).toBe(false);

    const context = { nowIso: "2026-09-30T12:00:00Z", projects: data.projects, areas, businesses: data.businesses, people: data.people };
    const sides = buildCanonicalSideQuests(context);
    expect(sides.map((quest) => quest.category)).toEqual(expect.arrayContaining(["health", "learning", "money", "personal-growth"]));
    // Every generated side quest points at a real, indexed vault record.
    for (const quest of sides) expect(index.byPath[quest.sourceProjectPath ?? ""]).toBeTruthy();
    const missing = missingSideQuestCategories(context);
    expect(sides.length + missing.length).toBe(6);
    if (!data.people.length) expect(missing).toContain("relationships");
  });
});

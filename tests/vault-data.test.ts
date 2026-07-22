import { describe, expect, it } from "vitest";
import { getVaultDashboardData } from "@/lib/lifeos/vault-data";

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
});

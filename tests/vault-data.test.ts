import { describe, expect, it } from "vitest";
import { getVaultDashboardData } from "@/lib/lifeos/vault-data";

describe("vault dashboard data", () => {
  it("loads active project priorities from canonical vault notes", async () => {
    const data = await getVaultDashboardData(new Date("2026-07-17T12:00:00Z"));
    expect(data.priorities.length).toBeGreaterThan(0);
    expect(data.priorities[0].priority).toBe("P0");
    expect(data.priorities.every((project) => project.nextAction.length > 0)).toBe(true);
    expect(data.reviewsDue).toBeGreaterThan(0);
  });

  it("loads the AI role registry from vault files", async () => {
    const data = await getVaultDashboardData();
    expect(data.agents.map((agent) => agent.name)).toContain("Chief of Staff");
    expect(data.agents.every((agent) => agent.purpose.length > 0)).toBe(true);
  });
});

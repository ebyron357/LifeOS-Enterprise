import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const route = readFileSync(path.join(process.cwd(), "app/api/lifeos/change-plan/route.ts"), "utf8");
const client = readFileSync(path.join(process.cwd(), "components/dashboard/ChangePlanPersistence.tsx"), "utf8");

describe("LifeOS change-plan persistence guardrails", () => {
  it("is default-deny and requires server-side authorization", () => {
    expect(route).toContain('LIFEOS_WRITE_ENABLED !== "true"');
    expect(route).toContain("LIFEOS_WRITE_SECRET");
    expect(route).toContain("LIFEOS_GITHUB_TOKEN");
    expect(client).not.toContain("LIFEOS_GITHUB_TOKEN");
  });

  it("allowlists project paths, fields, statuses, and priorities", () => {
    expect(route).toContain('normalized.startsWith("Projects/")');
    expect(route).toContain('normalized.startsWith("10 Projects/")');
    expect(route).toContain('new Set(["status", "priority", "next_action"])');
    expect(route).toContain('new Set(["active", "waiting", "blocked", "complete"])');
    expect(route).toContain('new Set(["P0", "P1", "P2", "P3"])');
  });

  it("creates a branch and draft PR rather than writing to main", () => {
    expect(route).toContain('const branch = `lifeos/change-plan-${Date.now()}`');
    expect(route).toContain('draft: true');
    expect(route).toContain('base: BASE');
    expect(route).not.toContain('branch: BASE');
  });
});

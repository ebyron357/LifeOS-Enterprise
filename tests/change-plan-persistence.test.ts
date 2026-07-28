import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/lifeos/change-plan/route";

const routeSource = readFileSync(path.join(process.cwd(), "app/api/lifeos/change-plan/route.ts"), "utf8");
const clientSource = readFileSync(path.join(process.cwd(), "components/dashboard/ChangePlanPersistence.tsx"), "utf8");

function request(plan: unknown, secret = "test-secret") {
  return new Request("https://lifeos.example/api/lifeos/change-plan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
      Origin: "https://lifeos.example",
    },
    body: JSON.stringify({ plan }),
  });
}

const validPlan = {
  schema: "lifeos.change-plan.v1",
  write_mode: "proposal-only",
  changes: [{
    project: "Alpha",
    path: "10 Projects/Alpha.md",
    fields: [{ field: "status", from: "active", to: "waiting" }],
  }],
};

describe("LifeOS change-plan persistence V2", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("reports locked service state without exposing credentials", async () => {
    vi.stubEnv("LIFEOS_WRITE_ENABLED", "false");
    const response = await GET();
    const result = await response.json();
    expect(result).toMatchObject({ enabled: false, configured: false, directMainWrites: false });
    expect(clientSource).not.toContain("LIFEOS_GITHUB_TOKEN");
  });

  it("rejects writes while the service is disabled", async () => {
    vi.stubEnv("LIFEOS_WRITE_ENABLED", "false");
    const response = await POST(request(validPlan));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ ok: false, error: "Vault write service is disabled." });
  });

  it("rejects unauthorized requests before GitHub access", async () => {
    vi.stubEnv("LIFEOS_WRITE_ENABLED", "true");
    vi.stubEnv("LIFEOS_WRITE_SECRET", "correct-secret");
    vi.stubEnv("LIFEOS_GITHUB_TOKEN", "server-only-token");
    const githubFetch = vi.fn();
    vi.stubGlobal("fetch", githubFetch);
    const response = await POST(request(validPlan, "wrong-secret"));
    expect(response.status).toBe(401);
    expect(githubFetch).not.toHaveBeenCalled();
  });

  it.each([
    ["traversal", { ...validPlan, changes: [{ ...validPlan.changes[0], path: "10 Projects/../secret.md" }] }],
    ["template", { ...validPlan, changes: [{ ...validPlan.changes[0], path: "10 Projects/Project Template.md" }] }],
    ["archive", { ...validPlan, changes: [{ ...validPlan.changes[0], path: "10 Projects/Archive/Alpha.md" }] }],
    ["invalid field", { ...validPlan, changes: [{ ...validPlan.changes[0], fields: [{ field: "owner", from: "A", to: "B" }] }] }],
  ])("rejects %s plans before GitHub access", async (_name, plan) => {
    vi.stubEnv("LIFEOS_WRITE_ENABLED", "true");
    vi.stubEnv("LIFEOS_WRITE_SECRET", "test-secret");
    vi.stubEnv("LIFEOS_GITHUB_TOKEN", "server-only-token");
    const githubFetch = vi.fn();
    vi.stubGlobal("fetch", githubFetch);
    const response = await POST(request(plan));
    expect(response.status).toBe(400);
    expect(githubFetch).not.toHaveBeenCalled();
  });

  it("uses deterministic branches, draft PRs, conflict checks, cleanup, and no direct main write", () => {
    expect(routeSource).toContain("function planId");
    expect(routeSource).toContain("validateCanonical");
    expect(routeSource).toContain("existingPull");
    expect(routeSource).toContain("deleteBranch");
    expect(routeSource).toContain("draft: true");
    expect(routeSource).toContain("base: BASE");
    expect(routeSource).not.toContain("branch: BASE");
  });
});

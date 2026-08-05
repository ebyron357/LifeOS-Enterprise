import { describe, expect, it, vi } from "vitest";
import {
  applySync,
  planFieldReuse,
  planSync,
  withRetry,
  REQUIRED_FIELD_DEFINITIONS,
  RetryExhaustedError,
  type LastSyncedSnapshot,
  type ProjectV2Field,
  type ProjectV2Item,
  type ProjectsV2Client,
} from "@/lib/portfolio/github-project-sync";
import type { PortfolioProject } from "@/lib/portfolio/types";

const NOW = "2026-08-01T00:00:00Z";

function project(overrides: Partial<PortfolioProject> = {}): PortfolioProject {
  return {
    projectId: "sample-project",
    name: "Sample Project",
    outcome: "",
    projectType: "Product",
    status: "Active",
    legacyStatus: "active",
    priority: "High",
    legacyPriority: "P1",
    health: "On Track",
    phase: "Build",
    nextAction: "Ship v1",
    blocker: "",
    waitingOn: "",
    dueDate: "",
    reviewDate: "2026-08-15",
    lastVerified: "2026-07-30",
    humanOwner: "Byron",
    assignedAgentRecord: "",
    canonicalRepository: "ebyron357/sample-repo",
    referenceRepositories: [],
    githubProjectItemId: "",
    evidence: [],
    syncStatus: "Not Synced",
    createdAt: "2026-01-01",
    updatedAt: "2026-07-30",
    sourcePath: "10 Projects/Sample Project.md",
    ...overrides,
  };
}

function boardItem(projectId: string, fields: Record<string, string>, id = `item-${projectId}`): ProjectV2Item {
  return {
    id,
    fieldValues: [{ fieldId: "project-id-field", fieldName: "Project ID", value: projectId }, ...Object.entries(fields).map(([fieldName, value]) => ({ fieldId: fieldName, fieldName, value }))],
  };
}

/** All of a PortfolioProject's syncable field values, matching github-project-sync's internal mapping. */
function allSyncableFields(p: PortfolioProject): Record<string, string> {
  return {
    Status: p.status,
    Priority: p.priority,
    Health: p.health,
    "Current Phase": p.phase,
    "Next Action": p.nextAction,
    Blocker: p.blocker,
    "Waiting On": p.waitingOn,
    "Due Date": p.dueDate,
    "Review Date": p.reviewDate,
    "Last Verified": p.lastVerified,
    Owner: p.humanOwner,
    "Assigned Agent Record": p.assignedAgentRecord,
    "Canonical Repository": p.canonicalRepository,
    "Reference Repositories": p.referenceRepositories.join(", "),
  };
}

function existingFieldsMatchingAllRequired(): ProjectV2Field[] {
  return REQUIRED_FIELD_DEFINITIONS.map((def, index) => ({ id: `field-${index}`, name: def.name, dataType: def.dataType, options: def.options?.map((o) => ({ id: o, name: o })) }));
}

describe("planFieldReuse", () => {
  it("test case 14: reuses fields that already exist on the board by normalized name, never proposing duplicates", () => {
    const existing: ProjectV2Field[] = [
      { id: "f1", name: "status", dataType: "SINGLE_SELECT" },
      { id: "f2", name: "Next-Action", dataType: "TEXT" },
    ];
    const plan = planFieldReuse(existing, [{ name: "Status", dataType: "SINGLE_SELECT" }, { name: "Next Action", dataType: "TEXT" }, { name: "Blocker", dataType: "TEXT" }]);
    expect(plan.reused.get("Status")?.id).toBe("f1");
    expect(plan.reused.get("Next Action")?.id).toBe("f2");
    expect(plan.missing).toEqual(["Blocker"]);
  });
});

describe("planSync", () => {
  it("test case 15: matches an existing board item by stable Project ID instead of creating a duplicate", () => {
    const fieldPlan = planFieldReuse(existingFieldsMatchingAllRequired());
    const p = project();
    const existing = [boardItem(p.projectId, allSyncableFields(p))];
    const plan = planSync([p], existing, fieldPlan, {}, NOW);
    expect(plan.items).toHaveLength(1);
    expect(plan.items[0].action).not.toBe("create");
    expect(plan.items[0].action).toBe("skip-unchanged");
  });

  it("creates a new item when no board item matches the project's stable ID", () => {
    const fieldPlan = planFieldReuse(existingFieldsMatchingAllRequired());
    const plan = planSync([project()], [], fieldPlan, {}, NOW);
    expect(plan.items[0].action).toBe("create");
    expect(plan.items[0].fieldsToWrite.Status).toBe("Active");
  });

  it("test case 9: running the same sync twice in a row is idempotent (second run is skip-unchanged, no duplicate item)", () => {
    const fieldPlan = planFieldReuse(existingFieldsMatchingAllRequired());
    const firstRun = planSync([project()], [], fieldPlan, {}, NOW);
    expect(firstRun.items[0].action).toBe("create");

    // Simulate the board now reflecting what the first run would have written.
    const boardAfterFirstRun = [boardItem("sample-project", firstRun.items[0].fieldsToWrite)];
    const lastSynced: LastSyncedSnapshot = { "sample-project": firstRun.items[0].fieldsToWrite };
    const secondRun = planSync([project()], boardAfterFirstRun, fieldPlan, lastSynced, NOW);
    expect(secondRun.items[0].action).toBe("skip-unchanged");
    expect(secondRun.items).toHaveLength(1);
  });

  it("test case 10: a human-entered field conflict is detected and never silently overwritten", () => {
    const fieldPlan = planFieldReuse(existingFieldsMatchingAllRequired());
    // We last wrote Status=Active; a human has since changed the board to Blocked directly.
    const existing = [boardItem("sample-project", { Status: "Blocked", Priority: "High", Health: "On Track" })];
    const lastSynced: LastSyncedSnapshot = { "sample-project": { Status: "Active", Priority: "High", Health: "On Track" } };
    const plan = planSync([project({ status: "Active" })], existing, fieldPlan, lastSynced, NOW);

    expect(plan.items[0].conflicts).toHaveLength(1);
    expect(plan.items[0].conflicts[0].field).toBe("Status");
    expect(plan.items[0].conflicts[0].currentValue).toBe("Blocked");
    expect(plan.items[0].fieldsToWrite.Status).toBeUndefined();
  });

  it("skips writing to fields that do not yet exist on the board", () => {
    const fieldPlan = planFieldReuse([{ id: "f1", name: "Status", dataType: "SINGLE_SELECT" }]);
    const plan = planSync([project()], [], fieldPlan, {}, NOW);
    expect(plan.fieldsMissing).toContain("Priority");
    expect(plan.items[0].fieldsToWrite.Priority).toBeUndefined();
  });
});

describe("withRetry / rate limiting", () => {
  it("test case 11: retries on a GitHub rate-limit response and eventually succeeds", async () => {
    let attempts = 0;
    const fn = vi.fn(async () => {
      attempts += 1;
      if (attempts < 3) {
        const error = new Error("API rate limit exceeded") as Error & { status?: number };
        error.status = 403;
        throw error;
      }
      return "ok";
    });
    const result = await withRetry(fn, { maxAttempts: 5, sleep: async () => undefined });
    expect(result).toBe("ok");
    expect(attempts).toBe(3);
  });

  it("test case 12: does not retry a plain permission error without a rate-limit signal", async () => {
    const error = new Error("Resource not accessible by integration") as Error & { status?: number };
    error.status = 403;
    const fn = vi.fn(async () => { throw error; });
    await expect(withRetry(fn, { maxAttempts: 5, sleep: async () => undefined })).rejects.toThrow(/not accessible/i);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("gives up after the bounded retry limit and reports the exhaustion", async () => {
    const fn = vi.fn(async () => {
      const error = new Error("Secondary rate limit") as Error & { status?: number };
      error.status = 429;
      throw error;
    });
    await expect(withRetry(fn, { maxAttempts: 3, sleep: async () => undefined })).rejects.toBeInstanceOf(RetryExhaustedError);
    expect(fn).toHaveBeenCalledTimes(3);
  });
});

describe("applySync", () => {
  function fakeClient(overrides: Partial<ProjectsV2Client> = {}): ProjectsV2Client {
    return {
      listFields: async () => [],
      listItems: async () => [],
      createField: async (_projectId, name, dataType, options) => ({ id: `field-${name}`, name, dataType, options: options?.map((o) => ({ id: o, name: o })) }),
      createItem: async (_projectId, title) => ({ id: `item-${title}`, fieldValues: [] }),
      updateItemField: async () => undefined,
      ...overrides,
    };
  }

  it("dry-run mode never calls any client mutation method", async () => {
    const fieldPlan = planFieldReuse(existingFieldsMatchingAllRequired());
    const plan = planSync([project()], [], fieldPlan, {}, NOW);
    const createItem = vi.fn();
    const updateItemField = vi.fn();
    const outcome = await applySync("PVT_test", plan, fakeClient({ createItem, updateItemField }), fieldPlan, { dryRun: true });

    expect(outcome.dryRun).toBe(true);
    expect(outcome.itemsCreated).toBe(1);
    expect(createItem).not.toHaveBeenCalled();
    expect(updateItemField).not.toHaveBeenCalled();
    expect(outcome.log.some((entry) => entry.message.includes("[dry-run]"))).toBe(true);
  });

  it("test case 13: a partial synchronization failure on one item does not abort the rest of the run", async () => {
    const fieldPlan = planFieldReuse(existingFieldsMatchingAllRequired());
    const plan = planSync(
      [project({ projectId: "good-project" }), project({ projectId: "bad-project", name: "Bad Project" })],
      [],
      fieldPlan,
      {},
      NOW,
    );

    let calls = 0;
    const client = fakeClient({
      createItem: async (_projectId, title) => {
        calls += 1;
        if (title === "bad-project") throw new Error("simulated transient failure");
        return { id: `item-${title}`, fieldValues: [] };
      },
    });

    const outcome = await applySync("PVT_test", plan, client, fieldPlan, { dryRun: false });
    expect(calls).toBe(2);
    expect(outcome.itemsCreated).toBe(1);
    expect(outcome.errors).toHaveLength(1);
    expect(outcome.errors[0]).toContain("bad-project");
  });

  it("reports conflicts in the outcome without writing the conflicting field", async () => {
    const fieldPlan = planFieldReuse(existingFieldsMatchingAllRequired());
    const existing = [boardItem("sample-project", { Status: "Blocked" })];
    const lastSynced: LastSyncedSnapshot = { "sample-project": { Status: "Active" } };
    const plan = planSync([project()], existing, fieldPlan, lastSynced, NOW);
    const updateItemField = vi.fn();
    const outcome = await applySync("PVT_test", plan, fakeClient({ updateItemField }), fieldPlan, { dryRun: true });

    expect(outcome.conflicts).toHaveLength(1);
    expect(outcome.conflicts[0].field).toBe("Status");
    expect(updateItemField).not.toHaveBeenCalled();
  });

  it("logs, but does not create, missing required fields unless explicitly asked to", async () => {
    const fieldPlan = planFieldReuse([{ id: "f1", name: "Status", dataType: "SINGLE_SELECT" }]);
    const plan = planSync([project()], [], fieldPlan, {}, NOW);
    const createField = vi.fn();
    const outcome = await applySync("PVT_test", plan, fakeClient({ createField }), fieldPlan, { dryRun: false, createMissingFields: false });

    expect(createField).not.toHaveBeenCalled();
    expect(outcome.fieldsMissing.length).toBeGreaterThan(0);
    expect(outcome.log.some((entry) => entry.level === "warn")).toBe(true);
  });
});

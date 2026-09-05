import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createMemoryApprovalStore,
  createSharedMemoryBacking,
  getApprovalStore,
  setApprovalStoreForTests,
} from "@/lib/agent/approval-store";
import {
  consumeAuthoritativeApproval,
  createAuthoritativeApproval,
  isAuthoritativeApproval,
  registerAuthoritativeApproval,
  resetAuthoritativeApprovalsForTests,
} from "@/lib/agent/approvals";

async function register(input: Parameters<typeof createAuthoritativeApproval>[0]) {
  const approval = await registerAuthoritativeApproval(createAuthoritativeApproval(input));
  expect(isAuthoritativeApproval(approval)).toBe(true);
  if (!isAuthoritativeApproval(approval)) {
    throw new Error(!approval.ok ? approval.error : "Approval registration failed.");
  }
  return approval;
}

describe("authoritative approvals", () => {
  afterEach(() => {
    resetAuthoritativeApprovalsForTests();
  });

  beforeEach(() => {
    resetAuthoritativeApprovalsForTests();
  });

  it("rejects forged, expired, replayed, and wrong-project approvals", async () => {
    const createdAt = "2026-09-04T12:00:00.000Z";
    const approval = await register({
      sessionId: "sess-a",
      toolId: "slack.send_message",
      riskLevel: "high",
      summary: "Send Slack message",
      args: { text: "hello" },
      createdAt,
      projectPath: "Projects/Ship Voice.md",
      pathAllowlist: ["Projects/Ship Voice.md"],
      ttlMs: 60_000,
    });

    expect(
      (await consumeAuthoritativeApproval({
        approvalId: "apr-forged",
        decision: "approved",
        sessionId: "sess-a",
        nowIso: createdAt,
      })).ok,
    ).toBe(false);

    expect(
      await consumeAuthoritativeApproval({
        approvalId: approval.id,
        decision: "approved",
        sessionId: "sess-b",
        nowIso: createdAt,
      }),
    ).toMatchObject({ ok: false, error: expect.stringMatching(/session binding/i) });

    expect(
      await consumeAuthoritativeApproval({
        approvalId: approval.id,
        decision: "approved",
        sessionId: "sess-a",
        nowIso: createdAt,
        projectPath: "Projects/Other.md",
      }),
    ).toMatchObject({ ok: false, error: expect.stringMatching(/project binding/i) });

    expect(
      await consumeAuthoritativeApproval({
        approvalId: approval.id,
        decision: "approved",
        sessionId: "sess-a",
        nowIso: "2026-09-04T13:00:00.000Z",
        projectPath: "Projects/Ship Voice.md",
      }),
    ).toMatchObject({ ok: false, error: expect.stringMatching(/expired/i) });

    const ok = await consumeAuthoritativeApproval({
      approvalId: approval.id,
      decision: "approved",
      sessionId: "sess-a",
      nowIso: "2026-09-04T12:00:30.000Z",
      projectPath: "Projects/Ship Voice.md",
    });
    expect(ok.ok).toBe(true);

    expect(
      await consumeAuthoritativeApproval({
        approvalId: approval.id,
        decision: "approved",
        sessionId: "sess-a",
        nowIso: "2026-09-04T12:00:40.000Z",
        projectPath: "Projects/Ship Voice.md",
      }),
    ).toMatchObject({ ok: false, error: expect.stringMatching(/replayed|already decided|already consumed/i) });
  });

  it("never treats a browser-only approval indicator as authorization", async () => {
    const result = await consumeAuthoritativeApproval({
      approvalId: "apr-browser-only",
      decision: "approved",
      sessionId: "sess-a",
      nowIso: "2026-09-04T12:00:00.000Z",
    });
    expect(result).toMatchObject({ ok: false, status: 404 });
  });

  it("rejects revision-binding and path-allowlist mismatches", async () => {
    const createdAt = "2026-09-04T12:00:00.000Z";
    const approval = await register({
      sessionId: "sess-a",
      toolId: "lifeos.stage_project_change",
      riskLevel: "reversible",
      summary: "Stage a project change",
      args: { path: "Projects/Ship Voice.md" },
      createdAt,
      projectPath: "Projects/Ship Voice.md",
      pathAllowlist: ["Projects/Ship Voice.md"],
      revisionBinding: "rev-abc",
      ttlMs: 60_000,
    });

    expect(
      await consumeAuthoritativeApproval({
        approvalId: approval.id,
        decision: "approved",
        sessionId: "sess-a",
        nowIso: createdAt,
        projectPath: "Projects/Ship Voice.md",
        requestedPath: "Projects/Other.md",
        revisionBinding: "rev-abc",
      }),
    ).toMatchObject({ ok: false, error: expect.stringMatching(/allowlist/i) });

    expect(
      await consumeAuthoritativeApproval({
        approvalId: approval.id,
        decision: "approved",
        sessionId: "sess-a",
        nowIso: createdAt,
        projectPath: "Projects/Ship Voice.md",
        requestedPath: "Projects/Ship Voice.md",
        revisionBinding: "rev-stale",
      }),
    ).toMatchObject({ ok: false, error: expect.stringMatching(/revision binding/i) });

    expect(
      (await consumeAuthoritativeApproval({
        approvalId: approval.id,
        decision: "approved",
        sessionId: "sess-a",
        nowIso: createdAt,
        projectPath: "Projects/Ship Voice.md",
        requestedPath: "Projects/Ship Voice.md",
        revisionBinding: "rev-abc",
      })).ok,
    ).toBe(true);
  });

  it("rejects replay across simulated instances that share durable backing", async () => {
    const backing = createSharedMemoryBacking();
    const instanceA = createMemoryApprovalStore(backing);
    const instanceB = createMemoryApprovalStore(backing);
    setApprovalStoreForTests(instanceA);
    const approval = await register({
      sessionId: "sess-shared",
      toolId: "slack.send_message",
      riskLevel: "high",
      summary: "Send Slack message",
      args: { message: "Exact approved Slack text" },
      createdAt: "2026-09-05T12:00:00.000Z",
      ttlMs: 60_000,
    });

    setApprovalStoreForTests(instanceB);
    const first = await consumeAuthoritativeApproval({
      approvalId: approval.id,
      decision: "approved",
      sessionId: "sess-shared",
      nowIso: "2026-09-05T12:00:10.000Z",
    });
    expect(first.ok).toBe(true);

    setApprovalStoreForTests(instanceA);
    const replay = await consumeAuthoritativeApproval({
      approvalId: approval.id,
      decision: "approved",
      sessionId: "sess-shared",
      nowIso: "2026-09-05T12:00:11.000Z",
    });
    expect(replay).toMatchObject({ ok: false, status: 409 });
  });

  it("fails closed when durable approval storage is unavailable", async () => {
    setApprovalStoreForTests(null);
    setApprovalStoreForTests(getApprovalStore({ LIFEOS_APPROVAL_STORE: "none" }));
    const registered = await registerAuthoritativeApproval(createAuthoritativeApproval({
      sessionId: "sess-a",
      toolId: "slack.send_message",
      riskLevel: "high",
      summary: "Send Slack message",
      args: { message: "should not store" },
      createdAt: "2026-09-05T12:00:00.000Z",
    }));
    expect(registered).toMatchObject({ ok: false, status: 503, error: expect.stringMatching(/unavailable|not configured|disabled/i) });

    const consumed = await consumeAuthoritativeApproval({
      approvalId: "apr-missing",
      decision: "approved",
      sessionId: "sess-a",
      nowIso: "2026-09-05T12:00:00.000Z",
    });
    expect(consumed).toMatchObject({ ok: false, status: 503 });
  });
});

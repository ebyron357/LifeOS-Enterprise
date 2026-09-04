import { afterEach, describe, expect, it } from "vitest";
import {
  consumeAuthoritativeApproval,
  createAuthoritativeApproval,
  registerAuthoritativeApproval,
  resetAuthoritativeApprovalsForTests,
} from "@/lib/agent/approvals";

describe("authoritative approvals", () => {
  afterEach(() => {
    resetAuthoritativeApprovalsForTests();
  });

  it("rejects forged, expired, replayed, and wrong-project approvals", () => {
    const createdAt = "2026-09-04T12:00:00.000Z";
    const approval = registerAuthoritativeApproval(
      createAuthoritativeApproval({
        sessionId: "sess-a",
        toolId: "slack.send_message",
        riskLevel: "high",
        summary: "Send Slack message",
        args: { text: "hello" },
        createdAt,
        projectPath: "Projects/Ship Voice.md",
        pathAllowlist: ["Projects/Ship Voice.md"],
        ttlMs: 60_000,
      }),
    );

    expect(
      consumeAuthoritativeApproval({
        approvalId: "apr-forged",
        decision: "approved",
        sessionId: "sess-a",
        nowIso: createdAt,
      }).ok,
    ).toBe(false);

    expect(
      consumeAuthoritativeApproval({
        approvalId: approval.id,
        decision: "approved",
        sessionId: "sess-b",
        nowIso: createdAt,
      }),
    ).toMatchObject({ ok: false, error: expect.stringMatching(/session binding/i) });

    expect(
      consumeAuthoritativeApproval({
        approvalId: approval.id,
        decision: "approved",
        sessionId: "sess-a",
        nowIso: createdAt,
        projectPath: "Projects/Other.md",
      }),
    ).toMatchObject({ ok: false, error: expect.stringMatching(/project binding/i) });

    expect(
      consumeAuthoritativeApproval({
        approvalId: approval.id,
        decision: "approved",
        sessionId: "sess-a",
        nowIso: "2026-09-04T13:00:00.000Z",
      }),
    ).toMatchObject({ ok: false, error: expect.stringMatching(/expired/i) });

    const ok = consumeAuthoritativeApproval({
      approvalId: approval.id,
      decision: "approved",
      sessionId: "sess-a",
      nowIso: "2026-09-04T12:00:30.000Z",
      projectPath: "Projects/Ship Voice.md",
    });
    expect(ok.ok).toBe(true);

    expect(
      consumeAuthoritativeApproval({
        approvalId: approval.id,
        decision: "approved",
        sessionId: "sess-a",
        nowIso: "2026-09-04T12:00:40.000Z",
        projectPath: "Projects/Ship Voice.md",
      }),
    ).toMatchObject({ ok: false, error: expect.stringMatching(/replayed|already decided/i) });
  });

  it("never treats a browser-only approval indicator as authorization", () => {
    // Client-fabricated approval ids are unknown to the authoritative store.
    const result = consumeAuthoritativeApproval({
      approvalId: "apr-browser-only",
      decision: "approved",
      sessionId: "sess-a",
      nowIso: "2026-09-04T12:00:00.000Z",
    });
    expect(result).toMatchObject({ ok: false, status: 404 });
  });
});

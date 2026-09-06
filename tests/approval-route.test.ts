import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/lifeos/agent/approval/route";
import {
  createAuthoritativeApproval,
  isAuthoritativeApproval,
  registerAuthoritativeApproval,
  resetAuthoritativeApprovalsForTests,
} from "@/lib/agent/approvals";
import { getApprovalStore, setApprovalStoreForTests } from "@/lib/agent/approval-store";
import { createEphemeralVoiceSessionToken } from "@/lib/voice/security";

vi.mock("@/lib/lifeos/vault-data", () => ({
  getVaultDashboardData: async () => ({
    projects: [],
    agents: [],
    activeProjects: 0,
    waitingOn: 0,
    reviewsDue: 0,
    priorities: [],
  }),
}));

function approvalRequest(body: Record<string, unknown>, secret?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Origin: "https://lifeos.example",
  };
  if (secret) headers.Authorization = `Bearer ${secret}`;
  return new Request("https://lifeos.example/api/lifeos/agent/approval", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

async function seedApproval(args: Record<string, unknown> = { message: "Exact approved Slack text", text: "Exact approved Slack text" }) {
  const approval = await registerAuthoritativeApproval(createAuthoritativeApproval({
    sessionId: "sess-owner",
    toolId: "slack.send_message",
    riskLevel: "high",
    summary: "Send Slack message requires explicit approval.",
    args,
    createdAt: new Date().toISOString(),
    ttlMs: 15 * 60 * 1000,
  }));
  if (!isAuthoritativeApproval(approval)) {
    throw new Error(!approval.ok ? approval.error : "Approval registration failed.");
  }
  return approval;
}

describe("approval route owner write authorization", () => {
  beforeEach(() => {
    vi.stubEnv("LIFEOS_ALLOWED_ORIGIN", "https://lifeos.example");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    resetAuthoritativeApprovalsForTests();
  });

  it("rejects anonymous approval execution", async () => {
    vi.stubEnv("LIFEOS_WRITE_ENABLED", "true");
    vi.stubEnv("LIFEOS_WRITE_SECRET", "owner-write-secret");
    const approval = await seedApproval();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(approvalRequest({
      sessionId: "sess-owner",
      approvalId: approval.id,
      decision: "approved",
    }));
    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects voice-session tokens for writes", async () => {
    vi.stubEnv("LIFEOS_WRITE_ENABLED", "true");
    vi.stubEnv("LIFEOS_WRITE_SECRET", "owner-write-secret");
    vi.stubEnv("LIFEOS_VOICE_SESSION_SECRET", "voice-session-secret");
    const token = createEphemeralVoiceSessionToken();
    expect(token).toBeTruthy();
    const approval = await seedApproval();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(approvalRequest({
      sessionId: "sess-owner",
      approvalId: approval.id,
      decision: "approved",
    }, token!));
    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed when the write gate is disabled", async () => {
    vi.stubEnv("LIFEOS_WRITE_ENABLED", "false");
    vi.stubEnv("LIFEOS_WRITE_SECRET", "owner-write-secret");
    const approval = await seedApproval();
    const response = await POST(approvalRequest({
      sessionId: "sess-owner",
      approvalId: approval.id,
      decision: "approved",
    }, "owner-write-secret"));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: expect.stringMatching(/disabled/i) });
  });

  it("fails closed when durable approval storage is unavailable", async () => {
    vi.stubEnv("LIFEOS_WRITE_ENABLED", "true");
    vi.stubEnv("LIFEOS_WRITE_SECRET", "owner-write-secret");
    setApprovalStoreForTests(null);
    setApprovalStoreForTests(getApprovalStore({ LIFEOS_APPROVAL_STORE: "none" }));
    const response = await POST(approvalRequest({
      sessionId: "sess-owner",
      approvalId: "apr-missing",
      decision: "approved",
    }, "owner-write-secret"));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: expect.stringMatching(/unavailable|not configured|disabled/i) });
  });

  it("executes the stored approved payload rather than the summary", async () => {
    vi.stubEnv("LIFEOS_WRITE_ENABLED", "true");
    vi.stubEnv("LIFEOS_WRITE_SECRET", "owner-write-secret");
    vi.stubEnv("SLACK_BOT_TOKEN", "slack-token");
    vi.stubEnv("SLACK_DEFAULT_CHANNEL", "C123");
    const approval = await seedApproval({
      message: "Exact approved Slack text",
      text: "Exact approved Slack text",
    });
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true, ts: "1.2" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(approvalRequest({
      sessionId: "sess-owner",
      approvalId: approval.id,
      decision: "approved",
    }, "owner-write-secret"));
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.result.status).toBe("completed");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [, slackInit] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(slackInit?.body))).toMatchObject({
      channel: "C123",
      text: "Exact approved Slack text",
    });
    expect(JSON.stringify(slackInit?.body)).not.toContain(approval.summary);
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { executeExternalApprovedTool } from "@/lib/agent/tools/executor";
import type { AgentTurnInput } from "@/lib/agent/types";

const input: AgentTurnInput = {
  sessionId: "sess",
  channel: "text",
  text: "Run external action",
  nowIso: "2026-09-03T12:00:00.000Z",
  paused: false,
  transcriptPrivacy: "ephemeral",
  pendingApprovals: [],
  screen: null,
  vault: {
    projects: [],
    agents: [],
    activeProjects: 0,
    waitingOn: 0,
    reviewsDue: 0,
    priorities: [],
  },
};

describe("agent external executors", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.N8N_WEBHOOK_URL;
  });

  it("returns unavailable when required config is missing", async () => {
    const result = await executeExternalApprovedTool(input, "clickup.create_task", "inv1");
    expect(result.status).toBe("unavailable");
  });

  it("returns completed with evidence when n8n is configured", async () => {
    process.env.N8N_WEBHOOK_URL = "https://example.test/webhook";
    vi.stubGlobal("fetch", vi.fn(async () => new Response("ok", { status: 200 })));
    const result = await executeExternalApprovedTool(input, "n8n.trigger_workflow", "inv2");
    expect(result.status).toBe("completed");
    expect(result.evidence[0]).toContain("n8n_status");
  });

  it("returns failed when webhook returns non-2xx", async () => {
    process.env.N8N_WEBHOOK_URL = "https://example.test/webhook";
    vi.stubGlobal("fetch", vi.fn(async () => new Response("bad", { status: 500 })));
    const result = await executeExternalApprovedTool(input, "n8n.trigger_workflow", "inv3");
    expect(result.status).toBe("failed");
  });
});

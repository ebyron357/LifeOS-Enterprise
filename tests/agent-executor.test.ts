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
    delete process.env.SLACK_BOT_TOKEN;
    delete process.env.SLACK_DEFAULT_CHANNEL;
    delete process.env.CLICKUP_API_TOKEN;
    delete process.env.CLICKUP_LIST_ID;
    delete process.env.VERCEL_TOKEN;
    delete process.env.VERCEL_PROJECT_ID;
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

  it("sends the approved Slack, ClickUp, n8n, and Vercel payloads rather than a summary", async () => {
    process.env.SLACK_BOT_TOKEN = "slack-token";
    process.env.SLACK_DEFAULT_CHANNEL = "C123";
    process.env.CLICKUP_API_TOKEN = "clickup-token";
    process.env.CLICKUP_LIST_ID = "list-1";
    process.env.N8N_WEBHOOK_URL = "https://example.test/webhook";
    process.env.VERCEL_TOKEN = "vercel-token";
    process.env.VERCEL_PROJECT_ID = "prj_1";
    const fetchMock = vi.fn(async (url: string) => {
      if (String(url).includes("slack")) return new Response(JSON.stringify({ ok: true, ts: "1.2" }), { status: 200 });
      if (String(url).includes("clickup")) return new Response(JSON.stringify({ id: "task-9" }), { status: 200 });
      if (String(url).includes("vercel")) return new Response(JSON.stringify({ id: "dpl_1" }), { status: 200 });
      return new Response("ok", { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    await executeExternalApprovedTool(input, "slack.send_message", "inv-slack", {
      message: "Exact approved Slack text",
      text: "Exact approved Slack text",
    });
    await executeExternalApprovedTool(input, "clickup.create_task", "inv-clickup", {
      name: "Exact approved ClickUp title",
      description: "Exact approved ClickUp body",
    });
    await executeExternalApprovedTool(input, "n8n.trigger_workflow", "inv-n8n", {
      payload: { source: "lifeos", approved: true, action: "Exact approved n8n payload" },
    });
    await executeExternalApprovedTool(input, "vercel.deploy_production", "inv-vercel", {
      target: "production",
    });

    const bodies = fetchMock.mock.calls.map((call) => {
      const [, init] = call as unknown as [string, RequestInit];
      return JSON.parse(String(init.body));
    });
    expect(bodies).toEqual(expect.arrayContaining([
      expect.objectContaining({ channel: "C123", text: "Exact approved Slack text" }),
      expect.objectContaining({ name: "Exact approved ClickUp title", description: "Exact approved ClickUp body" }),
      { source: "lifeos", approved: true, action: "Exact approved n8n payload" },
      expect.objectContaining({ target: "production", project: "prj_1" }),
    ]));
    expect(JSON.stringify(bodies)).not.toContain("Run external action");
    delete process.env.SLACK_BOT_TOKEN;
    delete process.env.SLACK_DEFAULT_CHANNEL;
    delete process.env.CLICKUP_API_TOKEN;
    delete process.env.CLICKUP_LIST_ID;
    delete process.env.VERCEL_TOKEN;
    delete process.env.VERCEL_PROJECT_ID;
  });

  it("returns failed when webhook returns non-2xx", async () => {
    process.env.N8N_WEBHOOK_URL = "https://example.test/webhook";
    vi.stubGlobal("fetch", vi.fn(async () => new Response("bad", { status: 500 })));
    const result = await executeExternalApprovedTool(input, "n8n.trigger_workflow", "inv3");
    expect(result.status).toBe("failed");
  });
});

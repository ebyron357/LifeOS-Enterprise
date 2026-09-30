import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/lifeos/agent/turn/route";

const LONG_REPLY = "1 blocked, 0 waiting, 2 reviews due. LifeOS Enterprise needs a review this week. Needs you: approve the staged change.";

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

vi.mock("@/lib/agent/runtime", () => ({
  processAgentTurn: vi.fn(async () => ({
    reply: LONG_REPLY,
    spokenReply: LONG_REPLY,
    state: "idle",
    mission: "Answer from LifeOS context.",
    currentTask: null,
    nextStep: null,
    lastCompletedStep: null,
    waitingForOwner: false,
    invocations: [],
    results: [],
    approvals: [],
    activity: [],
    teaching: null,
    evidence: [],
  })),
}));

function turnRequest(body: Record<string, unknown>) {
  return new Request("https://lifeos.example/api/lifeos/agent/turn", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://lifeos.example" },
    body: JSON.stringify(body),
  });
}

describe("agent turn route response style", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("shortens only the spoken reply for concise and leaves the written reply intact", async () => {
    vi.stubEnv("LIFEOS_ALLOWED_ORIGIN", "https://lifeos.example");
    const concise = await (await POST(turnRequest({ text: "What needs attention?", responseStyle: "concise" }))).json();
    const balanced = await (await POST(turnRequest({ text: "What needs attention?", responseStyle: "balanced" }))).json();
    const coach = await (await POST(turnRequest({ text: "What needs attention?", responseStyle: "coach" }))).json();

    expect(concise.responseStyle).toBe("concise");
    expect(concise.result.spokenReply).toBe("1 blocked, 0 waiting, 2 reviews due.");
    expect(concise.result.reply).toBe(LONG_REPLY);
    expect(balanced.result.spokenReply).toBe(LONG_REPLY);
    expect(coach.result.spokenReply).toBe(LONG_REPLY);
    expect(concise.result.spokenReply.length).toBeLessThan(balanced.result.spokenReply.length);
  });

  it("treats a missing or unknown style as balanced", async () => {
    vi.stubEnv("LIFEOS_ALLOWED_ORIGIN", "https://lifeos.example");
    const missing = await (await POST(turnRequest({ text: "hi" }))).json();
    const unknown = await (await POST(turnRequest({ text: "hi", responseStyle: "shout" }))).json();
    expect(missing.responseStyle).toBe("balanced");
    expect(unknown.responseStyle).toBe("balanced");
    expect(unknown.result.spokenReply).toBe(LONG_REPLY);
  });
});

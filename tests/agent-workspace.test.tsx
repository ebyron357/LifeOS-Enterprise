import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentConversationWorkspace } from "@/components/agent/AgentConversationWorkspace";

const vault = {
  priorities: [{ name: "LifeOS Enterprise", path: "Projects/LifeOS Enterprise.md", status: "active", priority: "P0", business: "LifeOS", nextAction: "Verify.", reviewDate: "2026-08-26", waitingOn: "", blocker: "" }],
  projects: [{ name: "LifeOS Enterprise", path: "Projects/LifeOS Enterprise.md", status: "active", priority: "P0", business: "LifeOS", nextAction: "Verify.", reviewDate: "2026-08-26", waitingOn: "", blocker: "" }],
  agents: [],
  activeProjects: 1,
  waitingOn: 0,
  reviewsDue: 0,
};

describe("conversation workspace", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/lifeos/agent/session")) {
        return new Response(JSON.stringify({ ok: true, tools: [], sessionToken: null }), { status: 200 });
      }
      if (url.includes("/api/lifeos/agent/turn")) {
        return new Response(JSON.stringify({
          ok: true,
          result: {
            reply: "1 blocked, 0 waiting, 0 reviews due.",
            spokenReply: "1 blocked, 0 waiting, 0 reviews due.",
            state: "idle",
            mission: "Answer from LifeOS context.",
            currentTask: "lifeos.read_attention",
            nextStep: "Ask a follow-up or stop the session.",
            lastCompletedStep: "1 blocked, 0 waiting, 0 reviews due.",
            waitingForOwner: false,
            invocations: [],
            results: [],
            approvals: [],
            activity: [],
            teaching: null,
            evidence: [],
          },
        }), { status: 200 });
      }
      return new Response(JSON.stringify({ ok: false }), { status: 404 });
    }));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders voice, screen, agent, teaching, and evidence surfaces", () => {
    render(<AgentConversationWorkspace vault={vault} />);
    expect(screen.getByRole("heading", { name: "Conversation" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start conversation/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /share screen/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pause agent/i })).toBeInTheDocument();
    expect(screen.getByText(/No screen is being shared/i)).toBeInTheDocument();
  });

  it("submits a typed turn through the agent request path", async () => {
    render(<AgentConversationWorkspace vault={vault} />);
    fireEvent.change(screen.getByLabelText("Ask LifeOS"), { target: { value: "What needs attention?" } });
    fireEvent.click(screen.getByRole("button", { name: /^send$/i }));
    expect(await screen.findByText(/Answer from LifeOS context/i)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/api/lifeos/agent/turn", expect.objectContaining({ method: "POST" }));
  });
});

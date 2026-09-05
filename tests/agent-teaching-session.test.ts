import { describe, expect, it } from "vitest";
import { createActivityEvent } from "@/lib/agent/activity";
import { createStructuredLog, isSafeToLogKey, redactSecrets } from "@/lib/agent/observability";
import { createAgentSession, SESSION_PERSISTENCE } from "@/lib/agent/session";
import { advanceTeachingPlan, buildTeachingPlan, describeCurrentTeachingStep, detectTeachingMode } from "@/lib/agent/teaching";
import { processAgentTurn } from "@/lib/agent/runtime";

describe("teaching and session context", () => {
  it("detects teaching modes and keeps one current step", () => {
    expect(detectTeachingMode("Walk me through this screen.")).toBe("Walk Me Through It");
    expect(detectTeachingMode("Show me what to click next.")).toBe("Show Me What To Click");
    const plan = buildTeachingPlan("Teach Me", "How do I approve an action?", false);
    expect(plan.steps).toHaveLength(3);
    expect(describeCurrentTeachingStep(plan)).toMatch(/Teach Me/);
    expect(advanceTeachingPlan(plan).currentStepIndex).toBe(1);
  });

  it("separates ephemeral session state from canonical records", () => {
    const session = createAgentSession("2026-08-26T12:00:00.000Z", "sess-1");
    expect(session.persistence.screenFrames).toBe("ephemeral");
    expect(session.persistence.vaultNotes).toBe("canonical");
    expect(SESSION_PERSISTENCE.changePlanDrafts).toBe("browser-local");
  });

  it("never logs secrets", () => {
    expect(redactSecrets("Authorization: Bearer super-secret")).toMatch(/\[redacted\]/);
    expect(isSafeToLogKey("api_key")).toBe(false);
    expect(createStructuredLog({ event: "tool-invoked", at: "t", toolId: "lifeos.read_projects" }).toolId).toBe("lifeos.read_projects");
    expect(createActivityEvent("session-started", "started").kind).toBe("session-started");
  });

  it("builds a teaching plan from a teach-me turn", async () => {
    const result = await processAgentTurn({
      sessionId: "s",
      channel: "text",
      text: "Teach me how to use LifeOS conversation.",
      nowIso: "2026-08-26T12:00:00.000Z",
      vault: { projects: [], agents: [], activeProjects: 0, waitingOn: 0, reviewsDue: 0, priorities: [] },
      screen: null,
      pendingApprovals: [],
      paused: false,
      transcriptPrivacy: "ephemeral",
    });
    expect(result.teaching?.mode).toBe("Teach Me");
  });
});

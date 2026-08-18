import { describe, expect, it } from "vitest";
import { buildProposedSchedule } from "@/lib/daily-brief/scheduler";
import type { TopOutcome } from "@/lib/daily-brief/types";

function outcome(overrides: Partial<TopOutcome> = {}): TopOutcome {
  return {
    outcomeId: overrides.outcomeId ?? "outcome-1",
    projectId: overrides.projectId ?? "project-1",
    projectName: overrides.projectName ?? "Project One",
    desiredResult: "Ship the release",
    reasonItMattersToday: "It matters",
    evidence: [],
    portfolioStatus: "Active",
    priority: "Critical",
    health: "On Track",
    deadlineOrDependency: "",
    estimatedEffortMinutes: 90,
    ownerType: "Human",
    confidence: "High",
    sourceLinks: [],
    completed: false,
    deferred: false,
    ...overrides,
  };
}

describe("buildProposedSchedule — more work than available time", () => {
  it("truncates scheduled effort to fit within the available (buffered) window instead of overrunning it", () => {
    const outcomes = [
      outcome({ outcomeId: "o1", projectId: "p1", estimatedEffortMinutes: 600 }),
      outcome({ outcomeId: "o2", projectId: "p2", estimatedEffortMinutes: 600 }),
    ];
    const blocks = buildProposedSchedule(outcomes, null);
    const workBlocks = blocks.filter((block) => block.flexibility !== "Buffer");
    // Default window is 09:00-17:00 (480 minutes) with 20% buffer => 384 workable minutes.
    const totalWorkMinutes = workBlocks.reduce((sum, block) => {
      const [sh, sm] = block.startTime.split(":").map(Number);
      const [eh, em] = block.endTime.split(":").map(Number);
      return sum + (eh * 60 + em - (sh * 60 + sm));
    }, 0);
    expect(totalWorkMinutes).toBeLessThanOrEqual(384);
    // Only one of the two 600-minute outcomes can fully fit; verify nothing overruns the day.
    expect(blocks.every((block) => block.endTime <= "17:00")).toBe(true);
  });
});

describe("buildProposedSchedule — blocked/waiting exclusion", () => {
  it("never schedules an outcome whose portfolio status is Blocked or Waiting", () => {
    const outcomes = [outcome({ outcomeId: "o1", portfolioStatus: "Blocked" }), outcome({ outcomeId: "o2", portfolioStatus: "Waiting" })];
    const blocks = buildProposedSchedule(outcomes, null);
    expect(blocks.some((block) => block.sourceOutcomeId === "o1" || block.sourceOutcomeId === "o2")).toBe(false);
  });

  it("never schedules a completed or deferred outcome", () => {
    const outcomes = [outcome({ outcomeId: "o1", completed: true }), outcome({ outcomeId: "o2", deferred: true })];
    const blocks = buildProposedSchedule(outcomes, null);
    expect(blocks.some((block) => block.sourceOutcomeId === "o1" || block.sourceOutcomeId === "o2")).toBe(false);
  });
});

describe("buildProposedSchedule — Start Here placement", () => {
  it("places the Start Here outcome's block first", () => {
    const outcomes = [outcome({ outcomeId: "o1", projectId: "p1" }), outcome({ outcomeId: "o2", projectId: "p2" })];
    const startHere = { actionId: "s1", outcomeId: "o2", projectId: "p2", verbPhrase: "Ship", object: "the release", requiredApprovalOrCredentials: "", startable: true };
    const blocks = buildProposedSchedule(outcomes, startHere);
    const firstWorkBlock = blocks.find((block) => block.flexibility !== "Buffer");
    expect(firstWorkBlock?.sourceOutcomeId).toBe("o2");
  });
});

describe("buildProposedSchedule — buffer settings", () => {
  it("honors a verified user setting that overrides the default 20 percent buffer", () => {
    const outcomes = [outcome({ outcomeId: "o1", estimatedEffortMinutes: 30 })];
    const blocks = buildProposedSchedule(outcomes, null, { bufferRatio: 0.5 });
    const buffer = blocks.find((block) => block.flexibility === "Buffer");
    expect(buffer).toBeDefined();
    // 480 * 0.5 = 240 minutes of buffer.
    const [sh, sm] = buffer!.startTime.split(":").map(Number);
    const [eh, em] = buffer!.endTime.split(":").map(Number);
    expect(eh * 60 + em - (sh * 60 + sm)).toBe(240);
  });
});

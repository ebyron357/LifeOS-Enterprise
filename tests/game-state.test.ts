import { describe, expect, it } from "vitest";
import { createInitialGameState, reduceGameState, repairGameState } from "@/lib/game/state";

const context = {
  nowIso: "2026-09-03T12:00:00.000Z",
  projects: [
    {
      name: "Ship Voice",
      path: "Projects/Ship Voice.md",
      status: "active",
      priority: "P0",
      business: "LifeOS",
      nextAction: "Validate voice fallback.",
      reviewDate: "2026-09-03",
      waitingOn: "",
      blocker: "",
    },
    {
      name: "Blocked Integration",
      path: "Projects/Blocked Integration.md",
      status: "blocked",
      priority: "P1",
      business: "LifeOS",
      nextAction: "Resolve webhook authorization.",
      reviewDate: "2026-09-03",
      waitingOn: "",
      blocker: "Credential approval",
    },
  ],
};

describe("game state engine", () => {
  it("creates deterministic quests and level progression", () => {
    const initial = createInitialGameState(context);
    const today = context.nowIso.slice(0, 10);
    expect(initial.questsByDate[today].length).toBeGreaterThan(0);

    const daily = initial.questsByDate[today][0];
    const afterQuest = reduceGameState(initial, { type: "complete-quest", questId: daily.id }, context);
    expect(afterQuest.stats.xp).toBe(daily.xp);
    expect(afterQuest.stats.level).toBe(1);
  });

  it("does not grant duplicate quest XP", () => {
    const initial = createInitialGameState(context);
    const today = context.nowIso.slice(0, 10);
    const quest = initial.questsByDate[today][1];
    const first = reduceGameState(initial, { type: "complete-quest", questId: quest.id }, context);
    const second = reduceGameState(first, { type: "complete-quest", questId: quest.id }, context);
    expect(second.stats.xp).toBe(first.stats.xp);
    expect(second.lastError).toMatch(/already completed/i);
  });

  it("supports check-in streak and humane recovery", () => {
    const firstDay = createInitialGameState({ ...context, nowIso: "2026-09-01T12:00:00.000Z" });
    const checkedIn = reduceGameState(firstDay, { type: "daily-check-in" }, { ...context, nowIso: "2026-09-01T12:00:00.000Z" });
    const gapDay = reduceGameState(checkedIn, { type: "daily-check-in" }, { ...context, nowIso: "2026-09-03T12:00:00.000Z" });
    expect(gapDay.streakRecovery.missedDate).toBe("2026-09-02");

    const recovered = reduceGameState(gapDay, { type: "recover-streak" }, { ...context, nowIso: "2026-09-03T12:10:00.000Z" });
    expect(recovered.stats.currentStreak).toBeGreaterThan(gapDay.stats.currentStreak);
    expect(recovered.streakRecovery.used).toBe(true);
  });

  it("records end-of-day results deterministically", () => {
    const initial = createInitialGameState(context);
    const today = context.nowIso.slice(0, 10);
    const completed = reduceGameState(initial, { type: "complete-quest", questId: initial.questsByDate[today][0].id }, context);
    const ended = reduceGameState(completed, { type: "end-day" }, context);
    expect(ended.endOfDay[today]?.summary).toContain("Completed");
  });

  it("repairs corrupted state safely", () => {
    const repaired = repairGameState("{bad-json", context);
    expect(repaired.diagnostics.repaired).toBe(true);
    expect(repaired.state.version).toBe(1);
  });
});

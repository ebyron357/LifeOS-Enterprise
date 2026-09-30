import { describe, expect, it } from "vitest";
import {
  buildCanonicalSideQuests,
  createInitialGameState,
  describeRewards,
  levelForXp,
  missingSideQuestCategories,
  reduceGameState,
  repairGameState,
} from "@/lib/game/state";
import type { GameAction, GameContext, GameState, QuestVerification } from "@/lib/game/types";
import type { AreaBrief } from "@/lib/lifeos/types";

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

const richContext: GameContext = {
  nowIso: "2026-09-03T12:00:00.000Z",
  projects: [
    ...context.projects,
    {
      name: "Second Active",
      path: "10 Projects/Second Active.md",
      status: "active",
      priority: "P2",
      business: "LifeOS",
      nextAction: "Ship the second slice.",
      reviewDate: "2026-09-04",
      waitingOn: "",
      blocker: "",
    },
    {
      name: "Waiting Vendor",
      path: "10 Projects/Waiting Vendor.md",
      status: "waiting",
      priority: "P2",
      business: "LifeOS",
      nextAction: "Follow up with vendor.",
      reviewDate: "2026-09-05",
      waitingOn: "Vendor contract",
      blocker: "",
    },
  ],
  areas: [
    area("Physical Health and Mobility", ["health", "mobility"], "", "Protect mobility and reduce flare-ups."),
    area("Learning and Knowledge", ["area", "learning"], "Every learning source needs a purpose."),
    area("Personal Growth", ["area", "personal-growth"], "Make steady progress without overload"),
    area("Community Service", ["community"], "Serve one neighbor each week."),
    area("AI Consulting Career", ["ai-consulting", "career"], "Build verified consulting credibility."),
  ],
  businesses: [
    { name: "TradeIQ", path: "Businesses/TradeIQ.md", status: "active" },
    { name: "ClientVerse", path: "Businesses/ClientVerse.md", status: "active", kpiFocus: "Client delivery systems" },
  ],
  people: [{ name: "Ada", path: "50 People/Ada.md", organization: "LifeOS", role: "" }],
};

function attest(questId: string): QuestVerification {
  return { kind: "owner-attested", attestationId: `attest-${questId}`, confirmed: true };
}

describe("game state engine", () => {
  it("creates deterministic quests and level progression", () => {
    const initial = createInitialGameState(context);
    const today = context.nowIso.slice(0, 10);
    expect(initial.questsByDate[today].length).toBeGreaterThan(0);

    const main = initial.questsByDate[today].find((quest) => quest.kind === "main");
    expect(main).toBeTruthy();
    const afterQuest = reduceGameState(
      initial,
      { type: "complete-quest", questId: main!.id, verification: attest(main!.id) },
      context,
    );
    expect(afterQuest.stats.xp).toBe(main!.xp);
    expect(afterQuest.stats.level).toBe(1);
  });

  it("rejects unverified quest completions without awarding XP", () => {
    const initial = createInitialGameState(context);
    const today = context.nowIso.slice(0, 10);
    const quest = initial.questsByDate[today][0];
    const rejected = reduceGameState(
      initial,
      // @ts-expect-error intentional missing verification
      { type: "complete-quest", questId: quest.id },
      context,
    );
    expect(rejected.stats.xp).toBe(0);
    expect(rejected.lastError).toMatch(/attestation/i);
  });

  it("does not grant duplicate quest XP", () => {
    const initial = createInitialGameState(context);
    const today = context.nowIso.slice(0, 10);
    const quest = initial.questsByDate[today][1];
    const first = reduceGameState(
      initial,
      { type: "complete-quest", questId: quest.id, verification: attest(quest.id) },
      context,
    );
    const second = reduceGameState(
      first,
      { type: "complete-quest", questId: quest.id, verification: attest(`${quest.id}-retry`) },
      context,
    );
    expect(second.stats.xp).toBe(first.stats.xp);
    expect(second.lastError).toMatch(/already completed/i);
  });

  it("supports check-in streak and humane recovery", () => {
    const firstDay = createInitialGameState({ ...context, nowIso: "2026-09-01T12:00:00.000Z" });
    const checkedIn = reduceGameState(firstDay, { type: "daily-check-in" }, { ...context, nowIso: "2026-09-01T12:00:00.000Z" });
    const gapDay = reduceGameState(checkedIn, { type: "daily-check-in" }, { ...context, nowIso: "2026-09-03T12:00:00.000Z" });
    expect(gapDay.streakRecovery.missedDate).toBe("2026-09-02");
    expect(gapDay.streakRecovery.streakBeforeGap).toBe(1);
    expect(gapDay.stats.currentStreak).toBe(1);

    const recovered = reduceGameState(gapDay, { type: "recover-streak" }, { ...context, nowIso: "2026-09-03T12:10:00.000Z" });
    // 1 (before the gap) + the recovered missed day + today.
    expect(recovered.stats.currentStreak).toBe(3);
    expect(recovered.streakRecovery.used).toBe(true);
  });

  it("restores the pre-gap streak after one missed day instead of restarting at two", () => {
    let state = createInitialGameState({ ...context, nowIso: "2026-09-01T12:00:00.000Z" });
    for (const day of ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04"]) {
      state = reduceGameState(state, { type: "daily-check-in" }, { ...context, nowIso: `${day}T12:00:00.000Z` });
    }
    expect(state.stats.currentStreak).toBe(4);

    // 2026-09-05 is missed.
    const afterGap = reduceGameState(state, { type: "daily-check-in" }, { ...context, nowIso: "2026-09-06T08:00:00.000Z" });
    expect(afterGap.stats.currentStreak).toBe(1);
    expect(afterGap.streakRecovery).toEqual({
      missedDate: "2026-09-05",
      availableUntil: "2026-09-06",
      used: false,
      streakBeforeGap: 4,
    });

    const xpBefore = afterGap.stats.xp;
    const recovered = reduceGameState(afterGap, { type: "recover-streak" }, { ...context, nowIso: "2026-09-06T09:00:00.000Z" });
    expect(recovered.stats.currentStreak).toBe(6);
    expect(recovered.stats.longestStreak).toBe(6);
    // Recovery XP only: Momentum (streak 3) was already unlocked before the gap.
    expect(recovered.stats.xp).toBe(xpBefore + 10);
    expect(recovered.achievements.filter((item) => item.id === "streak-3")).toHaveLength(1);
  });

  it("keeps legacy recovery (+1) when stored state predates streakBeforeGap", () => {
    const base = createInitialGameState({ ...context, nowIso: "2026-09-03T12:00:00.000Z" });
    const legacy = JSON.parse(JSON.stringify({
      ...base,
      stats: { ...base.stats, currentStreak: 1, longestStreak: 5, lastCheckInDate: "2026-09-03" },
      streakRecovery: { missedDate: "2026-09-02", availableUntil: "2026-09-03", used: false },
    })) as Record<string, unknown>;
    const parsed = repairGameState(JSON.stringify(legacy), { ...context, nowIso: "2026-09-03T12:00:00.000Z" });
    expect(parsed.state.streakRecovery.streakBeforeGap).toBeNull();
    const recovered = reduceGameState(parsed.state, { type: "recover-streak" }, { ...context, nowIso: "2026-09-03T13:00:00.000Z" });
    expect(recovered.stats.currentStreak).toBe(2);
  });

  it("records end-of-day results deterministically", () => {
    const initial = createInitialGameState(context);
    const today = context.nowIso.slice(0, 10);
    const completed = reduceGameState(
      initial,
      { type: "complete-quest", questId: initial.questsByDate[today][0].id, verification: attest("eod") },
      context,
    );
    const ended = reduceGameState(completed, { type: "end-day" }, context);
    expect(ended.endOfDay[today]?.summary).toContain("Completed");
  });

  it("repairs corrupted state safely", () => {
    const repaired = repairGameState("{bad-json", context);
    expect(repaired.diagnostics.repaired).toBe(true);
    expect(repaired.state.version).toBe(1);
  });

  it("updates player profile without inventing XP", () => {
    const initial = createInitialGameState(context);
    const next = reduceGameState(initial, { type: "set-profile", ownerAlias: "Byron", avatar: "🚀" }, context);
    expect(next.profile.ownerAlias).toBe("Byron");
    expect(next.profile.avatar).toBe("🚀");
    expect(next.stats.xp).toBe(0);
  });

  it("rejects a boss battle claim until every step is done", () => {
    const initial = createInitialGameState(context);
    const today = context.nowIso.slice(0, 10);
    const boss = initial.questsByDate[today].find((quest) => quest.kind === "boss")!;

    const early = reduceGameState(initial, { type: "complete-quest", questId: boss.id, verification: attest(boss.id) }, context);
    expect(early.lastError).toBe("Finish every boss step before claiming the battle.");
    expect(early.stats.xp).toBe(0);
    expect(early.stats.completedBossBattles).toBe(0);
    expect(early.questsByDate[today].find((quest) => quest.id === boss.id)?.status).toBe("todo");

    let stepped = early;
    for (const step of boss.steps!.slice(0, -1)) {
      stepped = reduceGameState(stepped, { type: "complete-step", questId: boss.id, stepId: step.id }, context);
    }
    const partial = reduceGameState(stepped, { type: "complete-quest", questId: boss.id, verification: attest(`${boss.id}-2`) }, context);
    expect(partial.lastError).toBe("Finish every boss step before claiming the battle.");
    expect(partial.stats.xp).toBe(0);

    const allSteps = reduceGameState(partial, { type: "complete-step", questId: boss.id, stepId: boss.steps!.at(-1)!.id }, context);
    const won = reduceGameState(allSteps, { type: "complete-quest", questId: boss.id, verification: attest(`${boss.id}-3`) }, context);
    expect(won.lastError).toBeNull();
    expect(won.stats.completedBossBattles).toBe(1);
    expect(won.stats.xp).toBe(boss.xp + 15); // boss XP + Blocker Breaker achievement
    expect(won.achievements.map((item) => item.id)).toContain("boss-1");
  });

  it("breaks boss battles into smaller actions without awarding step XP", () => {
    const initial = createInitialGameState(context);
    const today = context.nowIso.slice(0, 10);
    const boss = initial.questsByDate[today].find((quest) => quest.kind === "boss");
    expect(boss?.steps?.length).toBeGreaterThanOrEqual(3);
    const stepped = reduceGameState(initial, { type: "complete-step", questId: boss!.id, stepId: boss!.steps![0].id }, context);
    expect(stepped.stats.xp).toBe(0);
    expect(stepped.questsByDate[today].find((quest) => quest.id === boss!.id)?.steps?.[0].status).toBe("done");
  });

  it("does not award check-in XP twice from the button and the daily quest", () => {
    const initial = createInitialGameState(context);
    const today = context.nowIso.slice(0, 10);
    const checked = reduceGameState(initial, { type: "daily-check-in" }, context);
    const expected = 20 + 15; // check-in XP plus first-check-in achievement
    expect(checked.stats.xp).toBe(expected);
    const again = reduceGameState(
      checked,
      { type: "complete-quest", questId: `daily-checkin-${today}`, verification: attest("checkin") },
      context,
    );
    expect(again.stats.xp).toBe(expected);
  });

  it("counts daily check-in XP once in the end-of-day report", () => {
    const initial = createInitialGameState(context);
    const today = context.nowIso.slice(0, 10);
    const checked = reduceGameState(initial, { type: "daily-check-in" }, context);
    const checkInQuest = checked.questsByDate[today].find((quest) => quest.id === `daily-checkin-${today}`);
    expect(checkInQuest?.status).toBe("done");
    const ended = reduceGameState(checked, { type: "end-day" }, context);
    expect(ended.endOfDay[today]?.xpEarned).toBe(checkInQuest?.xp);
    expect(ended.endOfDay[today]?.completedQuestIds).toContain(`daily-checkin-${today}`);
  });

  it("binds the daily check-in quest to the top priority next action", () => {
    const initial = createInitialGameState(context);
    const today = context.nowIso.slice(0, 10);
    const checkin = initial.questsByDate[today].find((quest) => quest.id === `daily-checkin-${today}`);
    expect(checkin?.detail).toContain("Validate voice fallback.");
    expect(checkin?.detail).toContain("Ship Voice");
    expect(checkin?.sourceProjectPath).toBe("Projects/Ship Voice.md");
  });

  it("computes level math at the boundaries", () => {
    expect(levelForXp(0)).toEqual({ xp: 0, level: 1, xpIntoLevel: 0, xpToNextLevel: 250 });
    expect(levelForXp(249)).toEqual({ xp: 249, level: 1, xpIntoLevel: 249, xpToNextLevel: 1 });
    expect(levelForXp(250)).toEqual({ xp: 250, level: 2, xpIntoLevel: 0, xpToNextLevel: 250 });
    expect(levelForXp(499)).toEqual({ xp: 499, level: 2, xpIntoLevel: 249, xpToNextLevel: 1 });
    expect(levelForXp(500)).toEqual({ xp: 500, level: 3, xpIntoLevel: 0, xpToNextLevel: 250 });
    expect(levelForXp(1000)).toEqual({ xp: 1000, level: 5, xpIntoLevel: 0, xpToNextLevel: 250 });
    expect(levelForXp(-20).level).toBe(1);
  });

  it("is deterministic: the same state, action, and context produce deep-equal results", () => {
    const initialA = createInitialGameState(richContext);
    const initialB = createInitialGameState(richContext);
    expect(initialA).toEqual(initialB);

    const today = richContext.nowIso.slice(0, 10);
    const quest = initialA.questsByDate[today].find((item) => item.kind === "main")!;
    const actions: GameAction[] = [
      { type: "daily-check-in" },
      { type: "complete-quest", questId: quest.id, verification: attest(quest.id) },
      { type: "end-day" },
    ];
    const run = (start: GameState) => actions.reduce((state, action) => reduceGameState(state, action, richContext), start);
    const first = run(initialA);
    const second = run(initialB);
    expect(first).toEqual(second);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    // Inputs are not mutated.
    expect(initialA).toEqual(createInitialGameState(richContext));
  });

  it("unlocks achievements exactly once", () => {
    const today = richContext.nowIso.slice(0, 10);
    let state = createInitialGameState(richContext);
    const completable = state.questsByDate[today].filter((quest) => quest.kind === "main" || quest.kind === "side");
    expect(completable.length).toBeGreaterThanOrEqual(6);

    for (const quest of completable.slice(0, 4)) {
      state = reduceGameState(state, { type: "complete-quest", questId: quest.id, verification: attest(quest.id) }, richContext);
    }
    expect(state.achievements.some((item) => item.id === "quests-5")).toBe(false);

    const beforeFifth = state;
    state = reduceGameState(state, { type: "complete-quest", questId: completable[4].id, verification: attest(completable[4].id) }, richContext);
    expect(state.stats.completedQuests).toBe(5);
    expect(state.achievements.filter((item) => item.id === "quests-5")).toHaveLength(1);
    expect(state.stats.xp - beforeFifth.stats.xp).toBe(completable[4].xp + 15);
    expect(describeRewards(beforeFifth, state, richContext.nowIso)).toContain("Achievement unlocked: Operator ⚙️");

    const beforeSixth = state;
    state = reduceGameState(state, { type: "complete-quest", questId: completable[5].id, verification: attest(completable[5].id) }, richContext);
    expect(state.stats.completedQuests).toBe(6);
    expect(state.achievements.filter((item) => item.id === "quests-5")).toHaveLength(1);
    expect(state.badges.filter((badge) => badge === "⚙️")).toHaveLength(1);
    expect(state.stats.xp - beforeSixth.stats.xp).toBe(completable[5].xp);
    expect(describeRewards(beforeSixth, state, richContext.nowIso).some((line) => line.startsWith("Achievement"))).toBe(false);

    // Re-parsing stored state never re-awards an unlocked achievement.
    const reparsed = repairGameState(JSON.stringify(state), richContext).state;
    expect(reparsed.stats.xp).toBe(state.stats.xp);
    expect(reparsed.achievements.map((item) => [item.id, item.unlockedAt])).toEqual(state.achievements.map((item) => [item.id, item.unlockedAt]));
  });

  it("keeps the daily check-in idempotent", () => {
    const today = context.nowIso.slice(0, 10);
    const once = reduceGameState(createInitialGameState(context), { type: "daily-check-in" }, context);
    const twice = reduceGameState(once, { type: "daily-check-in" }, context);
    const later = reduceGameState(twice, { type: "daily-check-in" }, { ...context, nowIso: `${today}T23:59:00.000Z` });
    for (const state of [twice, later]) {
      expect(state.stats.xp).toBe(once.stats.xp);
      expect(state.stats.currentStreak).toBe(1);
      expect(state.stats.completedQuests).toBe(once.stats.completedQuests);
      expect(state.achievements).toEqual(once.achievements);
      expect(state.lastError).toBe("Daily check-in already recorded for today.");
    }
    expect(describeRewards(once, twice, context.nowIso)).toEqual([]);
  });

  it("derives side quests only from canonical area, business, and people records", () => {
    const today = richContext.nowIso.slice(0, 10);
    const sides = buildCanonicalSideQuests(richContext);
    expect(sides.map((quest) => quest.category)).toEqual(["health", "learning", "money", "relationships", "service", "personal-growth"]);
    expect(sides.every((quest) => quest.kind === "side" && quest.xp === 25 && quest.status === "todo")).toBe(true);
    expect(sides.find((quest) => quest.category === "health")).toEqual({
      id: "side-health-20-areas-physical-health-and-mobility-md",
      kind: "side",
      category: "health",
      title: "Health: one small action",
      detail: "Protect mobility and reduce flare-ups.",
      xp: 25,
      status: "todo",
      sourceProjectPath: "20 Areas/Physical Health and Mobility.md",
    });
    expect(sides.find((quest) => quest.category === "learning")?.detail).toBe("Every learning source needs a purpose.");
    expect(sides.find((quest) => quest.category === "money")?.sourceProjectPath).toBe("Businesses/ClientVerse.md");
    expect(sides.find((quest) => quest.category === "money")?.detail).toBe("ClientVerse: Client delivery systems");
    expect(sides.find((quest) => quest.category === "relationships")?.sourceProjectPath).toBe("50 People/Ada.md");
    expect(sides.find((quest) => quest.category === "service")?.sourceProjectPath).toBe("20 Areas/Community Service.md");
    expect(missingSideQuestCategories(richContext)).toEqual([]);

    const state = createInitialGameState(richContext);
    const quests = state.questsByDate[today];
    expect(quests.length).toBeLessThanOrEqual(12);
    // Existing waiting-project side quest is preserved alongside the canonical ones.
    expect(quests.some((quest) => quest.title === "Unblock waiting work: Waiting Vendor")).toBe(true);
    expect(quests.filter((quest) => quest.category).map((quest) => quest.category)).toEqual(sides.map((quest) => quest.category));
    expect(quests.some((quest) => quest.kind === "boss")).toBe(true);

    // Categories survive a storage round-trip.
    const reparsed = repairGameState(JSON.stringify(state), richContext).state;
    expect(reparsed.questsByDate[today]).toEqual(quests);
  });

  it("falls back to money from a career area and skips categories without a canonical record", () => {
    const careerOnly: GameContext = {
      ...context,
      areas: [area("AI Consulting Career", ["area", "ai-consulting", "career"], "Build verified consulting credibility.")],
    };
    const sides = buildCanonicalSideQuests(careerOnly);
    expect(sides.map((quest) => quest.category)).toEqual(["money"]);
    expect(sides[0].sourceProjectPath).toBe("20 Areas/AI Consulting Career.md");
    expect(missingSideQuestCategories(careerOnly)).toEqual(["health", "learning", "relationships", "service", "personal-growth"]);
  });

  it("generates no life-category side quests when the vault has no canonical sources", () => {
    const today = context.nowIso.slice(0, 10);
    expect(buildCanonicalSideQuests(context)).toEqual([]);
    expect(buildCanonicalSideQuests({ ...context, areas: [], businesses: [], people: [] })).toEqual([]);
    const inactive: GameContext = {
      ...context,
      areas: [{ ...area("Old Health", ["health"], "Retired."), status: "archived" }],
      businesses: [{ name: "Closed Co", path: "Businesses/Closed Co.md", status: "archived" }],
    };
    expect(buildCanonicalSideQuests(inactive)).toEqual([]);
    expect(missingSideQuestCategories(context)).toHaveLength(6);
    expect(createInitialGameState(context).questsByDate[today].some((quest) => quest.category)).toBe(false);
  });

  it("records a full end-of-day results panel", () => {
    const today = context.nowIso.slice(0, 10);
    const initial = createInitialGameState(context);
    const main = initial.questsByDate[today].find((quest) => quest.kind === "main")!;
    const checked = reduceGameState(initial, { type: "daily-check-in" }, context);
    const completed = reduceGameState(checked, { type: "complete-quest", questId: main.id, verification: attest(main.id) }, context);
    const ended = reduceGameState(completed, { type: "end-day" }, context);
    const result = ended.endOfDay[today];
    expect(result.completedQuests).toEqual([
      { id: `daily-checkin-${today}`, title: "Daily check-in", xp: 20 },
      { id: main.id, title: main.title, xp: 45 },
    ]);
    expect(result.xpEarned).toBe(65);
    expect(result.bonusXp).toBe(15);
    expect(result.totalXpEarned).toBe(80);
    expect(result.totalXpEarned).toBe(ended.stats.xp);
    expect(result.streakAfterReview).toBe(1);
    expect(result.levelAfterReview).toBe(1);
    expect(result.achievementsUnlocked).toEqual([{ id: "first-check-in", title: "System Online", badge: "🛰️" }]);

    // Stored results survive parsing; legacy results without the new fields still parse.
    expect(repairGameState(JSON.stringify(ended), context).state.endOfDay[today]).toEqual(result);
    const legacy = { ...ended, endOfDay: { [today]: { date: today, completedQuestIds: [main.id], xpEarned: 45, streakAfterReview: 1, summary: "Done." } } };
    expect(repairGameState(JSON.stringify(legacy), context).state.endOfDay[today]).toEqual({
      date: today,
      completedQuestIds: [main.id],
      xpEarned: 45,
      streakAfterReview: 1,
      summary: "Done.",
    });
  });

  it("describes rewards only for XP that was actually granted", () => {
    const today = context.nowIso.slice(0, 10);
    const base = createInitialGameState(context);
    const seeded: GameState = { ...base, stats: { ...base.stats, ...levelForXp(240) } };
    const main = seeded.questsByDate[today].find((quest) => quest.kind === "main")!;
    const next = reduceGameState(seeded, { type: "complete-quest", questId: main.id, verification: attest(main.id) }, context);
    expect(next.stats.level).toBe(2);
    expect(describeRewards(seeded, next, context.nowIso)).toEqual([
      "+45 XP — Quest complete: Advance Ship Voice",
      "Level up! You reached level 2",
    ]);

    const checked = reduceGameState(base, { type: "daily-check-in" }, context);
    expect(describeRewards(base, checked, context.nowIso)).toEqual([
      "+20 XP — Quest complete: Daily check-in",
      "Achievement unlocked: System Online 🛰️",
    ]);

    const unverified = { kind: "owner-attested", attestationId: "x", confirmed: false } as unknown as QuestVerification;
    const rejected = reduceGameState(base, { type: "complete-quest", questId: main.id, verification: unverified }, context);
    expect(rejected.stats.xp).toBe(0);
    expect(describeRewards(base, rejected, context.nowIso)).toEqual([]);
  });

  it("flags corrupt or unsupported stored state for backup before replacing it", () => {
    expect(repairGameState("{bad-json", context).diagnostics.discardedRaw).toBe(true);
    expect(repairGameState(JSON.stringify({ version: 99 }), context).diagnostics.discardedRaw).toBe(true);
    const healthy = JSON.stringify(createInitialGameState(context));
    expect(repairGameState(healthy, context).diagnostics).toEqual({ repaired: false, discardedRaw: false, messages: [] });
  });
});

function area(name: string, tags: string[], standard: string, purpose = ""): AreaBrief {
  return { name, path: `20 Areas/${name}.md`, status: "active", tags, standard, purpose, reviewDate: "2026-09-10" };
}

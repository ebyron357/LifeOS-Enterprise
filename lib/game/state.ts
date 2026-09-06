import type { ProjectBrief } from "@/lib/lifeos/types";
import type {
  Achievement,
  AchievementId,
  EndOfDayResult,
  GameAction,
  GameContext,
  GameDiagnostics,
  GameState,
  Quest,
} from "./types";

const MAX_EVENT_IDS = 400;
const XP_PER_LEVEL = 250;
const GAME_VERSION = 1 as const;

function isoDate(nowIso: string): string {
  return nowIso.slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const left = Date.parse(`${a}T00:00:00.000Z`);
  const right = Date.parse(`${b}T00:00:00.000Z`);
  return Math.floor((right - left) / 86_400_000);
}

function toLevel(xp: number) {
  const safeXp = Math.max(0, Math.floor(xp));
  const level = Math.floor(safeXp / XP_PER_LEVEL) + 1;
  const xpIntoLevel = safeXp % XP_PER_LEVEL;
  return {
    xp: safeXp,
    level,
    xpIntoLevel,
    xpToNextLevel: XP_PER_LEVEL - xpIntoLevel,
  };
}

function canonicalPriority(priority: string): number {
  if (priority === "P0") return 0;
  if (priority === "P1") return 1;
  if (priority === "P2") return 2;
  return 3;
}

function sortProjects(projects: ProjectBrief[]): ProjectBrief[] {
  return [...projects].sort((a, b) => (
    canonicalPriority(a.priority) - canonicalPriority(b.priority)
    || a.name.localeCompare(b.name)
  ));
}

function normalizeQuestId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function breakBlockerIntoSteps(project: ProjectBrief): NonNullable<Quest["steps"]> {
  const blocker = project.blocker?.trim() || "Unnamed blocker";
  const nextMove = project.nextAction?.trim() || "Take one concrete next move that does not invent progress.";
  return [
    {
      id: "name-blocker",
      title: "Name the real blocker",
      detail: blocker,
      status: "todo",
    },
    {
      id: "smallest-move",
      title: "Smallest verified next move",
      detail: nextMove,
      status: "todo",
    },
    {
      id: "confirm-path",
      title: "Confirm the path is unblocked",
      detail: `Verify ${project.name} can proceed after the move. Do not mark this done without evidence.`,
      status: "todo",
    },
  ];
}

function buildDailyQuests(date: string, projects: ProjectBrief[]): Quest[] {
  const ranked = sortProjects(projects);
  const active = ranked.filter((project) => project.status === "active").slice(0, 2);
  const waiting = ranked.filter((project) => project.status === "waiting" || Boolean(project.waitingOn)).slice(0, 1);
  const blocked = ranked.filter((project) => project.status === "blocked" || Boolean(project.blocker)).slice(0, 2);

  const topAttention = ranked[0] ?? null;
  const quests: Quest[] = [
    {
      id: `daily-checkin-${date}`,
      kind: "daily",
      title: "Daily check-in",
      detail: topAttention?.nextAction
        ? `Confirm today's attention target: ${topAttention.name} — ${topAttention.nextAction}`
        : "Start the day by confirming your top attention target.",
      xp: 20,
      status: "todo",
      sourceProjectPath: topAttention?.path ?? null,
    },
    ...active.map((project, index) => ({
      id: `main-${index + 1}-${normalizeQuestId(project.path)}`,
      kind: "main" as const,
      title: `Advance ${project.name}`,
      detail: project.nextAction || "Complete one explicit next action.",
      xp: 45,
      status: "todo" as const,
      sourceProjectPath: project.path,
    })),
    ...waiting.map((project, index) => ({
      id: `side-${index + 1}-${normalizeQuestId(project.path)}`,
      kind: "side" as const,
      title: `Unblock waiting work: ${project.name}`,
      detail: project.waitingOn || project.nextAction || "Clear the waiting dependency.",
      xp: 30,
      status: "todo" as const,
      sourceProjectPath: project.path,
    })),
    ...blocked.map((project, index) => ({
      id: `boss-${index + 1}-${normalizeQuestId(project.path)}`,
      kind: "boss" as const,
      title: `Boss battle: ${project.name}`,
      detail: `Break the blocker into smaller actions. Do not invent completion.`,
      xp: 90,
      status: "todo" as const,
      sourceProjectPath: project.path,
      steps: breakBlockerIntoSteps(project),
    })),
  ];

  return quests.slice(0, 8);
}

export function createInitialGameState(context: GameContext): GameState {
  const date = isoDate(context.nowIso);
  return {
    version: GAME_VERSION,
    profile: {
      ownerAlias: "Owner",
      avatar: "🧠",
    },
    stats: {
      ...toLevel(0),
      completedQuests: 0,
      completedBossBattles: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastCheckInDate: null,
    },
    questsByDate: { [date]: buildDailyQuests(date, context.projects) },
    grantedEventIds: [],
    achievements: [],
    badges: [],
    streakRecovery: {
      missedDate: null,
      availableUntil: null,
      used: false,
    },
    endOfDay: {},
    lastError: null,
  };
}

function uniqueRecent(values: string[]): string[] {
  return [...new Set(values)].slice(-MAX_EVENT_IDS);
}

function ensureTodayQuests(state: GameState, context: GameContext): GameState {
  const date = isoDate(context.nowIso);
  if (state.questsByDate[date]) return state;
  return {
    ...state,
    questsByDate: {
      ...state.questsByDate,
      [date]: buildDailyQuests(date, context.projects),
    },
  };
}

function addXp(
  state: GameState,
  eventId: string,
  xp: number,
): { state: GameState; granted: boolean } {
  if (state.grantedEventIds.includes(eventId)) return { state, granted: false };
  const leveled = toLevel(state.stats.xp + xp);
  return {
    granted: true,
    state: {
      ...state,
      stats: {
        ...state.stats,
        ...leveled,
      },
      grantedEventIds: uniqueRecent([...state.grantedEventIds, eventId]),
      lastError: null,
    },
  };
}

const ACHIEVEMENTS: Record<AchievementId, { title: string; description: string; badge: string }> = {
  "first-check-in": { title: "System Online", description: "Completed your first daily check-in.", badge: "🛰️" },
  "streak-3": { title: "Momentum", description: "Reached a 3-day streak.", badge: "🔥" },
  "streak-7": { title: "Consistency Engine", description: "Reached a 7-day streak.", badge: "🏁" },
  "quests-5": { title: "Operator", description: "Completed 5 quests.", badge: "⚙️" },
  "quests-15": { title: "Closer", description: "Completed 15 quests.", badge: "🏆" },
  "boss-1": { title: "Blocker Breaker", description: "Won the first boss battle.", badge: "🛡️" },
  "level-5": { title: "Level Five", description: "Reached level 5.", badge: "⭐" },
};

function unlockAchievement(state: GameState, id: AchievementId, nowIso: string): GameState {
  if (state.achievements.some((item) => item.id === id)) return state;
  const base: Achievement = { id, ...ACHIEVEMENTS[id], unlockedAt: nowIso };
  const withAchievement = {
    ...state,
    achievements: [...state.achievements, base],
    badges: [...state.badges, ACHIEVEMENTS[id].badge],
  };
  const reward = addXp(withAchievement, `achievement:${id}`, 15);
  return reward.state;
}

function refreshAchievements(state: GameState, nowIso: string): GameState {
  let next = state;
  if (state.stats.lastCheckInDate) next = unlockAchievement(next, "first-check-in", nowIso);
  if (next.stats.currentStreak >= 3) next = unlockAchievement(next, "streak-3", nowIso);
  if (next.stats.currentStreak >= 7) next = unlockAchievement(next, "streak-7", nowIso);
  if (next.stats.completedQuests >= 5) next = unlockAchievement(next, "quests-5", nowIso);
  if (next.stats.completedQuests >= 15) next = unlockAchievement(next, "quests-15", nowIso);
  if (next.stats.completedBossBattles >= 1) next = unlockAchievement(next, "boss-1", nowIso);
  if (next.stats.level >= 5) next = unlockAchievement(next, "level-5", nowIso);
  return next;
}

function completeQuest(
  state: GameState,
  context: GameContext,
  questId: string,
  verification: { kind: "owner-attested"; attestationId: string; confirmed: true } | undefined,
): GameState {
  const date = isoDate(context.nowIso);
  const quests = state.questsByDate[date] ?? [];
  const quest = quests.find((item) => item.id === questId);
  if (!quest) {
    return { ...state, lastError: "Quest was not found for today." };
  }
  if (quest.status === "done") {
    return { ...state, lastError: "Quest was already completed. XP not granted twice." };
  }
  if (!verification || verification.kind !== "owner-attested" || verification.confirmed !== true) {
    return {
      ...state,
      lastError: "Quest completion requires an explicit owner attestation. XP was not granted.",
    };
  }
  if (!verification.attestationId.trim()) {
    return { ...state, lastError: "Quest attestation id is required. XP was not granted." };
  }

  if (quest.id === `daily-checkin-${date}`) {
    return runCheckIn(state, context);
  }

  const eventId = `quest:${date}:${quest.id}`;
  const granted = addXp(state, eventId, quest.xp);
  const completedQuests = quests.map((item) => (
    item.id === quest.id
      ? {
          ...item,
          status: "done" as const,
          steps: item.steps?.map((step) => ({ ...step, status: "done" as const })),
        }
      : item
  ));

  const next: GameState = {
    ...granted.state,
    questsByDate: {
      ...granted.state.questsByDate,
      [date]: completedQuests,
    },
    stats: {
      ...granted.state.stats,
      completedQuests: granted.granted ? granted.state.stats.completedQuests + 1 : granted.state.stats.completedQuests,
      completedBossBattles: granted.granted && quest.kind === "boss"
        ? granted.state.stats.completedBossBattles + 1
        : granted.state.stats.completedBossBattles,
    },
    lastError: null,
  };
  return refreshAchievements(next, context.nowIso);
}

function runCheckIn(state: GameState, context: GameContext): GameState {
  const date = isoDate(context.nowIso);
  const last = state.stats.lastCheckInDate;
  const eventId = `checkin:${date}`;
  const xpResult = addXp(state, eventId, 20);

  let streak = state.stats.currentStreak;
  let recovery = state.streakRecovery;
  if (!last) streak = 1;
  else {
    const gap = daysBetween(last, date);
    if (gap <= 0) streak = state.stats.currentStreak;
    else if (gap === 1) streak = state.stats.currentStreak + 1;
    else {
      streak = 1;
      recovery = {
        missedDate: gap === 2 ? dateFromOffset(date, -1) : null,
        availableUntil: gap === 2 ? date : null,
        used: false,
      };
    }
  }

  const next = {
    ...xpResult.state,
    stats: {
      ...xpResult.state.stats,
      currentStreak: streak,
      longestStreak: Math.max(streak, xpResult.state.stats.longestStreak),
      lastCheckInDate: date,
    },
    streakRecovery: recovery,
    lastError: xpResult.granted ? null : "Daily check-in already recorded for today.",
  };

  const todayQuests = next.questsByDate[date] ?? [];
  const marked = todayQuests.map((item) => (
    item.id === `daily-checkin-${date}` ? { ...item, status: "done" as const } : item
  ));
  const questWasOpen = todayQuests.some((item) => item.id === `daily-checkin-${date}` && item.status !== "done");
  return refreshAchievements({
    ...next,
    questsByDate: { ...next.questsByDate, [date]: marked },
    stats: {
      ...next.stats,
      completedQuests: questWasOpen && xpResult.granted ? next.stats.completedQuests + 1 : next.stats.completedQuests,
    },
  }, context.nowIso);
}

function completeStep(state: GameState, context: GameContext, questId: string, stepId: string): GameState {
  const date = isoDate(context.nowIso);
  const quests = state.questsByDate[date] ?? [];
  const quest = quests.find((item) => item.id === questId);
  if (!quest?.steps?.length) {
    return { ...state, lastError: "This quest has no smaller actions to mark." };
  }
  if (quest.status === "done") {
    return { ...state, lastError: "Boss battle already completed. XP was not granted again." };
  }
  const step = quest.steps.find((item) => item.id === stepId);
  if (!step) return { ...state, lastError: "Boss step was not found." };
  if (step.status === "done") return { ...state, lastError: "That step is already marked. No XP is awarded for steps." };

  const nextQuests = quests.map((item) => {
    if (item.id !== quest.id) return item;
    return {
      ...item,
      steps: item.steps?.map((entry) => (entry.id === stepId ? { ...entry, status: "done" as const } : entry)),
    };
  });
  return {
    ...state,
    questsByDate: { ...state.questsByDate, [date]: nextQuests },
    lastError: "Step recorded. Complete the attested boss battle to award XP.",
  };
}

function dateFromOffset(date: string, offsetDays: number): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + offsetDays);
  return value.toISOString().slice(0, 10);
}

function recoverStreak(state: GameState, context: GameContext): GameState {
  const date = isoDate(context.nowIso);
  const recovery = state.streakRecovery;
  if (!recovery.missedDate || !recovery.availableUntil || recovery.used) {
    return { ...state, lastError: "No streak recovery is currently available." };
  }
  if (date > recovery.availableUntil) {
    return {
      ...state,
      streakRecovery: { missedDate: null, availableUntil: null, used: false },
      lastError: "Streak recovery window expired.",
    };
  }

  const xp = addXp(state, `recovery:${recovery.missedDate}`, 10);
  const next: GameState = {
    ...xp.state,
    stats: {
      ...xp.state.stats,
      currentStreak: xp.state.stats.currentStreak + 1,
      longestStreak: Math.max(xp.state.stats.longestStreak, xp.state.stats.currentStreak + 1),
    },
    streakRecovery: {
      ...recovery,
      used: true,
    },
    lastError: null,
  };
  return refreshAchievements(next, context.nowIso);
}

function endDay(state: GameState, context: GameContext): GameState {
  const date = isoDate(context.nowIso);
  const quests = state.questsByDate[date] ?? [];
  const completed = quests.filter((item) => item.status === "done");
  const questXp = completed.reduce((sum, item) => sum + item.xp, 0);
  const checkInAlreadyInQuests = completed.some((item) => item.id === `daily-checkin-${date}`);
  const checkInOnly = !checkInAlreadyInQuests && state.grantedEventIds.includes(`checkin:${date}`);
  const xpEarned = questXp + (checkInOnly ? 20 : 0);
  const summary = completed.length
    ? `Completed ${completed.length} quests and earned ${xpEarned} XP today.`
    : "No quests were completed today. Keep momentum with one small action tomorrow.";
  const result: EndOfDayResult = {
    date,
    completedQuestIds: completed.map((item) => item.id),
    xpEarned,
    streakAfterReview: state.stats.currentStreak,
    summary,
  };
  return {
    ...state,
    endOfDay: {
      ...state.endOfDay,
      [date]: result,
    },
    lastError: null,
  };
}

export function reduceGameState(
  previous: GameState,
  action: GameAction,
  context: GameContext,
): GameState {
  const seeded = ensureTodayQuests(previous, context);
  if (action.type === "daily-check-in") return runCheckIn(seeded, context);
  if (action.type === "complete-quest") return completeQuest(seeded, context, action.questId, action.verification);
  if (action.type === "complete-step") return completeStep(seeded, context, action.questId, action.stepId);
  if (action.type === "recover-streak") return recoverStreak(seeded, context);
  if (action.type === "end-day") return endDay(seeded, context);
  if (action.type === "reset-state") return createInitialGameState(context);
  if (action.type === "repair-state") return repairGameState(JSON.stringify(seeded), context).state;
  if (action.type === "set-profile") {
    const ownerAlias = action.ownerAlias.trim().slice(0, 40) || seeded.profile.ownerAlias;
    const avatar = action.avatar.trim().slice(0, 8) || seeded.profile.avatar;
    return { ...seeded, profile: { ownerAlias, avatar }, lastError: null };
  }
  return seeded;
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

export function repairGameState(raw: string | null, context: GameContext): { state: GameState; diagnostics: GameDiagnostics } {
  const base = createInitialGameState(context);
  if (!raw) {
    return { state: base, diagnostics: { repaired: false, messages: [] } };
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed.version !== GAME_VERSION) {
      return {
        state: base,
        diagnostics: { repaired: true, messages: ["Unsupported game state version. Reset to defaults."] },
      };
    }

    const profile = asObject(parsed.profile);
    const stats = asObject(parsed.stats);
    const questsByDate = asObject(parsed.questsByDate);
    const achievements = Array.isArray(parsed.achievements) ? parsed.achievements : [];
    const endOfDay = asObject(parsed.endOfDay);
    const streakRecovery = asObject(parsed.streakRecovery);

    const repaired: string[] = [];

    const next: GameState = {
      ...base,
      profile: {
        ownerAlias: typeof profile?.ownerAlias === "string" ? profile.ownerAlias : base.profile.ownerAlias,
        avatar: typeof profile?.avatar === "string" ? profile.avatar : base.profile.avatar,
      },
      stats: {
        ...toLevel(typeof stats?.xp === "number" ? stats.xp : 0),
        completedQuests: typeof stats?.completedQuests === "number" ? Math.max(0, Math.floor(stats.completedQuests)) : 0,
        completedBossBattles: typeof stats?.completedBossBattles === "number" ? Math.max(0, Math.floor(stats.completedBossBattles)) : 0,
        currentStreak: typeof stats?.currentStreak === "number" ? Math.max(0, Math.floor(stats.currentStreak)) : 0,
        longestStreak: typeof stats?.longestStreak === "number" ? Math.max(0, Math.floor(stats.longestStreak)) : 0,
        lastCheckInDate: typeof stats?.lastCheckInDate === "string" ? stats.lastCheckInDate : null,
      },
      questsByDate: parseQuestState(questsByDate, context, repaired, base.questsByDate),
      grantedEventIds: Array.isArray(parsed.grantedEventIds)
        ? uniqueRecent(parsed.grantedEventIds.filter((item): item is string => typeof item === "string"))
        : [],
      achievements: achievements
        .map((entry) => asObject(entry))
        .filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry.id === "string" && typeof entry.title === "string" && typeof entry.description === "string" && typeof entry.unlockedAt === "string"))
        .map((entry) => ({
          id: entry.id as AchievementId,
          title: entry.title as string,
          description: entry.description as string,
          unlockedAt: entry.unlockedAt as string,
        })),
      badges: Array.isArray(parsed.badges) ? parsed.badges.filter((item): item is string => typeof item === "string") : [],
      streakRecovery: {
        missedDate: typeof streakRecovery?.missedDate === "string" ? streakRecovery.missedDate : null,
        availableUntil: typeof streakRecovery?.availableUntil === "string" ? streakRecovery.availableUntil : null,
        used: Boolean(streakRecovery?.used),
      },
      endOfDay: parseEndOfDay(endOfDay),
      lastError: typeof parsed.lastError === "string" ? parsed.lastError : null,
    };

    return {
      state: refreshAchievements(ensureTodayQuests(next, context), context.nowIso),
      diagnostics: {
        repaired: repaired.length > 0,
        messages: repaired,
      },
    };
  } catch {
    return {
      state: base,
      diagnostics: { repaired: true, messages: ["Corrupted game state JSON detected and repaired."] },
    };
  }
}

function parseQuestState(
  value: Record<string, unknown> | null,
  context: GameContext,
  repaired: string[],
  fallback: Record<string, Quest[]>,
): Record<string, Quest[]> {
  if (!value) return fallback;
  const entries = Object.entries(value).map(([date, raw]) => {
    if (!Array.isArray(raw)) {
      repaired.push(`Removed invalid quest list for ${date}.`);
      return [date, buildDailyQuests(date, context.projects)] as const;
    }
    const quests = raw
      .map((entry) => asObject(entry))
      .filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry.id === "string"))
      .map((entry) => {
        const steps = Array.isArray(entry.steps)
          ? entry.steps
            .map((step) => asObject(step))
            .filter((step): step is Record<string, unknown> => Boolean(step && typeof step.id === "string"))
            .map((step) => ({
              id: String(step.id),
              title: typeof step.title === "string" ? step.title : "Step",
              detail: typeof step.detail === "string" ? step.detail : "",
              status: step.status === "done" ? "done" as const : "todo" as const,
            }))
          : undefined;
        return {
          id: String(entry.id),
          kind: entry.kind === "main" || entry.kind === "side" || entry.kind === "boss" ? entry.kind : "daily",
          title: typeof entry.title === "string" ? entry.title : "Quest",
          detail: typeof entry.detail === "string" ? entry.detail : "",
          xp: typeof entry.xp === "number" ? Math.max(0, Math.floor(entry.xp)) : 0,
          status: entry.status === "done" ? "done" : "todo",
          sourceProjectPath: typeof entry.sourceProjectPath === "string" ? entry.sourceProjectPath : null,
          ...(steps?.length ? { steps } : {}),
        } satisfies Quest;
      });
    return [date, quests.length ? quests : buildDailyQuests(date, context.projects)] as const;
  });
  return Object.fromEntries(entries);
}

function parseEndOfDay(value: Record<string, unknown> | null): Record<string, EndOfDayResult> {
  if (!value) return {};
  const entries = Object.entries(value)
    .map(([date, entry]) => {
      const parsed = asObject(entry);
      if (!parsed) return null;
      return [date, {
        date,
        completedQuestIds: Array.isArray(parsed.completedQuestIds)
          ? parsed.completedQuestIds.filter((item): item is string => typeof item === "string")
          : [],
        xpEarned: typeof parsed.xpEarned === "number" ? Math.max(0, Math.floor(parsed.xpEarned)) : 0,
        streakAfterReview: typeof parsed.streakAfterReview === "number" ? Math.max(0, Math.floor(parsed.streakAfterReview)) : 0,
        summary: typeof parsed.summary === "string" ? parsed.summary : "",
      } satisfies EndOfDayResult] as const;
    })
    .filter((entry): entry is readonly [string, EndOfDayResult] => Boolean(entry));
  return Object.fromEntries(entries);
}

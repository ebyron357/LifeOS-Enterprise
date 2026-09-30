import type { AreaBrief, BusinessBrief, PersonBrief, ProjectBrief } from "@/lib/lifeos/types";

export type QuestKind = "daily" | "main" | "side" | "boss";

/** Life categories for canonical side quests. Each one needs a real vault record as its source. */
export type SideQuestCategory =
  | "health"
  | "learning"
  | "money"
  | "relationships"
  | "service"
  | "personal-growth";

export type QuestStatus = "todo" | "done";

export type QuestStep = {
  id: string;
  title: string;
  detail: string;
  status: QuestStatus;
};

export type Quest = {
  id: string;
  kind: QuestKind;
  title: string;
  detail: string;
  xp: number;
  status: QuestStatus;
  sourceProjectPath: string | null;
  /** Canonical side quests only: which life category the source vault record covers. */
  category?: SideQuestCategory;
  /** Boss battles only: smaller real actions. Completing steps does not award XP. */
  steps?: QuestStep[];
};

export type AchievementId =
  | "first-check-in"
  | "streak-3"
  | "streak-7"
  | "quests-5"
  | "quests-15"
  | "boss-1"
  | "level-5";

export type Achievement = {
  id: AchievementId;
  title: string;
  description: string;
  unlockedAt: string;
};

export type EndOfDayQuestResult = {
  id: string;
  title: string;
  xp: number;
};

export type EndOfDayAchievementResult = {
  id: AchievementId;
  title: string;
  badge: string;
};

export type EndOfDayResult = {
  date: string;
  completedQuestIds: string[];
  /** Quest XP earned today (check-in included once). Achievement/recovery bonuses are in bonusXp. */
  xpEarned: number;
  streakAfterReview: number;
  summary: string;
  /** Optional since v1 results recorded before the results panel existed. */
  completedQuests?: EndOfDayQuestResult[];
  bonusXp?: number;
  totalXpEarned?: number;
  levelAfterReview?: number;
  achievementsUnlocked?: EndOfDayAchievementResult[];
};

export type StreakRecovery = {
  missedDate: string | null;
  availableUntil: string | null;
  used: boolean;
  /** Streak recorded before the single missed day, so recovery can restore it. Null for legacy state. */
  streakBeforeGap: number | null;
};

export type GameProfile = {
  ownerAlias: string;
  avatar: string;
};

export type GameStats = {
  xp: number;
  level: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
  completedQuests: number;
  completedBossBattles: number;
  currentStreak: number;
  longestStreak: number;
  lastCheckInDate: string | null;
};

export type GameState = {
  version: 1;
  profile: GameProfile;
  stats: GameStats;
  questsByDate: Record<string, Quest[]>;
  grantedEventIds: string[];
  achievements: Achievement[];
  badges: string[];
  streakRecovery: StreakRecovery;
  endOfDay: Record<string, EndOfDayResult>;
  lastError: string | null;
};

export type GameDiagnostics = {
  repaired: boolean;
  messages: string[];
  /** True when stored data could not be used as-is (corrupt JSON, unsupported version, or dropped fields). */
  discardedRaw?: boolean;
};

export type QuestVerification = {
  kind: "owner-attested";
  /** Unique attestation id for this completion attempt. Replays with the same quest still award XP once. */
  attestationId: string;
  confirmed: true;
};

export type GameAction =
  | { type: "daily-check-in" }
  | { type: "complete-quest"; questId: string; verification: QuestVerification }
  | { type: "complete-step"; questId: string; stepId: string }
  | { type: "recover-streak" }
  | { type: "end-day" }
  | { type: "repair-state" }
  | { type: "reset-state" }
  | { type: "set-profile"; ownerAlias: string; avatar: string };

export type GameContext = {
  nowIso: string;
  projects: ProjectBrief[];
  /** Canonical vault records used for life-category side quests. Optional for backward compatibility. */
  areas?: AreaBrief[];
  businesses?: BusinessBrief[];
  people?: PersonBrief[];
};

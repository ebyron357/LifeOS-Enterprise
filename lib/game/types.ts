import type { ProjectBrief } from "@/lib/lifeos/types";

export type QuestKind = "daily" | "main" | "side" | "boss";

export type QuestStatus = "todo" | "done";

export type Quest = {
  id: string;
  kind: QuestKind;
  title: string;
  detail: string;
  xp: number;
  status: QuestStatus;
  sourceProjectPath: string | null;
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

export type EndOfDayResult = {
  date: string;
  completedQuestIds: string[];
  xpEarned: number;
  streakAfterReview: number;
  summary: string;
};

export type StreakRecovery = {
  missedDate: string | null;
  availableUntil: string | null;
  used: boolean;
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
};

export type GameAction =
  | { type: "daily-check-in" }
  | { type: "complete-quest"; questId: string }
  | { type: "recover-streak" }
  | { type: "end-day" }
  | { type: "repair-state" }
  | { type: "reset-state" };

export type GameContext = {
  nowIso: string;
  projects: ProjectBrief[];
};

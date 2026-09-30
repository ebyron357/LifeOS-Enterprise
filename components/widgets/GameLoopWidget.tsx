"use client";

import { useEffect, useMemo, useState } from "react";
import type { AreaBrief, BusinessBrief, PersonBrief, ProjectBrief } from "@/lib/lifeos/types";
import { safeWriteStorage, useBrowserStorageError, useBrowserStorageString } from "@/lib/lifeos/use-browser-storage";
import {
  ACHIEVEMENTS,
  bossStepsDone,
  createInitialGameState,
  describeRewards,
  GAME_STATE_BACKUP_KEY,
  GAME_STATE_STORAGE_KEY,
  missingSideQuestCategories,
  reduceGameState,
  repairGameState,
} from "@/lib/game/state";
import type {
  EndOfDayResult,
  GameAction,
  GameState,
  Quest,
  QuestVerification,
  SideQuestCategory,
} from "@/lib/game/types";
import { WidgetFrame } from "./WidgetFrame";

type GameLoopWidgetProps = {
  projects: ProjectBrief[];
  areas?: AreaBrief[];
  businesses?: BusinessBrief[];
  people?: PersonBrief[];
};

const AVATARS = ["🧠", "🛰️", "⚙️", "🛡️", "🚀", "🎯"];
const NO_AREAS: AreaBrief[] = [];
const NO_BUSINESSES: BusinessBrief[] = [];
const NO_PEOPLE: PersonBrief[] = [];

const CATEGORY_NOTE_LABEL: Record<SideQuestCategory, string> = {
  health: "health",
  learning: "learning",
  money: "money",
  relationships: "relationships",
  service: "service",
  "personal-growth": "personal growth",
};

const RESET_GAME_CONFIRMATION =
  `Reset the game? Level, XP, streaks, quests, and achievements in this browser go back to zero. The current state is saved to ${GAME_STATE_BACKUP_KEY} first. Your vault notes are not changed.`;

function ownerAttestation(questId: string): QuestVerification {
  return {
    kind: "owner-attested",
    attestationId: `attest-${questId}-${Date.now()}`,
    confirmed: true,
  };
}

function EndOfDayPanel({ end, quests, state }: { end: EndOfDayResult; quests: Quest[]; state: GameState }) {
  const completed = end.completedQuests ?? end.completedQuestIds.map((id) => {
    const quest = quests.find((item) => item.id === id);
    return { id, title: quest?.title ?? id, xp: quest?.xp ?? 0 };
  });
  const achievements = end.achievementsUnlocked ?? state.achievements
    .filter((item) => item.unlockedAt.slice(0, 10) === end.date)
    .map((item) => ({ id: item.id, title: item.title, badge: ACHIEVEMENTS[item.id]?.badge ?? "" }));
  const totalXp = end.totalXpEarned ?? end.xpEarned;
  const level = end.levelAfterReview ?? state.stats.level;

  return (
    <section className="game-loop-eod" aria-label="End-of-day results">
      <p className="widget-eyebrow">End-of-day result · {end.date}</p>
      <p>{end.summary}</p>
      {completed.length ? (
        <ul className="game-loop-eod-quests" aria-label="Quests completed today">
          {completed.map((quest) => (
            <li key={quest.id}>
              <span>{quest.title}</span>
              <strong>+{quest.xp} XP</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p>No quests completed today.</p>
      )}
      <dl className="game-loop-eod-stats">
        <div>
          <dt>Total XP earned today</dt>
          <dd>{totalXp} XP</dd>
        </div>
        <div>
          <dt>Current streak</dt>
          <dd>{end.streakAfterReview}</dd>
        </div>
        <div>
          <dt>Level</dt>
          <dd>{level}</dd>
        </div>
        <div>
          <dt>Achievements unlocked today</dt>
          <dd>{achievements.length ? achievements.map((item) => `${item.title} ${item.badge}`.trim()).join(", ") : "None"}</dd>
        </div>
      </dl>
    </section>
  );
}

export function GameLoopWidget({
  projects,
  areas = NO_AREAS,
  businesses = NO_BUSINESSES,
  people = NO_PEOPLE,
}: GameLoopWidgetProps) {
  const nowIso = new Date().toISOString();
  const context = useMemo(
    () => ({ nowIso, projects, areas, businesses, people }),
    [nowIso, projects, areas, businesses, people],
  );
  const [raw, setRaw, storageError] = useBrowserStorageString(GAME_STATE_STORAGE_KEY, "");
  const backupError = useBrowserStorageError(GAME_STATE_BACKUP_KEY);
  const repaired = useMemo(() => repairGameState(raw || null, context), [context, raw]);
  const [rewards, setRewards] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const state = repaired.state;
  const discardedRaw = Boolean(raw && repaired.diagnostics.discardedRaw);
  const today = nowIso.slice(0, 10);
  const todayQuests = state.questsByDate[today] ?? [];
  const doneToday = todayQuests.filter((quest) => quest.status === "done").length;
  const end = state.endOfDay[today] ?? null;
  const missingCategories = useMemo(() => missingSideQuestCategories(context), [context]);
  const progressPct = Math.min(
    100,
    Math.round((state.stats.xpIntoLevel / Math.max(1, state.stats.xpIntoLevel + state.stats.xpToNextLevel)) * 100),
  );

  useEffect(() => {
    // Keep unusable stored data before any later save replaces it; nothing is dropped silently.
    if (discardedRaw) safeWriteStorage(GAME_STATE_BACKUP_KEY, raw);
  }, [discardedRaw, raw]);

  function dispatch(action: GameAction) {
    const seeded = raw ? repaired.state : createInitialGameState(context);
    const next = reduceGameState(seeded, action, context);
    setRaw(JSON.stringify(next));
    if (action.type !== "set-profile") setRewards(describeRewards(seeded, next, context.nowIso));
  }

  function completeQuest(questId: string) {
    const confirmed = window.confirm(
      "Confirm you completed this quest using real LifeOS evidence (next action done, blocker cleared, or check-in finished). Invented completions are not allowed.",
    );
    if (!confirmed) return;
    dispatch({
      type: "complete-quest",
      questId,
      verification: ownerAttestation(questId),
    });
  }

  function resetGame() {
    if (!window.confirm(RESET_GAME_CONFIRMATION)) {
      setNotice("Reset cancelled. Nothing changed.");
      return;
    }
    if (raw) {
      const failed = safeWriteStorage(GAME_STATE_BACKUP_KEY, raw);
      if (failed) {
        setNotice(`Reset cancelled: the backup to ${GAME_STATE_BACKUP_KEY} could not be saved. ${failed}`);
        return;
      }
    }
    dispatch({ type: "reset-state" });
    setNotice(raw ? `Game reset. Previous state saved to ${GAME_STATE_BACKUP_KEY} in this browser.` : "Game reset.");
  }

  return (
    <WidgetFrame eyebrow="Deterministic progression" title="LifeOS Game Loop" action="Verified action only">
      <div className="game-loop-head">
        <strong>{state.profile.avatar} {state.profile.ownerAlias} · LV {state.stats.level}</strong>
        <span data-xp={state.stats.xp}>{state.stats.xp} XP total · {state.stats.xpToNextLevel} XP to next level</span>
      </div>
      <div
        className="game-loop-progress"
        role="progressbar"
        aria-label="XP progress to next level"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPct}
      >
        <div className="game-loop-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>
      <div className="game-loop-celebration" role="status" aria-live="polite">
        {rewards.map((message) => <p key={message}>{message}</p>)}
      </div>
      <div className="game-loop-profile" role="group" aria-label="Player profile">
        <label>
          Alias
          <input
            type="text"
            value={state.profile.ownerAlias}
            onChange={(event) => dispatch({ type: "set-profile", ownerAlias: event.target.value, avatar: state.profile.avatar })}
            aria-label="Player alias"
          />
        </label>
        <div className="game-loop-avatars" role="radiogroup" aria-label="Player avatar">
          {AVATARS.map((avatar) => (
            <button
              key={avatar}
              type="button"
              aria-pressed={state.profile.avatar === avatar}
              onClick={() => dispatch({ type: "set-profile", ownerAlias: state.profile.ownerAlias, avatar })}
            >
              {avatar}
            </button>
          ))}
        </div>
      </div>
      <div className="game-loop-grid">
        <div>
          <span>Current streak</span>
          <strong>{state.stats.currentStreak}</strong>
        </div>
        <div>
          <span>Longest streak</span>
          <strong>{state.stats.longestStreak}</strong>
        </div>
        <div>
          <span>Quests completed</span>
          <strong>{state.stats.completedQuests}</strong>
        </div>
        <div>
          <span>Boss battles won</span>
          <strong>{state.stats.completedBossBattles}</strong>
        </div>
      </div>
      <div className="game-loop-actions">
        <button type="button" onClick={() => dispatch({ type: "daily-check-in" })}>Daily check-in (+20 XP)</button>
        <button
          type="button"
          onClick={() => dispatch({ type: "recover-streak" })}
          disabled={!state.streakRecovery.missedDate || state.streakRecovery.used}
        >
          Recover streak (+10 XP)
        </button>
        <button type="button" onClick={() => dispatch({ type: "end-day" })}>End day results</button>
        <button type="button" onClick={() => dispatch({ type: "repair-state" })}>Repair state</button>
        <button type="button" onClick={resetGame}>Reset game</button>
      </div>
      {repaired.diagnostics.messages.length ? (
        <p role="alert" className="game-loop-diagnostic">
          {repaired.diagnostics.messages.join(" ")}
          {discardedRaw ? ` The original data was saved to ${GAME_STATE_BACKUP_KEY} in this browser.` : ""}
        </p>
      ) : null}
      {storageError ? <p role="alert" className="game-loop-diagnostic">{storageError}</p> : null}
      {backupError ? <p role="alert" className="game-loop-diagnostic">Backup to {GAME_STATE_BACKUP_KEY} failed: {backupError}</p> : null}
      {notice ? <p className="game-loop-diagnostic">{notice}</p> : null}
      {state.lastError ? <p role="alert" className="game-loop-diagnostic">{state.lastError}</p> : null}
      <div className="game-loop-quests">
        <p className="widget-eyebrow">Quests today · {doneToday}/{todayQuests.length}</p>
        <ul>
          {todayQuests.map((quest) => {
            const stepsDone = bossStepsDone(quest);
            const hintId = `${quest.id}-boss-hint`;
            return (
              <li
                key={quest.id}
                className="game-loop-quest"
                data-quest-category={quest.category}
                data-quest-kind={quest.kind}
                data-quest-xp={quest.xp}
              >
                <div>
                  <strong>{quest.title}</strong>
                  <small>{quest.kind.toUpperCase()} · {quest.xp} XP · {quest.detail}</small>
                </div>
                {quest.steps?.length ? (
                  <ol className="game-loop-steps">
                    {quest.steps.map((step) => (
                      <li key={step.id}>
                        <span>{step.title}: {step.detail}</span>
                        <button
                          type="button"
                          disabled={step.status === "done" || quest.status === "done"}
                          onClick={() => dispatch({ type: "complete-step", questId: quest.id, stepId: step.id })}
                        >
                          {step.status === "done" ? "Step done" : "Mark step"}
                        </button>
                      </li>
                    ))}
                  </ol>
                ) : null}
                {!stepsDone && quest.status !== "done" ? (
                  <small id={hintId} className="game-loop-hint">Finish every boss step to unlock the claim.</small>
                ) : null}
                <button
                  type="button"
                  disabled={quest.status === "done" || !stepsDone}
                  aria-describedby={!stepsDone && quest.status !== "done" ? hintId : undefined}
                  onClick={() => completeQuest(quest.id)}
                >
                  {quest.status === "done" ? "Completed" : "Complete (attest)"}
                </button>
              </li>
            );
          })}
        </ul>
        {missingCategories.length ? (
          <p className="game-loop-note">
            No canonical source for: {missingCategories.map((category) => CATEGORY_NOTE_LABEL[category]).join(", ")}.
            {" "}Add a vault note to unlock those side quests.
          </p>
        ) : null}
      </div>
      <div className="game-loop-achievements">
        <p className="widget-eyebrow">Achievements / rewards</p>
        <p>{state.badges.join(" ") || "No achievements unlocked yet."}</p>
        <ul>
          {state.achievements.map((item) => (
            <li key={item.id}>{item.title}: {item.description}</li>
          ))}
        </ul>
      </div>
      {end ? <EndOfDayPanel end={end} quests={todayQuests} state={state} /> : null}
    </WidgetFrame>
  );
}

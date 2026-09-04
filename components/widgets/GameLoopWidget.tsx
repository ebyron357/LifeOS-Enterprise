"use client";

import { useMemo } from "react";
import type { ProjectBrief } from "@/lib/lifeos/types";
import { useBrowserStorageString } from "@/lib/lifeos/use-browser-storage";
import { createInitialGameState, reduceGameState, repairGameState } from "@/lib/game/state";
import type { GameAction, QuestVerification } from "@/lib/game/types";
import { WidgetFrame } from "./WidgetFrame";

type GameLoopWidgetProps = {
  projects: ProjectBrief[];
};

const STORAGE_KEY = "lifeos-game-state-v1";
const AVATARS = ["🧠", "🛰️", "⚙️", "🛡️", "🚀", "🎯"];

function ownerAttestation(questId: string): QuestVerification {
  return {
    kind: "owner-attested",
    attestationId: `attest-${questId}-${Date.now()}`,
    confirmed: true,
  };
}

export function GameLoopWidget({ projects }: GameLoopWidgetProps) {
  const nowIso = new Date().toISOString();
  const context = useMemo(() => ({ nowIso, projects }), [nowIso, projects]);
  const [raw, setRaw] = useBrowserStorageString(STORAGE_KEY, "");
  const repaired = useMemo(() => repairGameState(raw || null, context), [context, raw]);
  const state = repaired.state;
  const today = nowIso.slice(0, 10);
  const todayQuests = state.questsByDate[today] ?? [];
  const doneToday = todayQuests.filter((quest) => quest.status === "done").length;
  const end = state.endOfDay[today] ?? null;
  const progressPct = Math.min(
    100,
    Math.round((state.stats.xpIntoLevel / Math.max(1, state.stats.xpIntoLevel + state.stats.xpToNextLevel)) * 100),
  );

  function dispatch(action: GameAction) {
    const seeded = raw ? repaired.state : createInitialGameState(context);
    const next = reduceGameState(seeded, action, context);
    setRaw(JSON.stringify(next));
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

  return (
    <WidgetFrame eyebrow="Deterministic progression" title="LifeOS Game Loop" action="Verified action only">
      <div className="game-loop-head">
        <strong>{state.profile.avatar} {state.profile.ownerAlias} · LV {state.stats.level}</strong>
        <span>{state.stats.xp} XP total · {state.stats.xpToNextLevel} XP to next level</span>
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
        <button type="button" onClick={() => dispatch({ type: "reset-state" })}>Reset game</button>
      </div>
      {repaired.diagnostics.messages.length ? (
        <p role="alert" className="game-loop-diagnostic">{repaired.diagnostics.messages.join(" ")}</p>
      ) : null}
      {state.lastError ? <p role="alert" className="game-loop-diagnostic">{state.lastError}</p> : null}
      <div className="game-loop-quests">
        <p className="widget-eyebrow">Quests today · {doneToday}/{todayQuests.length}</p>
        <ul>
          {todayQuests.map((quest) => (
            <li key={quest.id}>
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
              <button
                type="button"
                disabled={quest.status === "done"}
                onClick={() => completeQuest(quest.id)}
              >
                {quest.status === "done" ? "Completed" : "Complete (attest)"}
              </button>
            </li>
          ))}
        </ul>
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
      {end ? (
        <div className="game-loop-eod">
          <p className="widget-eyebrow">End-of-day result</p>
          <p>{end.summary}</p>
        </div>
      ) : null}
    </WidgetFrame>
  );
}

"use client";

import Link from "next/link";
import { useMemo } from "react";
import { GAME_STATE_STORAGE_KEY, levelForXp } from "@/lib/game/state";
import { useBrowserStorageString } from "@/lib/lifeos/use-browser-storage";

export type GameProgressSummary =
  | { kind: "empty" }
  | { kind: "unreadable" }
  | { kind: "progress"; level: number; xp: number; streak: number };

/** Reads game progress for display only. It never repairs, rewrites, or awards anything. */
export function summarizeGameProgress(raw: string): GameProgressSummary {
  if (!raw) return { kind: "empty" };
  try {
    const parsed = JSON.parse(raw) as { version?: unknown; stats?: Record<string, unknown> } | null;
    if (!parsed || typeof parsed !== "object" || parsed.version !== 1 || !parsed.stats || typeof parsed.stats !== "object") {
      return { kind: "unreadable" };
    }
    const xp = typeof parsed.stats.xp === "number" && Number.isFinite(parsed.stats.xp) ? Math.max(0, Math.floor(parsed.stats.xp)) : 0;
    const streak = typeof parsed.stats.currentStreak === "number" && Number.isFinite(parsed.stats.currentStreak)
      ? Math.max(0, Math.floor(parsed.stats.currentStreak))
      : 0;
    if (xp === 0 && !parsed.stats.lastCheckInDate) return { kind: "empty" };
    return { kind: "progress", level: levelForXp(xp).level, xp, streak };
  } catch {
    return { kind: "unreadable" };
  }
}

export function GameProgressCard() {
  // Read-only: the setter is intentionally not taken, so this card cannot change game state.
  const [raw] = useBrowserStorageString(GAME_STATE_STORAGE_KEY, "");
  const summary = useMemo(() => summarizeGameProgress(raw), [raw]);

  let line = "Start your first check-in";
  if (summary.kind === "unreadable") line = "Game progress needs repair. Open the game loop to repair it.";
  if (summary.kind === "progress") line = `Level ${summary.level} · ${summary.xp} XP · streak ${summary.streak}`;

  return (
    <section className="os-card game-progress-card" aria-labelledby="lifeos-game-card-title">
      <h2 id="lifeos-game-card-title">LifeOS Game</h2>
      <p>{line}</p>
      <Link className="os-primary" href="/dashboard">Open game loop</Link>
    </section>
  );
}

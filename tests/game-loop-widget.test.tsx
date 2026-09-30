import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameLoopWidget } from "@/components/widgets/GameLoopWidget";
import { GameProgressCard } from "@/components/widgets/GameProgressCard";
import {
  createInitialGameState,
  GAME_STATE_BACKUP_KEY,
  GAME_STATE_STORAGE_KEY,
  levelForXp,
} from "@/lib/game/state";
import type { GameState } from "@/lib/game/types";
import { STORAGE_WRITE_ERROR } from "@/lib/lifeos/use-browser-storage";
import type { AreaBrief, ProjectBrief } from "@/lib/lifeos/types";

const NOW = "2026-09-03T12:00:00.000Z";
const TODAY = NOW.slice(0, 10);

const projects: ProjectBrief[] = [
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
];

const areas: AreaBrief[] = [
  {
    name: "Physical Health and Mobility",
    path: "20 Areas/Physical Health and Mobility.md",
    status: "active",
    tags: ["health"],
    standard: "",
    purpose: "Protect mobility and reduce flare-ups.",
    reviewDate: "2026-09-10",
  },
];

function stored(): GameState {
  return JSON.parse(window.localStorage.getItem(GAME_STATE_STORAGE_KEY) ?? "null") as GameState;
}

function seed(state: GameState) {
  window.localStorage.setItem(GAME_STATE_STORAGE_KEY, JSON.stringify(state));
}

function questItem(container: HTMLElement, kind: string): HTMLElement {
  const item = container.querySelector<HTMLElement>(`.game-loop-quest[data-quest-kind="${kind}"]`);
  if (!item) throw new Error(`No ${kind} quest rendered`);
  return item;
}

describe("GameLoopWidget feedback and safety", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(NOW));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("announces the XP awarded for a completed quest", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const { container } = render(<GameLoopWidget projects={projects} />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toBeEmptyDOMElement();

    fireEvent.click(within(questItem(container, "main")).getByRole("button", { name: "Complete (attest)" }));
    expect(status).toHaveTextContent("+45 XP — Quest complete: Advance Ship Voice");
    expect(status).not.toHaveTextContent(/level up/i);
    expect(stored().stats.xp).toBe(45);
  });

  it("announces a level up when a quest crosses 250 XP", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const base = createInitialGameState({ nowIso: NOW, projects });
    seed({ ...base, stats: { ...base.stats, ...levelForXp(240) } });
    const { container } = render(<GameLoopWidget projects={projects} />);
    expect(screen.getByText(/240 XP total/)).toBeInTheDocument();

    fireEvent.click(within(questItem(container, "main")).getByRole("button", { name: "Complete (attest)" }));
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("+45 XP — Quest complete: Advance Ship Voice");
    expect(status).toHaveTextContent("Level up! You reached level 2");
    expect(screen.getByText(/LV 2/)).toBeInTheDocument();
  });

  it("announces achievements once and never for a repeated check-in", () => {
    render(<GameLoopWidget projects={projects} />);
    fireEvent.click(screen.getByRole("button", { name: /daily check-in/i }));
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("+20 XP — Quest complete: Daily check-in");
    expect(status).toHaveTextContent("Achievement unlocked: System Online 🛰️");

    fireEvent.click(screen.getByRole("button", { name: /daily check-in/i }));
    expect(status).toBeEmptyDOMElement();
    expect(screen.getByText("Daily check-in already recorded for today.")).toBeInTheDocument();
  });

  it("disables the boss claim until every step is marked", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const { container } = render(<GameLoopWidget projects={projects} />);
    const boss = () => questItem(container, "boss");
    const claim = () => within(boss()).getByRole("button", { name: "Complete (attest)" });
    expect(claim()).toBeDisabled();
    expect(within(boss()).getByText("Finish every boss step to unlock the claim.")).toBeInTheDocument();

    for (const step of within(boss()).getAllByRole("button", { name: "Mark step" })) {
      expect(claim()).toBeDisabled();
      fireEvent.click(step);
    }
    expect(claim()).toBeEnabled();
    expect(within(boss()).queryByText("Finish every boss step to unlock the claim.")).not.toBeInTheDocument();
    fireEvent.click(claim());
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(stored().stats.completedBossBattles).toBe(1);
  });

  it("asks before resetting and backs up the previous state", () => {
    const base = createInitialGameState({ nowIso: NOW, projects });
    seed({ ...base, stats: { ...base.stats, ...levelForXp(300), currentStreak: 4 } });
    const before = window.localStorage.getItem(GAME_STATE_STORAGE_KEY);
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    render(<GameLoopWidget projects={projects} />);

    fireEvent.click(screen.getByRole("button", { name: "Reset game" }));
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(GAME_STATE_STORAGE_KEY)).toBe(before);
    expect(window.localStorage.getItem(GAME_STATE_BACKUP_KEY)).toBeNull();
    expect(screen.getByText("Reset cancelled. Nothing changed.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reset game" }));
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(window.localStorage.getItem(GAME_STATE_BACKUP_KEY)).toBe(before);
    expect(stored().stats.xp).toBe(0);
    expect(screen.getByText(`Game reset. Previous state saved to ${GAME_STATE_BACKUP_KEY} in this browser.`)).toBeInTheDocument();
  });

  it("backs up corrupt stored state before it can be replaced and says so", () => {
    window.localStorage.setItem(GAME_STATE_STORAGE_KEY, "{corrupt");
    render(<GameLoopWidget projects={projects} />);
    expect(window.localStorage.getItem(GAME_STATE_BACKUP_KEY)).toBe("{corrupt");
    expect(screen.getByText(/Corrupted game state JSON detected and repaired\. The original data was saved to lifeos-game-state-v1\.backup/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Repair state" }));
    expect(stored().version).toBe(1);
    expect(window.localStorage.getItem(GAME_STATE_BACKUP_KEY)).toBe("{corrupt");
  });

  it("surfaces a storage diagnostic instead of throwing when saves fail", () => {
    const original = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === GAME_STATE_STORAGE_KEY) throw new DOMException("Quota exceeded", "QuotaExceededError");
      return original.call(this, key, value);
    });
    render(<GameLoopWidget projects={projects} />);
    expect(() => fireEvent.click(screen.getByRole("button", { name: /daily check-in/i }))).not.toThrow();
    expect(screen.getByText(STORAGE_WRITE_ERROR)).toBeInTheDocument();
    expect(window.localStorage.getItem(GAME_STATE_STORAGE_KEY)).toBeNull();
  });

  it("shows canonical side quests and names categories with no vault source", () => {
    const { container } = render(<GameLoopWidget projects={projects} areas={areas} businesses={[]} people={[]} />);
    const side = container.querySelector<HTMLElement>('[data-quest-category="health"]');
    expect(side).not.toBeNull();
    expect(side).toHaveTextContent("Health: one small action");
    expect(side).toHaveTextContent("SIDE · 25 XP · Protect mobility and reduce flare-ups.");
    expect(screen.getByText(/No canonical source for: learning, money, relationships, service, personal growth\./)).toBeInTheDocument();
  });

  it("renders an end-of-day results panel", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const { container } = render(<GameLoopWidget projects={projects} />);
    fireEvent.click(screen.getByRole("button", { name: /daily check-in/i }));
    fireEvent.click(within(questItem(container, "main")).getByRole("button", { name: "Complete (attest)" }));
    fireEvent.click(screen.getByRole("button", { name: "End day results" }));

    const panel = screen.getByRole("region", { name: "End-of-day results" });
    expect(panel).toHaveTextContent(`End-of-day result · ${TODAY}`);
    const quests = within(panel).getByRole("list", { name: "Quests completed today" });
    expect(within(quests).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Daily check-in+20 XP",
      "Advance Ship Voice+45 XP",
    ]);
    expect(panel).toHaveTextContent("Total XP earned today80 XP");
    expect(panel).toHaveTextContent("Current streak1");
    expect(panel).toHaveTextContent("Level1");
    expect(panel).toHaveTextContent("Achievements unlocked todaySystem Online 🛰️");
  });
});

describe("GameProgressCard on /today", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("invites a first check-in when no game state exists", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    render(<GameProgressCard />);
    expect(screen.getByRole("heading", { name: "LifeOS Game" })).toBeInTheDocument();
    expect(screen.getByText("Start your first check-in")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open game loop" })).toHaveAttribute("href", "/dashboard");
    expect(setItem).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(GAME_STATE_STORAGE_KEY)).toBeNull();
  });

  it("reads progress from the shared key without changing it", () => {
    const base = createInitialGameState({ nowIso: NOW, projects });
    const raw = JSON.stringify({
      ...base,
      stats: { ...base.stats, ...levelForXp(260), currentStreak: 3, lastCheckInDate: TODAY },
    });
    window.localStorage.setItem(GAME_STATE_STORAGE_KEY, raw);
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    render(<GameProgressCard />);
    expect(screen.getByText("Level 2 · 260 XP · streak 3")).toBeInTheDocument();
    expect(setItem).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(GAME_STATE_STORAGE_KEY)).toBe(raw);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("points to repair for unreadable state and leaves it untouched", () => {
    window.localStorage.setItem(GAME_STATE_STORAGE_KEY, "{corrupt");
    render(<GameProgressCard />);
    expect(screen.getByText(/needs repair/i)).toBeInTheDocument();
    expect(window.localStorage.getItem(GAME_STATE_STORAGE_KEY)).toBe("{corrupt");
    expect(window.localStorage.getItem(GAME_STATE_BACKUP_KEY)).toBeNull();
  });
});

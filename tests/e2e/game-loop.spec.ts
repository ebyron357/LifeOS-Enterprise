import { expect, test, type Locator, type Page } from "@playwright/test";

const GAME_KEY = "lifeos-game-state-v1";

/**
 * Resets (or seeds) game state on the first navigation of a test only. Later reloads keep
 * whatever the test saved, so persistence and duplicate-award checks are real.
 */
async function startGame(page: Page, seed: object | null = null) {
  await page.addInitScript(({ key, seedValue }) => {
    if (window.sessionStorage.getItem("lifeos-e2e-game-ready")) return;
    if (seedValue) window.localStorage.setItem(key, seedValue);
    else window.localStorage.removeItem(key);
    window.localStorage.removeItem(`${key}.backup`);
    window.sessionStorage.setItem("lifeos-e2e-game-ready", "1");
  }, { key: GAME_KEY, seedValue: seed ? JSON.stringify(seed) : null });
}

/** The dashboard applies its motion preference in an effect, so this marks hydration. */
async function openDashboard(page: Page, reload = false) {
  if (reload) await page.reload();
  else await page.goto("/dashboard");
  await page.waitForSelector("html[data-lifeos-reduced-motion]", { state: "attached" });
}

function gameWidget(page: Page) {
  return page.locator('[data-widget-id="game-loop"]');
}

async function readXp(widget: Locator): Promise<number> {
  return Number(await widget.locator(".game-loop-head [data-xp]").getAttribute("data-xp"));
}

function seededState(xp: number) {
  return {
    version: 1,
    profile: { ownerAlias: "Owner", avatar: "🧠" },
    stats: {
      xp,
      level: Math.floor(xp / 250) + 1,
      xpIntoLevel: xp % 250,
      xpToNextLevel: 250 - (xp % 250),
      completedQuests: 0,
      completedBossBattles: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastCheckInDate: null,
    },
    questsByDate: {},
    grantedEventIds: [],
    achievements: [],
    badges: [],
    streakRecovery: { missedDate: null, availableUntil: null, used: false, streakBeforeGap: null },
    endOfDay: {},
    lastError: null,
  };
}

test.describe("game loop widget", () => {
  test("awards XP exactly once per verified quest completion", async ({ page }) => {
    await startGame(page);
    await openDashboard(page);
    const widget = gameWidget(page);
    await expect(widget).toBeVisible();

    const quest = widget.locator('.game-loop-quest[data-quest-kind="main"], .game-loop-quest[data-quest-kind="side"]').first();
    await expect(quest).toBeVisible();
    const questXp = Number(await quest.getAttribute("data-quest-xp"));
    const questTitle = (await quest.locator("strong").first().textContent())?.trim() ?? "";
    expect(questXp).toBeGreaterThan(0);
    const startXp = await readXp(widget);
    expect(startXp).toBe(0);

    const dialogs: string[] = [];
    page.on("dialog", async (dialog) => {
      dialogs.push(dialog.message());
      await dialog.accept();
    });
    await quest.getByRole("button", { name: "Complete (attest)" }).click();
    const completed = quest.getByRole("button", { name: "Completed" });
    await expect(completed).toBeDisabled();
    expect(dialogs).toHaveLength(1);
    await expect.poll(() => readXp(widget)).toBe(startXp + questXp);
    await expect(widget.locator(".game-loop-celebration")).toContainText(`+${questXp} XP — Quest complete: ${questTitle}`);

    // A real double-click on the disabled button (no force) must not open a dialog or award XP.
    const box = await completed.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.dblclick(box!.x + box!.width / 2, box!.y + box!.height / 2);
    expect(dialogs).toHaveLength(1);
    expect(await readXp(widget)).toBe(startXp + questXp);

    // Reloading keeps the award and does not grant it again.
    await openDashboard(page, true);
    await expect(widget).toBeVisible();
    await expect.poll(() => readXp(widget)).toBe(startXp + questXp);
    const reloadedQuest = widget.locator(".game-loop-quest", { hasText: questTitle }).first();
    await expect(reloadedQuest.getByRole("button", { name: "Completed" })).toBeDisabled();
    expect(dialogs).toHaveLength(1);
  });

  test("rejects invented completion when attestation is cancelled", async ({ page }) => {
    await startGame(page);
    await openDashboard(page);
    const widget = gameWidget(page);
    const xpBefore = await readXp(widget);
    page.once("dialog", (dialog) => dialog.dismiss());
    await widget.getByRole("button", { name: /Complete \(attest\)/i }).first().click();
    await expect(widget.getByRole("button", { name: /Complete \(attest\)/i }).first()).toBeEnabled();
    expect(await readXp(widget)).toBe(xpBefore);
    await expect(widget.locator(".game-loop-celebration")).toBeEmpty();
  });

  test("levels up deterministically when a quest crosses 250 XP", async ({ page }) => {
    await startGame(page, seededState(240));
    await openDashboard(page);
    const widget = gameWidget(page);
    await expect.poll(() => readXp(widget)).toBe(240);
    await expect(widget.getByText(/LV 1/)).toBeVisible();

    const quest = widget.locator('.game-loop-quest[data-quest-xp="45"]').first();
    await expect(quest).toBeVisible();
    page.once("dialog", (dialog) => dialog.accept());
    await quest.getByRole("button", { name: "Complete (attest)" }).click();

    await expect.poll(() => readXp(widget)).toBe(285);
    await expect(widget.getByText(/LV 2/)).toBeVisible();
    const celebration = widget.locator(".game-loop-celebration");
    await expect(celebration).toContainText("+45 XP — Quest complete:");
    await expect(celebration).toContainText("Level up! You reached level 2");

    await openDashboard(page, true);
    await expect.poll(() => readXp(widget)).toBe(285);
    await expect(widget.getByText(/LV 2/)).toBeVisible();
  });

  test("unlocks the System Online achievement exactly once", async ({ page }) => {
    await startGame(page);
    await openDashboard(page);
    const widget = gameWidget(page);
    await widget.getByRole("button", { name: /daily check-in/i }).click();
    await expect(widget.locator(".game-loop-celebration")).toContainText("Achievement unlocked: System Online");
    await expect.poll(() => readXp(widget)).toBe(35);

    await openDashboard(page, true);
    await expect.poll(() => readXp(widget)).toBe(35);
    const systemOnline = widget.locator(".game-loop-achievements li", { hasText: "System Online" });
    await expect(systemOnline).toHaveCount(1);

    await widget.getByRole("button", { name: /daily check-in/i }).click();
    await expect(widget.getByText("Daily check-in already recorded for today.")).toBeVisible();
    await expect(systemOnline).toHaveCount(1);
    expect(await readXp(widget)).toBe(35);
    await expect(widget.locator(".game-loop-celebration")).toBeEmpty();
  });

  test("supports daily check-in and an end-of-day results panel", async ({ page }) => {
    await startGame(page);
    await openDashboard(page);
    const widget = gameWidget(page);
    await widget.getByRole("button", { name: /daily check-in/i }).click();
    await widget.getByRole("button", { name: /end day results/i }).click();
    const panel = widget.getByRole("region", { name: "End-of-day results" });
    await expect(panel.getByText(/End-of-day result/i)).toBeVisible();
    await expect(panel.getByRole("list", { name: "Quests completed today" })).toContainText("Daily check-in+20 XP");
    await expect(panel).toContainText("Total XP earned today35 XP");
    await expect(panel).toContainText("Current streak1");
    await expect(panel).toContainText("Level1");
    await expect(panel).toContainText("System Online");
  });

  test("shows read-only game progress on Today", async ({ page }) => {
    await startGame(page);
    await page.goto("/today");
    const card = page.getByRole("region", { name: "LifeOS Game" });
    await expect(card).toContainText("Start your first check-in");

    await openDashboard(page);
    await gameWidget(page).getByRole("button", { name: /daily check-in/i }).click();
    await expect.poll(() => readXp(gameWidget(page))).toBe(35);
    const saved = await page.evaluate((key) => window.localStorage.getItem(key), GAME_KEY);

    await page.goto("/today");
    await expect(card).toContainText("Level 1 · 35 XP · streak 1");
    expect(await page.evaluate((key) => window.localStorage.getItem(key), GAME_KEY)).toBe(saved);
    await card.getByRole("link", { name: "Open game loop" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(gameWidget(page)).toBeVisible();
  });
});

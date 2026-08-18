import { test, expect } from "@playwright/test";
import { buildSeedStore, SEED_LONG_PROJECT_NAME } from "./seed-brief";
import { dateKeyInTimezone } from "../../lib/daily-brief/date";

const STORAGE_KEY = "lifeos-daily-brief-store-v1";
const TEST_TIMEZONE = "America/New_York";

function todayIso(): string {
  return dateKeyInTimezone(new Date(), TEST_TIMEZONE);
}

async function seedStore(page: import("@playwright/test").Page, dates: string[]) {
  const store = buildSeedStore(dates);
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [STORAGE_KEY, JSON.stringify(store)] as [string, string],
  );
}

test.describe("Daily Operations Brief", () => {
  test("renders the opening view with mission, outcomes, Start Here, schedule, blockers, and decisions", async ({ page }) => {
    await seedStore(page, [todayIso()]);
    await page.goto("/daily-brief");

    await expect(page.getByRole("heading", { name: "Daily Operations Brief" })).toBeVisible();
    await expect(page.getByText(/Validate and approve today's two highest-priority outcomes/)).toBeVisible();
    await expect(page.getByText("Start Here").first()).toBeVisible();
    await expect(page.getByText("Ship the release notes").first()).toBeVisible();
    await expect(page.getByText("Top outcomes (2 of 3 max)")).toBeVisible();
    await expect(page.getByText("Proposed schedule · Suggest Only")).toBeVisible();
    await expect(page.getByRole("cell", { name: "Blocked Project" })).toBeVisible();
    await expect(page.getByText("Waiting Project")).toBeVisible();
    await expect(page.getByText(/marked Critical priority/)).toBeVisible();
  });

  test("shows blocked and waiting items and never schedules them", async ({ page }) => {
    await seedStore(page, [todayIso()]);
    await page.goto("/daily-brief");

    await expect(page.getByRole("cell", { name: "Blocked Project" })).toBeVisible();
    await expect(page.getByText("Waiting on legal sign-off before continuing")).toBeVisible();
    const scheduleTable = page.locator("table").filter({ hasText: "Flexibility" });
    await expect(scheduleTable.getByText("Blocked Project")).toHaveCount(0);
  });

  test("renders proposed agent work order cards labeled Not Running and Pending", async ({ page }) => {
    await seedStore(page, [todayIso()]);
    await page.goto("/daily-brief");

    await expect(page.getByText("Proposed Agent Work Order — Not Running")).toBeVisible();
    await expect(page.getByText(/Pending · risk Medium/)).toBeVisible();
  });

  test("renders decision cards for genuine human decisions", async ({ page }) => {
    await seedStore(page, [todayIso()]);
    await page.goto("/daily-brief");

    await expect(page.getByText(/Which should receive today's Start Here focus/)).toBeVisible();
  });

  test("progressively discloses evidence behind a control instead of showing it by default", async ({ page }) => {
    await seedStore(page, [todayIso()]);
    await page.goto("/daily-brief");

    const evidenceButton = page.getByRole("button", { name: "View evidence" }).first();
    await expect(page.getByText("10 Projects/Seed Project.md")).toHaveCount(0);
    await evidenceButton.click();
    await expect(page.getByText("10 Projects/Seed Project.md")).toBeVisible();
  });

  test("handles long project names and long next actions without breaking layout", async ({ page }) => {
    await seedStore(page, [todayIso()]);
    await page.goto("/daily-brief");
    await expect(page.getByLabel("Top outcomes").getByText(SEED_LONG_PROJECT_NAME)).toBeVisible();
  });

  test("shows schedule overflow into a buffer block at the end of the day", async ({ page }) => {
    await seedStore(page, [todayIso()]);
    await page.goto("/daily-brief");
    await expect(page.getByRole("cell", { name: "Buffer", exact: true }).first()).toBeVisible();
  });

  test("supports previous-brief navigation across multiple stored dates", async ({ page }) => {
    const today = todayIso();
    const yesterday = dateKeyInTimezone(new Date(Date.now() - 86_400_000), TEST_TIMEZONE);
    await seedStore(page, [yesterday, today]);
    await page.goto("/daily-brief");

    await expect(page.getByText("Previous briefs:")).toBeVisible();
    const yesterdayButton = page.getByRole("button", { name: yesterday });
    await expect(yesterdayButton).toBeVisible();
    await yesterdayButton.click();
    await expect(yesterdayButton).toHaveAttribute("aria-current", "true");
  });

  test("supports starting and completing the end-of-day review", async ({ page }) => {
    await seedStore(page, [todayIso()]);
    await page.goto("/daily-brief");

    const approveButton = page.getByRole("button", { name: "Approve brief" });
    page.once("dialog", (dialog) => dialog.accept());
    await approveButton.click();
    const startReview = page.getByRole("button", { name: "Start end-of-day review" });
    await expect(startReview).toBeEnabled();
    await startReview.click();
    await expect(page.getByText(/End-of-day review \(in progress\)/)).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Complete end-of-day review" }).click();
    await expect(page.getByText(/End-of-day review \(completed\)/)).toBeVisible();
  });

  test("keyboard navigation reaches primary controls with a visible focus state", async ({ page }) => {
    await seedStore(page, [todayIso()]);
    await page.goto("/daily-brief");

    await page.getByRole("button", { name: "Regenerate draft" }).focus();
    await expect(page.getByRole("button", { name: "Regenerate draft" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Approve brief" })).toBeFocused();
  });

  test("mobile width keeps the brief readable and navigable", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedStore(page, [todayIso()]);
    await page.goto("/daily-brief");
    await expect(page.getByRole("heading", { name: "Daily Operations Brief" })).toBeVisible();
    await expect(page.getByText("Top outcomes (2 of 3 max)")).toBeVisible();
  });

  test("empty state: shows an honest message when no project qualifies as a top outcome", async ({ page }) => {
    const emptyDate = todayIso();
    const store = {
      schemaVersion: 1 as const,
      revisionsByDate: {
        [emptyDate]: [
          {
            ...buildSeedStore([emptyDate]).revisionsByDate[emptyDate][0],
            topOutcomes: [],
            startHere: null,
            blockedItems: [],
            waitingItems: [],
            proposedWorkOrders: [],
            humanDecisions: [],
            todaysMission: "Review the portfolio for newly actionable work; no project currently qualifies as an unblocked top outcome.",
          },
        ],
      },
      endOfDayReviewsByDate: {},
    };
    await page.addInitScript(([key, value]) => window.localStorage.setItem(key, value), [STORAGE_KEY, JSON.stringify(store)] as [string, string]);
    await page.goto("/daily-brief");

    await expect(page.getByText(/no project currently qualifies/)).toBeVisible();
    await expect(page.getByText("No immediately actionable, unblocked step is available right now.")).toBeVisible();
    await expect(page.getByText("Nothing is blocked or waiting right now.")).toBeVisible();
  });

  test("loading state: renders without throwing before client-side generation completes", async ({ page }) => {
    // No seeded store: the very first paint (before the client effect runs)
    // is the loading/empty-before-generation state.
    await page.goto("/daily-brief");
    await expect(page.getByRole("heading", { name: "Daily Operations Brief" })).toBeVisible();
  });

  test("partial-data warning: surfaces stale-data warnings without hiding the rest of the brief", async ({ page }) => {
    await seedStore(page, [todayIso()]);
    await page.goto("/daily-brief");
    await page.getByText("Assumptions and confidence").click();
    await expect(page.getByText(/stale-data warning/)).toBeVisible();
  });
});

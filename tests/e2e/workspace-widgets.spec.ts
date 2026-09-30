import { expect, test, type Page, type TestInfo } from "@playwright/test";

const LAYOUT_KEY = "lifeos-workspace-os-v1-layout";

/**
 * Console errors that are allowed on /dashboard. Keep this list empty unless a message is
 * proven benign and outside LifeOS control; document why next to each entry.
 */
const BENIGN_CONSOLE_ERRORS: RegExp[] = [];

type StoredItem = { i: string; x: number; y: number; w: number; h: number };
type StoredLayout = {
  layouts: Record<"lg" | "md" | "sm" | "xs", StoredItem[]>;
  widgets: Record<string, { hidden: boolean; minimized: boolean }>;
  widgetOrder: string[];
};

function isMobileProject(testInfo: TestInfo) {
  return testInfo.project.name.includes("mobile");
}

/** Clears saved layout once per test, so reloads inside a test keep what the test saved. */
async function startWithCleanLayout(page: Page) {
  await page.addInitScript((key) => {
    if (!window.sessionStorage.getItem("lifeos-e2e-layout-cleared")) {
      window.localStorage.removeItem(key);
      window.sessionStorage.setItem("lifeos-e2e-layout-cleared", "1");
    }
  }, LAYOUT_KEY);
}

async function readLayout(page: Page): Promise<StoredLayout | null> {
  const raw = await page.evaluate((key) => window.localStorage.getItem(key), LAYOUT_KEY);
  return raw ? (JSON.parse(raw) as StoredLayout) : null;
}

function widgetGeometry(layout: StoredLayout | null, id: string) {
  if (!layout) return null;
  return Object.fromEntries(
    (Object.keys(layout.layouts) as Array<keyof StoredLayout["layouts"]>).map((key) => {
      const item = layout.layouts[key].find((entry) => entry.i === id);
      return [key, item ? { x: item.x, y: item.y, w: item.w, h: item.h } : null];
    }),
  );
}

/** Document-relative box, so scroll position after a reload does not matter. */
async function documentBox(page: Page, selector: string) {
  return page.locator(selector).evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return { x: rect.x + window.scrollX, y: rect.y + window.scrollY, width: rect.width, height: rect.height };
  });
}

/** Waits for react-grid-layout to commit and finish its CSS transitions before measuring. */
async function waitForGridToSettle(page: Page) {
  await page.locator(".workspace-rgl").evaluate(async (node) => {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await Promise.all(node.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => undefined)));
  });
}

/** The dashboard applies its motion preference in an effect, so this marks hydration. */
async function waitForHydratedDashboard(page: Page) {
  await page.waitForSelector("html[data-lifeos-reduced-motion]", { state: "attached" });
}

async function visibleGridOrder(page: Page) {
  return page.locator("[data-grid-id]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-grid-id")));
}

test.describe("workspace widget customization", () => {
  test.beforeEach(async ({ page }) => {
    await startWithCleanLayout(page);
  });

  test("hydrates the dashboard without uncaught errors or console errors", async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() !== "error") return;
      const text = message.text();
      if (BENIGN_CONSOLE_ERRORS.some((pattern) => pattern.test(text))) return;
      consoleErrors.push(text);
    });
    await page.goto("/dashboard");
    await waitForHydratedDashboard(page);
    await expect(page.getByRole("heading", { name: "Command Center" })).toBeVisible();
    await expect(page.locator('[data-widget-id="game-loop"]')).toBeVisible();
    await expect(page.locator(".widget-error")).toHaveCount(0);
    // Let deferred client work (effects, resize observers) settle before asserting.
    await page.waitForLoadState("networkidle");
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test("minimizes, restores, and repairs layout", async ({ page }) => {
    await page.goto("/dashboard");
    await waitForHydratedDashboard(page);
    const widget = page.locator('[data-widget-id="game-loop"]');
    await widget.getByRole("button", { name: "Minimize" }).click();
    await expect(widget.getByRole("button", { name: "Restore" })).toBeVisible();
    await widget.getByRole("button", { name: "Restore" }).click();
    await expect(widget.getByRole("button", { name: "Minimize" })).toBeVisible();
    await page.getByRole("button", { name: /^repair layout$/i }).click();
    await expect(page.getByText("Layout checked: no problems found.")).toBeVisible();
  });

  test("drags a desktop widget and keeps the new position after reload", async ({ page }, testInfo) => {
    test.skip(isMobileProject(testInfo), "The draggable grid is desktop-only; mobile uses stacked reorder controls.");
    await page.goto("/dashboard");
    await waitForHydratedDashboard(page);
    await expect(page.locator('[data-workspace-layout="grid"]')).toBeVisible();
    // Repair writes the normalized default layout, giving a stored baseline to compare against.
    await page.getByRole("button", { name: /^repair layout$/i }).click();
    await expect(page.getByText("Layout checked: no problems found.")).toBeVisible();
    const geometryBefore = widgetGeometry(await readLayout(page), "prayer");
    expect(geometryBefore).not.toBeNull();

    // Prayer starts in the right-hand column, so dragging it to the left edge must move it.
    const selector = '[data-grid-id="prayer"]';
    const item = page.locator(selector);
    await item.scrollIntoViewIfNeeded();
    await waitForGridToSettle(page);
    const before = await documentBox(page, selector);
    const grid = await page.locator(".workspace-rgl").boundingBox();
    expect(grid).not.toBeNull();

    const handle = page.locator('[data-widget-id="prayer"]').getByRole("button", { name: /drag prayer/i });
    const handleBox = await handle.boundingBox();
    expect(handleBox).not.toBeNull();
    const targetX = grid!.x + (handleBox!.x - before.x) + handleBox!.width / 2 + 4;
    await handle.hover();
    await page.mouse.down();
    await page.mouse.move(targetX, handleBox!.y + handleBox!.height / 2, { steps: 12 });
    await page.mouse.up();
    await waitForGridToSettle(page);

    const afterDrag = await documentBox(page, selector);
    expect(afterDrag.x).toBeLessThan(before.x - 8);

    // The move is committed to storage, not only to the DOM.
    const geometryAfterDrag = widgetGeometry(await readLayout(page), "prayer");
    expect(geometryAfterDrag).not.toEqual(geometryBefore);

    await page.reload();
    await waitForHydratedDashboard(page);
    await expect(page.locator('[data-workspace-layout="grid"]')).toBeVisible();
    await waitForGridToSettle(page);
    expect(widgetGeometry(await readLayout(page), "prayer")).toEqual(geometryAfterDrag);
    await expect.poll(async () => {
      const box = await documentBox(page, selector);
      return Math.abs(box.x - afterDrag.x) <= 2 && Math.abs(box.y - afterDrag.y) <= 2;
    }).toBe(true);
    const afterReload = await documentBox(page, selector);
    expect(Math.abs(afterReload.width - afterDrag.width)).toBeLessThanOrEqual(2);
    expect(Math.abs(afterReload.height - afterDrag.height)).toBeLessThanOrEqual(2);
  });

  test("resizes a desktop widget larger", async ({ page }, testInfo) => {
    test.skip(isMobileProject(testInfo), "Resize handles are desktop-only.");
    await page.goto("/dashboard");
    await waitForHydratedDashboard(page);
    await expect(page.locator('[data-workspace-layout="grid"]')).toBeVisible();
    // Prayer starts narrower than the board, so it has room to grow in both directions.
    const item = page.locator('[data-grid-id="prayer"]');
    await item.scrollIntoViewIfNeeded();
    await waitForGridToSettle(page);
    const box = await item.boundingBox();
    expect(box).not.toBeNull();
    const seHandle = item.locator(".react-resizable-handle-se, .react-resizable-handle").first();
    await expect(seHandle).toHaveCount(1);
    const se = await seHandle.boundingBox();
    expect(se).not.toBeNull();
    await page.mouse.move(se!.x + se!.width / 2, se!.y + se!.height / 2);
    await page.mouse.down();
    await page.mouse.move(se!.x + se!.width / 2 + 160, se!.y + se!.height / 2 + 120, { steps: 8 });
    await page.mouse.up();
    await waitForGridToSettle(page);

    const afterResize = await item.boundingBox();
    expect(afterResize).not.toBeNull();
    const grewWidth = afterResize!.width > box!.width + 1;
    const grewHeight = afterResize!.height > box!.height + 1;
    expect(grewWidth || grewHeight).toBe(true);
  });

  test("keeps a hidden widget hidden after refresh", async ({ page }) => {
    await page.goto("/dashboard");
    await waitForHydratedDashboard(page);
    await expect(page.locator('[data-widget-id="game-loop"]')).toBeVisible();
    await page.getByRole("button", { name: /widget library \/ customize/i }).click();
    const gameRow = page.locator(".widget-library li", { hasText: "Game loop" }).first();
    await gameRow.getByRole("button", { name: "Remove widget" }).click();
    await expect(page.locator('[data-widget-id="game-loop"]')).toHaveCount(0);
    await page.getByRole("button", { name: "Close" }).click();

    await page.reload();
    await waitForHydratedDashboard(page);
    await expect(page.locator('[data-widget-id="mission-status"]')).toBeVisible();
    await expect(page.locator('[data-widget-id="game-loop"]')).toHaveCount(0);
    expect((await readLayout(page))?.widgets["game-loop"]?.hidden).toBe(true);

    // Adding it back also persists.
    await page.getByRole("button", { name: /widget library \/ customize/i }).click();
    await page.locator(".widget-library li", { hasText: "Game loop" }).first().getByRole("button", { name: "Add widget" }).click();
    await page.getByRole("button", { name: "Close" }).click();
    await page.reload();
    await waitForHydratedDashboard(page);
    await expect(page.locator('[data-widget-id="game-loop"]')).toBeVisible();
  });

  test("repairs a corrupted saved layout and lists what was fixed", async ({ page }) => {
    await page.goto("/dashboard");
    await waitForHydratedDashboard(page);
    await expect(page.locator('[data-widget-id="game-loop"]')).toBeVisible();
    await page.evaluate((key) => {
      const base = {
        version: 2,
        workspaceId: "command-center",
        layouts: { lg: [], md: [], sm: [], xs: [] } as Record<string, unknown[]>,
        widgets: {} as Record<string, unknown>,
        widgetOrder: [] as string[],
        focusedWidgetId: "ghost-widget",
        reducedMotion: false,
      };
      const ids = [
        "mission-status", "cognitive-support", "project-command-board", "decision-queue", "morning-brief",
        "personal-growth", "game-loop", "github-health", "revenue-radar", "prayer", "ai-workforce",
      ];
      for (const key of Object.keys(base.layouts)) {
        base.layouts[key] = [
          ...ids.filter((id) => id !== "game-loop").map((id, index) => ({ i: id, x: 0, y: index * 6, w: 4, h: 6 })),
          { i: "ghost-widget", x: 0, y: 200, w: 4, h: 4 },
        ];
      }
      for (const id of ids) base.widgets[id] = { hidden: false, minimized: false };
      // Invalid values: a truthy string hides these widgets until repaired.
      base.widgets["game-loop"] = { hidden: "yes", minimized: 3 };
      base.widgets["mission-status"] = { hidden: 1, minimized: false };
      base.widgetOrder = ["ghost-widget", ...ids, "prayer"];
      window.localStorage.setItem(key, JSON.stringify(base));
    }, LAYOUT_KEY);

    await page.reload();
    await waitForHydratedDashboard(page);
    await expect(page.locator('[data-widget-id="game-loop"]')).toHaveCount(0);
    await expect(page.locator('[data-widget-id="mission-status"]')).toHaveCount(0);

    await page.getByRole("button", { name: /^repair layout$/i }).click();
    await expect(page.getByText(/Layout state repaired \(\d+ fixes\)\./)).toBeVisible();
    const report = page.getByRole("region", { name: "Layout repair report" });
    await expect(report).toContainText("Removed unknown widget ids: ghost-widget.");
    await expect(report).toContainText("Removed duplicate entries for: Prayer.");
    await expect(report).toContainText("Restored default positions for: Game loop.");
    await expect(report).toContainText("Fixed invalid show/hide or minimize values for: Mission status, Game loop.");
    await expect(report).toContainText('Cleared stale focus on "ghost-widget".');

    await expect(page.locator('[data-widget-id="game-loop"]')).toBeVisible();
    await expect(page.locator('[data-widget-id="mission-status"]')).toBeVisible();
    const repaired = await readLayout(page);
    expect(repaired?.widgets["game-loop"]).toEqual({ hidden: false, minimized: false });
    expect(repaired?.widgetOrder).not.toContain("ghost-widget");
    expect(new Set(repaired?.widgetOrder).size).toBe(repaired?.widgetOrder.length);

    // A repaired layout survives a reload with nothing left to fix.
    await page.reload();
    await waitForHydratedDashboard(page);
    await expect(page.locator('[data-widget-id="game-loop"]')).toBeVisible();
    await page.getByRole("button", { name: /^repair layout$/i }).click();
    await expect(page.getByText("Layout checked: no problems found.")).toBeVisible();
  });

  test("reorders widgets on mobile, skipping hidden widgets, without overflow", async ({ page }, testInfo) => {
    test.skip(!isMobileProject(testInfo), "Stacked reorder controls are the mobile layout.");
    await page.goto("/dashboard");
    await waitForHydratedDashboard(page);
    await expect(page.locator('[data-workspace-layout="stacked"]')).toBeVisible();
    await expect(page.locator(".workspace-mobile-chrome").first()).toBeVisible();

    const initial = await visibleGridOrder(page);
    expect(initial.length).toBeGreaterThan(3);
    const [first, second, third] = initial;

    await page.locator(`[data-grid-id="${first}"] .workspace-mobile-chrome`).getByRole("button", { name: "Move down" }).click();
    await expect.poll(() => visibleGridOrder(page)).toEqual([second, first, ...initial.slice(2)]);

    // Hide the widget now between the two, then move again: the move must skip it.
    await page.locator(`[data-grid-id="${first}"] .workspace-mobile-chrome`).getByRole("button", { name: "Move up" }).click();
    await expect.poll(() => visibleGridOrder(page)).toEqual(initial);
    await page.locator(`[data-grid-id="${second}"] .workspace-mobile-chrome`).getByRole("button", { name: "Hide" }).click();
    await expect.poll(() => visibleGridOrder(page)).toEqual([first, third, ...initial.slice(3)]);
    await page.locator(`[data-grid-id="${first}"] .workspace-mobile-chrome`).getByRole("button", { name: "Move down" }).click();
    await expect.poll(() => visibleGridOrder(page)).toEqual([third, first, ...initial.slice(3)]);

    await page.reload();
    await waitForHydratedDashboard(page);
    await expect.poll(() => visibleGridOrder(page)).toEqual([third, first, ...initial.slice(3)]);

    const overflow = await page.locator("#main-content").evaluate((node) => node.scrollWidth > node.clientWidth + 1);
    expect(overflow).toBe(false);
  });
});

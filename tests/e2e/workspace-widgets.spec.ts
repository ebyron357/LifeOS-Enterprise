import { expect, test } from "@playwright/test";

test.describe("workspace widget customization", () => {
  test("hydrates the dashboard without uncaught errors", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Command Center" })).toBeVisible();
    await expect(page.locator('[data-widget-id="game-loop"]')).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test("minimizes, restores, and repairs layout", async ({ page }) => {
    await page.goto("/dashboard");
    const widget = page.locator('[data-widget-id="game-loop"]');
    await widget.getByRole("button", { name: "Minimize" }).click();
    await expect(widget.getByRole("button", { name: "Restore" })).toBeVisible();
    await widget.getByRole("button", { name: "Restore" }).click();
    await expect(widget.getByRole("button", { name: "Minimize" })).toBeVisible();
    await page.getByRole("button", { name: /repair layout/i }).click();
    await expect(page.getByText(/layout state repaired/i)).toBeVisible();
  });

  test("drags and resizes a desktop widget", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/dashboard");
    await expect(page.locator('[data-workspace-layout="grid"]')).toBeVisible();
    const item = page.locator('[data-grid-id="game-loop"]');
    const widget = page.locator('[data-widget-id="game-loop"]');
    const before = await item.boundingBox();
    expect(before).not.toBeNull();
    const handle = widget.getByRole("button", { name: /drag game loop/i });
    const handleBox = await handle.boundingBox();
    expect(handleBox).not.toBeNull();
    await handle.hover();
    await page.mouse.down();
    await page.mouse.move(handleBox!.x + 180, handleBox!.y + 80, { steps: 8 });
    await page.mouse.up();
    const afterDrag = await item.boundingBox();
    expect(afterDrag).not.toBeNull();
    expect(Math.abs((afterDrag!.x - before!.x)) + Math.abs((afterDrag!.y - before!.y))).toBeGreaterThan(8);

    const box = await item.boundingBox();
    expect(box).not.toBeNull();
    const seHandle = item.locator(".react-resizable-handle, .react-resizable-handle-se").first();
    if (await seHandle.count()) {
      const se = await seHandle.boundingBox();
      expect(se).not.toBeNull();
      await page.mouse.move(se!.x + se!.width / 2, se!.y + se!.height / 2);
    } else {
      await page.mouse.move(box!.x + box!.width - 6, box!.y + box!.height - 6);
    }
    await page.mouse.down();
    await page.mouse.move(box!.x + box!.width + 90, box!.y + box!.height + 50, { steps: 6 });
    await page.mouse.up();
    const afterResize = await item.boundingBox();
    expect(afterResize).not.toBeNull();
    expect(afterResize!.width + afterResize!.height).toBeGreaterThan(box!.width + box!.height - 1);
  });

  test("supports remove/add widget with persistence after refresh", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: /widget library \/ customize/i }).click();
    const gameRow = page.locator(".widget-library li", { hasText: "Game loop" }).first();
    await gameRow.getByRole("button", { name: "Remove widget" }).click();
    await expect(page.locator('[data-widget-id="game-loop"]')).toHaveCount(0);

    await gameRow.getByRole("button", { name: "Add widget" }).click();
    await expect(page.locator('[data-widget-id="game-loop"]')).toBeVisible();
    await page.reload();
    await expect(page.locator('[data-widget-id="game-loop"]')).toBeVisible();
  });

  test("supports mobile reordering controls without overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");
    await expect(page.locator('[data-workspace-layout="stacked"]')).toBeVisible();
    await expect(page.locator(".workspace-mobile-chrome").first()).toBeVisible();
    await page.locator(".workspace-mobile-chrome").first().getByRole("button", { name: "Move down" }).click();
    await page.getByRole("button", { name: /widget library \/ customize/i }).click();
    const gameRow = page.locator(".widget-library li", { hasText: "Game loop" }).first();
    await gameRow.getByRole("button", { name: "Move up" }).click();
    await page.getByRole("button", { name: "Close" }).click();

    const overflow = await page.locator("#main-content").evaluate((node) => node.scrollWidth > node.clientWidth + 1);
    expect(overflow).toBe(false);
  });
});

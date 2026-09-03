import { expect, test } from "@playwright/test";

test.describe("workspace widget customization", () => {
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
    await page.getByRole("button", { name: /widget library \/ customize/i }).click();
    const gameRow = page.locator(".widget-library li", { hasText: "Game loop" }).first();
    await gameRow.getByRole("button", { name: "Move up" }).click();
    await page.getByRole("button", { name: "Close" }).click();

    const overflow = await page.locator("#main-content").evaluate((node) => node.scrollWidth > node.clientWidth + 1);
    expect(overflow).toBe(false);
  });
});

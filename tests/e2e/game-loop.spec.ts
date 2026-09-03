import { expect, test } from "@playwright/test";

test.describe("game loop widget", () => {
  test("awards XP exactly once per quest completion", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.removeItem("lifeos-game-state-v1"));
    await page.goto("/dashboard");
    const widget = page.locator('[data-widget-id="game-loop"]');
    await expect(widget).toBeVisible();

    const firstComplete = widget.getByRole("button", { name: "Complete" }).first();
    await firstComplete.click();
    const xpLabel = widget.getByText(/XP total/i).first();
    const afterFirst = await xpLabel.textContent();

    await firstComplete.click({ force: true });
    const afterSecond = await xpLabel.textContent();
    expect(afterSecond).toBe(afterFirst);
  });

  test("supports daily check-in and end-of-day summary", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.removeItem("lifeos-game-state-v1"));
    await page.goto("/dashboard");
    const widget = page.locator('[data-widget-id="game-loop"]');
    await widget.getByRole("button", { name: /daily check-in/i }).click();
    await widget.getByRole("button", { name: /end day results/i }).click();
    await expect(widget.getByText(/End-of-day result/i)).toBeVisible();
  });
});

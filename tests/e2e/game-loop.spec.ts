import { expect, test } from "@playwright/test";

test.describe("game loop widget", () => {
  test("awards XP exactly once per verified quest completion", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.removeItem("lifeos-game-state-v1"));
    await page.goto("/dashboard");
    const widget = page.locator('[data-widget-id="game-loop"]');
    await expect(widget).toBeVisible();

    const firstQuest = widget.locator(".game-loop-quests li").first();
    page.once("dialog", (dialog) => dialog.accept());
    await firstQuest.getByRole("button", { name: /Complete \(attest\)/i }).click();
    await expect(firstQuest.getByRole("button", { name: /Completed/i })).toBeVisible();
    const xpLabel = widget.getByText(/XP total/i).first();
    const afterFirst = await xpLabel.textContent();

    // Retrying the same completed quest must not award more XP.
    await firstQuest.getByRole("button", { name: /Completed/i }).click({ force: true });
    const afterSecond = await xpLabel.textContent();
    expect(afterSecond).toBe(afterFirst);
  });

  test("rejects invented completion when attestation is cancelled", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.removeItem("lifeos-game-state-v1"));
    await page.goto("/dashboard");
    const widget = page.locator('[data-widget-id="game-loop"]');
    const xpBefore = await widget.getByText(/XP total/i).first().textContent();
    page.once("dialog", (dialog) => dialog.dismiss());
    await widget.getByRole("button", { name: /Complete \(attest\)/i }).first().click();
    const xpAfter = await widget.getByText(/XP total/i).first().textContent();
    expect(xpAfter).toBe(xpBefore);
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

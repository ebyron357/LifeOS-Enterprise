import { expect, test } from "@playwright/test";

test.describe("interactive conversation workspace", () => {
  test("loads conversation surfaces without horizontal overflow", async ({ page }) => {
    await page.goto("/conversation");
    await expect(page.getByRole("heading", { name: "Conversation", level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: /start conversation/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /share screen/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /pause agent/i })).toBeVisible();
    await expect(page.getByText(/No screen is being shared/i)).toBeVisible();
    const overflow = await page.locator("#main-content").evaluate((node) => node.scrollWidth > node.clientWidth + 1);
    expect(overflow).toBe(false);
  });

  test("supports keyboard access to conversation controls", async ({ page }) => {
    await page.goto("/conversation");
    await page.getByRole("textbox", { name: "Ask LifeOS" }).focus();
    await expect(page.getByRole("textbox", { name: "Ask LifeOS" })).toBeFocused();
    await page.keyboard.type("What needs attention?");
    await page.getByRole("button", { name: /^send$/i }).press("Enter");
  });

  test("shows idle screen-share state without silently capturing", async ({ page }) => {
    await page.goto("/conversation");
    await expect(page.getByRole("button", { name: /share screen/i })).toBeEnabled();
    await expect(page.getByText(/never starts capture by itself/i)).toBeVisible();
  });
});

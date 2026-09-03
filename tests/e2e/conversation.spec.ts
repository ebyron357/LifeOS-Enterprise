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

  test("persists voice settings after refresh", async ({ page }) => {
    await page.goto("/conversation");
    const settings = page.locator("section[aria-label='Voice settings']");
    const selects = settings.getByRole("combobox");
    await selects.first().selectOption("browser");
    await selects.nth(1).selectOption("zh-TW");
    await selects.nth(3).selectOption("coach");
    await expect(selects.nth(1)).toHaveValue("zh-TW");
    await expect.poll(async () => {
      const value = await page.evaluate(() => window.localStorage.getItem("lifeos-conversation-voice-settings-v1"));
      return value || "";
    }).toContain("\"locale\":\"zh-TW\"");
    await page.reload();
    const stored = await page.evaluate(() => window.localStorage.getItem("lifeos-conversation-voice-settings-v1"));
    expect(stored).toContain("\"locale\":\"zh-TW\"");
    expect(stored).toContain("\"responseStyle\":\"coach\"");
  });
});

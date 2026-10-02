import { expect, test } from "@playwright/test";

/** Runs in Chromium and both WebKit projects through the conversation.spec.ts matcher. */
test("keeps the sticky search header compact and usable at phone widths", async ({ page }, testInfo) => {
  for (const width of [320, 390, 414]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/conversation");
    // Control placement must settle before activation, rather than animate under fixed chrome.
    await expect.poll(async () => page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
    const search = page.getByRole("button", { name: "Search LifeOS", exact: true });
    const header = page.locator("header").filter({ has: search });
    await expect(search).toBeVisible();
    await expect.poll(async () => header.evaluate((node) => node.getBoundingClientRect().height)).toBeLessThanOrEqual(72);
    await expect.poll(async () => search.evaluate((node) => node.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);

    // Opening the actual disclosure and scrolling must not recreate a tall overlay.
    const settings = page.locator("#advanced-settings");
    await settings.getByText("Voice & accessibility settings", { exact: true }).click();
    await expect(settings).toHaveJSProperty("open", true);
    await settings.scrollIntoViewIfNeeded();
    await expect.poll(async () => header.evaluate((node) => node.getBoundingClientRect().height)).toBeLessThanOrEqual(72);
    if (width === 390) {
      await page.screenshot({ path: `artifacts/os-rebuild/mobile-header-${testInfo.project.name}.png` });
    }

    // cmdk labels its input through the command root's "LifeOS commands" label.
    // Exercise the real entry point, rather than calling a DOM click handler directly.
    if (testInfo.project.use.hasTouch) await search.tap();
    else await search.click();
    await expect(page.getByRole("combobox", { name: "LifeOS commands", exact: true })).toBeVisible();
  }
});

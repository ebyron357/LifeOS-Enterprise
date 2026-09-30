import { expect, test, type Page } from "@playwright/test";

function openMenu(page: Page) {
  return page.getByRole("button", { name: /my life/i }).click();
}

function panel(page: Page) {
  return page.getByRole("navigation", { name: "LifeOS personal navigation" });
}

test.describe("My Life mega navigation", () => {
  test("opens with real destinations and closes with Escape, returning focus", async ({ page }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: /my life/i });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await openMenu(page);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    const nav = panel(page);
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: "Open Life Map" })).toHaveAttribute("href", "/life-map");
    await expect(nav.getByRole("link", { name: /^Businesses/ })).toHaveAttribute("href", "/businesses");
    await expect(nav.getByRole("link", { name: /^Agents/ })).toHaveAttribute("href", "/agents");
    await expect(nav.getByRole("link", { name: /^Charlotte Real Estate/ })).toHaveAttribute(
      "href",
      "/note/Projects/Charlotte%20Real%20Estate%20System",
    );
    await expect(nav.getByRole("link", { name: /^Weekly Review/ })).toHaveAttribute("href", "/note/Dashboards/Weekly%20Review");

    await nav.getByRole("link", { name: "Open Life Map" }).focus();
    await page.keyboard.press("Escape");
    await expect(nav).toBeHidden();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();
  });

  test("closes on an outside press and after choosing a destination", async ({ page }) => {
    await page.goto("/");
    await openMenu(page);
    await expect(panel(page)).toBeVisible();
    await page.locator("#main-content").dispatchEvent("mousedown");
    await expect(panel(page)).toBeHidden();

    await openMenu(page);
    await panel(page).getByRole("link", { name: "Open Dashboards" }).click();
    await expect(page).toHaveURL(/\/dashboards$/);
    await expect(panel(page)).toBeHidden();
  });

  test("stays usable at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await openMenu(page);
    const nav = panel(page);
    await expect(nav).toBeVisible();
    const box = await nav.boundingBox();
    expect(box).not.toBeNull();
    expect((box?.x ?? -1) >= 0 && (box?.x ?? 0) + (box?.width ?? 0) <= 390).toBe(true);
    const journal = nav.getByRole("link", { name: /^Journal/ });
    await journal.scrollIntoViewIfNeeded();
    await journal.click();
    await expect(page).toHaveURL(/\/journal$/);
  });
});

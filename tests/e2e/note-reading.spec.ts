import { expect, test } from "@playwright/test";

const noteUrl = "/note/80%20SOPs/LifeOS%20Owner's%20Operating%20Manual";

test("note chapters support native scrolling, keyboard focus, and narrow screens", async ({ page }, testInfo) => {
  await page.goto(noteUrl);
  const guide = page.locator(".note-reading-guide");
  await expect(guide).toBeVisible();
  await page.getByText("On this page", { exact: false }).first().click();
  const menu = page.getByRole("navigation", { name: "On this page", exact: true });
  await expect(menu).toBeInViewport({ ratio: 1 });
  const links = page.getByRole("navigation", { name: "On this page", exact: true }).getByRole("link");
  expect(await links.count()).toBeGreaterThan(1);
  const last = links.last();
  const fragment = await last.getAttribute("href");
  await last.click();
  await expect(page.locator(fragment!)).toBeFocused();
  await expect(page).toHaveURL(new RegExp(`${fragment}$`));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
  await expect(page.locator(fragment!)).toBeInViewport();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.screenshot({ path: `artifacts/scroll-craft/${testInfo.project.name}-reading.png` });
  await page.getByRole("link", { name: "Back to top", exact: true }).click();
  await expect(page.locator("#note-reader-start")).toBeFocused();
  await expect(guide).toBeVisible();
});

test("reader honors OS, LifeOS, and overload reduced-motion settings", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(noteUrl);
  await expect(page.locator(".note-reading-guide")).toBeVisible();
  await expect(page.locator(".note-reading-progress")).toHaveCSS("display", "none");
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const flag of ["lifeosReducedMotion", "lifeosOverloaded"]) {
    await page.evaluate((key) => { document.documentElement.dataset[key] = "true"; }, flag);
    await expect(page.locator(".note-reading-progress")).toHaveCSS("display", "none");
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
    await page.evaluate((key) => { delete document.documentElement.dataset[key]; }, flag);
  }
  await expect(page.locator(".note-reading-progress")).not.toHaveCSS("display", "none");
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight / 2, behavior: "instant" }));
  await expect(page.locator(".note-reading-progress")).toBeVisible();
});

test("reading guide menu fits a short viewport and remains scrollable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 280 });
  await page.goto(noteUrl);
  await page.getByText("On this page", { exact: false }).first().click();
  const menu = page.getByRole("navigation", { name: "On this page", exact: true });
  await expect(menu).toBeInViewport({ ratio: 1 });
  const bounds = await menu.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.y).toBeGreaterThanOrEqual(8);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(272);
  expect(await menu.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
});


test("short-viewport chapter tracking follows native anchors and scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 280 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(noteUrl);
  const chapters = page.locator(".note-reading-menu a");
  await expect.poll(() => chapters.count()).toBeGreaterThan(2);
  const second = chapters.nth(1);
  const secondFragment = await second.getAttribute("href");
  await page.locator(".note-reading-menu summary").click();
  await second.click();
  await expect(page).toHaveURL(new RegExp(`${secondFragment}$`));
  await expect(page.locator(secondFragment!)).toBeFocused();
  await expect(second).toHaveAttribute("aria-current", "location");

  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await expect(chapters.last()).toHaveAttribute("aria-current", "location");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(chapters.first()).toHaveAttribute("aria-current", "location");
});

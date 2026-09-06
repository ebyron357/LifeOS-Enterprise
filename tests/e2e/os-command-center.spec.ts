import { expect, test } from "@playwright/test";

test.describe("unified command center journeys", () => {
  test("opens LifeOS and shows today's priority within seconds", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Start here" })).toBeVisible();
    await expect(page.getByRole("link", { name: /ask lifeos/i }).first()).toBeVisible();
    const overflow = await page.locator("#main-content").evaluate((node) => node.scrollWidth > node.clientWidth + 1);
    expect(overflow).toBe(false);
  });

  test("resumes a project from Home or Projects", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.getByRole("heading", { name: "Projects", exact: true })).toBeVisible();
    const resume = page.locator("#main-content").getByRole("link", { name: "Resume work" }).first();
    await expect(resume).toBeVisible();
    await resume.click();
    await expect(page).toHaveURL(/\/note\//, { timeout: 15_000 });
  });

  test("captures a note and keeps it in inbox", async ({ page }) => {
    await page.goto("/inbox");
    await page.getByRole("button", { name: /capture something/i }).click();
    await page.getByPlaceholder(/what do you need to remember/i).fill("Call the dentist");
    await page.getByRole("button", { name: /save to inbox/i }).click();
    await expect(page.getByText("Call the dentist")).toBeVisible();
  });

  test("opens today's journal without template placeholders", async ({ page }) => {
    await page.goto("/journal");
    await expect(page.getByRole("heading", { name: /today's journal/i })).toBeVisible();
    await page.getByLabel(/today's journal entry/i).fill("Showed up and wrote.");
    await expect(page.locator("body")).not.toContainText("{{title}}");
  });

  test("opens learning with continue or add", async ({ page }) => {
    await page.goto("/learning");
    await expect(page.getByRole("heading", { name: "Learning", exact: true, level: 1 })).toBeVisible();
    const add = page.getByLabel(/add a learning topic/i);
    await add.fill("Practice Spanish");
    await page.getByRole("button", { name: /add to my queue/i }).click();
    await expect(page.getByText("Practice Spanish")).toBeVisible();
  });

  test("asks LifeOS from the persistent entry point", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /ask lifeos/i }).first().click();
    await expect(page.getByRole("heading", { name: "Conversation", level: 1 })).toBeVisible();
    await page.getByRole("textbox", { name: "Ask LifeOS" }).fill("What needs attention?");
    await page.getByRole("button", { name: /^send$/i }).click();
  });

  test("finds a project and a blocker surface", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Blockers" })).toBeVisible();
  });

  test("inspects integration health without fake connected labels", async ({ page }) => {
    await page.goto("/integrations");
    await expect(page.getByRole("heading", { name: "Integrations" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Hermes" })).toBeVisible();
    await expect(page.getByText(/configured is not connected/i)).toBeVisible();
  });

  test("shows the approval write-secret gate", async ({ page }) => {
    await page.goto("/conversation");
    await expect(page.getByText(/owner write secret/i)).toBeVisible();
    await expect(page.getByText(/voice session tokens cannot authorize/i)).toBeVisible();
  });

  test("navigates home and supports browser history", async ({ page }) => {
    await page.goto("/");
    await page.goto("/journal");
    await expect(page.getByRole("heading", { name: /today's journal/i })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
    await page.goForward();
    await expect(page.getByRole("heading", { name: /today's journal/i })).toBeVisible();
    await page.goto("/");
    await expect(page.getByRole("link", { name: /ask lifeos/i }).first()).toBeVisible();
  });

  test("mobile navigation stays obvious", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const dock = page.getByRole("navigation", { name: "Mobile" });
    await expect(dock).toBeVisible();
    await expect(dock.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(dock.getByRole("link", { name: "Ask LifeOS" })).toBeVisible();
    await expect(dock.getByRole("link", { name: "More" })).toBeVisible();
    await dock.getByRole("link", { name: "More" }).click();
    await expect(page.getByRole("heading", { name: "More" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "More primary destinations" }).getByRole("link", { name: /journal/i })).toBeVisible();
  });

  test("captures visual acceptance screenshots", async ({ page }, testInfo) => {
    const project = testInfo.project.name;
    if (project !== "chromium-desktop-1440" && project !== "chromium-mobile-390") {
      test.skip();
    }
    const prefix = `artifacts/os-rebuild/${project}`;
    const shots = [
      ["/", "command-center"],
      ["/projects", "projects"],
      ["/conversation", "conversation"],
      ["/journal", "journal"],
      ["/learning", "learning"],
      ["/templates", "templates"],
      ["/integrations", "integrations"],
    ] as const;
    for (const [href, name] of shots) {
      await page.goto(href);
      await page.screenshot({ path: `${prefix}-${name}.png`, fullPage: true });
    }
    if (project === "chromium-mobile-390") {
      await page.goto("/");
      await page.screenshot({ path: `${prefix}-navigation.png`, fullPage: true });
    }
  });
});

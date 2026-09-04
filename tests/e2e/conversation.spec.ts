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

  test("mutes by aborting capture and interrupting speech in the UI", async ({ page }) => {
    await page.addInitScript(() => {
      const calls = { abort: 0, stop: 0, start: 0, cancel: 0 };
      (window as Window & { __lifeosRecognition?: typeof calls }).__lifeosRecognition = calls;
      class FakeRecognition {
        lang = "";
        continuous = false;
        interimResults = false;
        onresult = null;
        onerror = null;
        onend = null;
        start() { calls.start += 1; }
        stop() { calls.stop += 1; }
        abort() { calls.abort += 1; }
      }
      Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: FakeRecognition });
      Object.defineProperty(window, "webkitSpeechRecognition", { configurable: true, value: FakeRecognition });
      Object.defineProperty(window.navigator, "mediaDevices", {
        configurable: true,
        value: {
          getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }),
        },
      });
      const speech = window.speechSynthesis;
      if (speech) {
        const originalCancel = speech.cancel.bind(speech);
        speech.cancel = () => {
          calls.cancel += 1;
          originalCancel();
        };
      }
    });

    await page.goto("/conversation");
    await page.getByRole("button", { name: /start conversation/i }).click();
    await expect(page.getByText(/state:\s*listening/i)).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: "Mute microphone", exact: true }).click();
    await expect(page.getByText(/state:\s*muted/i)).toBeVisible();
    const afterMute = await page.evaluate(() => (window as Window & { __lifeosRecognition?: { abort: number } }).__lifeosRecognition?.abort ?? 0);
    expect(afterMute).toBeGreaterThan(0);
    await page.getByRole("button", { name: /interrupt assistant/i }).click();
    await expect(page.getByText(/state:\s*muted/i)).toBeVisible();
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

  test("push-to-talk holds to listen and releases to stop", async ({ page }) => {
    await page.addInitScript(() => {
      const calls = { abort: 0, stop: 0, start: 0 };
      (window as Window & { __lifeosRecognition?: typeof calls }).__lifeosRecognition = calls;
      class FakeRecognition {
        lang = "";
        continuous = false;
        interimResults = false;
        onresult = null;
        onerror = null;
        onend = null;
        start() { calls.start += 1; }
        stop() { calls.stop += 1; }
        abort() { calls.abort += 1; }
      }
      Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: FakeRecognition });
      Object.defineProperty(window, "webkitSpeechRecognition", { configurable: true, value: FakeRecognition });
      Object.defineProperty(window.navigator, "mediaDevices", {
        configurable: true,
        value: {
          getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }),
        },
      });
    });

    await page.goto("/conversation");
    const ptt = page.getByRole("button", { name: "Push to talk", exact: true });
    await ptt.scrollIntoViewIfNeeded();
    await ptt.focus();
    await page.keyboard.down(" ");
    await expect.poll(async () => page.evaluate(() => (window as Window & { __lifeosRecognition?: { start: number } }).__lifeosRecognition?.start ?? 0)).toBeGreaterThan(0);
    await page.keyboard.up(" ");
    await expect.poll(async () => page.evaluate(() => (window as Window & { __lifeosRecognition?: { stop: number } }).__lifeosRecognition?.stop ?? 0)).toBeGreaterThan(0);
  });
});

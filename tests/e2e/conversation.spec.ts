import { expect, test, type Locator, type Page } from "@playwright/test";

type FakeVoice = { voiceURI: string; name: string; lang: string; default?: boolean };

type VoiceTestState = {
  created: number;
  start: number;
  stop: number;
  abort: number;
  cancel: number;
  spoken: Array<{ text: string; lang: string; voice: string | null }>;
};

const FAKE_VOICES: FakeVoice[] = [
  { voiceURI: "us-1", name: "Alpha US", lang: "en-US", default: true },
  { voiceURI: "uk-1", name: "Beta UK (Enhanced Neural Voice With A Deliberately Long Name)", lang: "en-GB" },
  { voiceURI: "fr-1", name: "Amelie", lang: "fr-FR" },
];

const TURN_RESULT = {
  reply: "1 blocked, 0 waiting, 0 reviews due.",
  spokenReply: "1 blocked, 0 waiting, 0 reviews due.",
  state: "idle",
  mission: "Answer from LifeOS context.",
  currentTask: "lifeos.read_attention",
  nextStep: "Ask a follow-up or stop the session.",
  lastCompletedStep: "1 blocked, 0 waiting, 0 reviews due.",
  waitingForOwner: false,
  invocations: [],
  results: [],
  approvals: [],
  activity: [],
  teaching: null,
  evidence: [],
};

/**
 * Installs a fake SpeechRecognition (with emit helpers), a granted microphone,
 * and a recording speechSynthesis whose voices load asynchronously via
 * `voiceschanged`. Plain DOM APIs only, so it runs under Chromium and WebKit.
 */
async function installFakeVoice(page: Page, options: { voices?: FakeVoice[]; voicesDelayMs?: number } = {}) {
  await page.addInitScript((opts: { voices?: FakeVoice[]; voicesDelayMs?: number }) => {
    const state = { created: 0, start: 0, stop: 0, abort: 0, cancel: 0, spoken: [] as Array<{ text: string; lang: string; voice: string | null }> };
    const recognizers: FakeRecognition[] = [];
    const w = window as unknown as Record<string, unknown>;
    w.__voiceTest = state;
    w.__voiceRecognizers = recognizers;

    class FakeRecognition {
      lang = "";
      continuous = false;
      interimResults = false;
      onresult: ((event: unknown) => void) | null = null;
      onerror: ((event: { error: string }) => void) | null = null;
      onend: (() => void) | null = null;
      constructor() {
        state.created += 1;
        recognizers.push(this);
      }
      start() { state.start += 1; }
      stop() { state.stop += 1; }
      abort() { state.abort += 1; }
      emitFinal(text: string) {
        this.onresult?.({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: text } }] });
      }
      emitError(code: string) {
        this.onerror?.({ error: code });
        this.onend?.();
      }
    }
    Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: FakeRecognition });
    Object.defineProperty(window, "webkitSpeechRecognition", { configurable: true, value: FakeRecognition });
    Object.defineProperty(window.navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }) },
    });

    const voices = opts.voices ?? [];
    let loaded = !(opts.voicesDelayMs && opts.voicesDelayMs > 0);
    const listeners = new Set<() => void>();
    class FakeUtterance {
      text: string;
      lang = "";
      rate = 1;
      pitch = 1;
      voice: { name: string } | null = null;
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: ((event: { error: string }) => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }
    const synth = {
      speaking: false,
      pending: false,
      paused: false,
      onvoiceschanged: null,
      getVoices: () => (loaded ? voices.map((voice) => ({ ...voice, localService: true, default: Boolean(voice.default) })) : []),
      speak: (utterance: FakeUtterance) => {
        state.spoken.push({ text: utterance.text, lang: utterance.lang, voice: utterance.voice ? utterance.voice.name : null });
        window.setTimeout(() => utterance.onend?.(), 30);
      },
      cancel: () => { state.cancel += 1; },
      pause() {},
      resume() {},
      addEventListener: (type: string, listener: () => void) => { if (type === "voiceschanged") listeners.add(listener); },
      removeEventListener: (_type: string, listener: () => void) => { listeners.delete(listener); },
    };
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: synth });
    Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, writable: true, value: FakeUtterance });
    if (!loaded) {
      window.setTimeout(() => {
        loaded = true;
        listeners.forEach((listener) => listener());
      }, opts.voicesDelayMs);
    }
  }, options);
}

async function voiceState(page: Page): Promise<VoiceTestState> {
  return page.evaluate(() => (window as unknown as { __voiceTest: VoiceTestState }).__voiceTest);
}

async function emitFinal(page: Page, text: string) {
  await page.evaluate((transcript) => {
    const recognizers = (window as unknown as { __voiceRecognizers: Array<{ emitFinal: (t: string) => void }> }).__voiceRecognizers;
    recognizers[recognizers.length - 1].emitFinal(transcript);
  }, text);
}

async function mockTurn(page: Page, options: { delayMs?: number } = {}) {
  const calls: string[] = [];
  await page.route("**/api/lifeos/agent/turn", async (route) => {
    calls.push(route.request().postData() ?? "");
    if (options.delayMs) await new Promise((resolve) => setTimeout(resolve, options.delayMs));
    try {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, result: TURN_RESULT }) });
    } catch {
      // The client aborted the request (Interrupt / Stop); nothing to fulfill.
    }
  });
  return calls;
}

async function tabTo(page: Page, target: Locator, maxPresses = 8) {
  for (let i = 0; i < maxPresses; i += 1) {
    if (await target.evaluate((element) => element === document.activeElement)) break;
    await page.keyboard.press("Tab");
  }
  await expect(target).toBeFocused();
}

async function settingsPanel(page: Page) {
  const advanced = page.locator("#advanced-settings");
  await expect(advanced).toBeVisible();
  const open = await advanced.evaluate((element) => (element as HTMLDetailsElement).open);
  if (!open) await advanced.getByText("Voice & accessibility settings", { exact: true }).click();
  await expect(advanced).toHaveJSProperty("open", true);
  return page.getByRole("region", { name: "Voice settings" });
}

/** Next.js also renders a (empty) role=alert route announcer, so scope to the Conversation panel. */
function conversationAlert(page: Page) {
  return page.getByRole("region", { name: "Conversation" }).getByRole("alert");
}

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

  test("shows a privacy note before the first microphone start", async ({ page }) => {
    await installFakeVoice(page);
    await page.goto("/conversation");
    const note = page.getByTestId("voice-privacy-note");
    await expect(note).toContainText(/browser or operating system's speech service/);
    await expect(note).toContainText(/sent to OpenAI/);
    await page.getByRole("button", { name: /start conversation/i }).click();
    await expect(page.getByText(/state:\s*listening/i)).toBeVisible();
    await expect(note).toHaveCount(0);
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

  test("restores voice settings controls after reload, even when session metadata fails", async ({ page }) => {
    await installFakeVoice(page, { voices: FAKE_VOICES, voicesDelayMs: 150 });
    await page.goto("/conversation");
    const settings = await settingsPanel(page);
    await settings.getByLabel(/^Provider/).selectOption("browser");
    await settings.getByLabel(/^Locale/).selectOption("en-GB");
    const voiceSelect = settings.getByLabel(/^Voice/);
    await expect(voiceSelect.locator("option")).toHaveCount(2);
    await voiceSelect.selectOption("uk-1");
    await settings.getByLabel(/^Input language/).selectOption("fr-FR");
    await settings.getByLabel(/^Response style/).selectOption("coach");
    await expect.poll(async () => page.evaluate(() => window.localStorage.getItem("lifeos-conversation-voice-settings-v1") || "")).toContain("\"browserVoiceURI\":\"uk-1\"");
    const saved = await page.evaluate(() => window.localStorage.getItem("lifeos-conversation-voice-settings-v1"));

    await page.reload();
    const reloadedSettings = await settingsPanel(page);
    await expect(reloadedSettings.getByLabel(/^Locale/)).toHaveValue("en-GB");
    await expect(reloadedSettings.getByLabel(/^Voice/)).toHaveValue("uk-1");
    await expect(reloadedSettings.getByLabel(/^Input language/)).toHaveValue("fr-FR");
    await expect(reloadedSettings.getByLabel(/^Response style/)).toHaveValue("coach");
    await expect(reloadedSettings.getByLabel(/^Provider/)).toHaveValue("browser");

    // Session metadata failure must not reset or overwrite saved settings.
    await page.route("**/api/lifeos/agent/session", (route) => route.abort());
    await page.reload();
    await expect(conversationAlert(page)).toContainText(/Unable to load agent session metadata/);
    const failedSessionSettings = await settingsPanel(page);
    await expect(failedSessionSettings.getByLabel(/^Locale/)).toHaveValue("en-GB");
    await expect(failedSessionSettings.getByLabel(/^Voice/)).toHaveValue("uk-1");
    await expect(failedSessionSettings.getByLabel(/^Response style/)).toHaveValue("coach");
    expect(await page.evaluate(() => window.localStorage.getItem("lifeos-conversation-voice-settings-v1"))).toBe(saved);
  });

  test("previews with the chosen browser voice and warns when a locale has no installed voice", async ({ page }) => {
    await installFakeVoice(page, { voices: FAKE_VOICES, voicesDelayMs: 100 });
    await page.goto("/conversation");
    const settings = await settingsPanel(page);
    await settings.getByLabel(/^Locale/).selectOption("en-GB");
    await settings.getByLabel(/^Voice/).selectOption("uk-1");
    await settings.getByRole("button", { name: /preview voice/i }).click();
    await expect.poll(async () => (await voiceState(page)).spoken.length).toBe(1);
    const [preview] = (await voiceState(page)).spoken;
    expect(preview.lang).toBe("en-GB");
    expect(preview.voice).toBe(FAKE_VOICES[1].name);
    await expect(page.getByTestId("speech-runtime")).toContainText("Speaking with browser voice (Beta UK");

    await settings.getByLabel(/^Locale/).selectOption("zh-TW");
    await expect(page.getByTestId("no-voice-warning")).toContainText("No installed browser voice matches zh-TW");
    await settings.getByRole("button", { name: /preview voice/i }).click();
    await expect.poll(async () => (await voiceState(page)).spoken.length).toBe(2);
    // Never silently switched to another language.
    expect((await voiceState(page)).spoken[1]).toMatchObject({ lang: "zh-TW", voice: null });
    const overflow = await page.locator("#main-content").evaluate((node) => node.scrollWidth > node.clientWidth + 1);
    expect(overflow).toBe(false);
  });

  for (const control of ["Interrupt assistant", "Stop conversation"] as const) {
    test(`${control} cancels an in-flight turn so no speech starts afterward`, async ({ page }) => {
      await installFakeVoice(page, { voices: FAKE_VOICES });
      const calls = await mockTurn(page, { delayMs: 1500 });
      await page.goto("/conversation");
      await page.getByRole("button", { name: /start conversation/i }).click();
      await expect(page.getByText(/state:\s*listening/i)).toBeVisible();
      await page.getByRole("textbox", { name: "Ask LifeOS" }).fill("What needs attention?");
      await page.getByRole("button", { name: /^send$/i }).click();
      await expect(page.getByText(/state:\s*thinking/i)).toBeVisible();
      expect(calls).toHaveLength(1);
      await page.getByRole("button", { name: control, exact: true }).click();
      await expect(page.getByText(control === "Interrupt assistant" ? /state:\s*listening/i : /state:\s*stopped/i)).toBeVisible();
      // Let the delayed (mocked) reply arrive; it must never be spoken or applied.
      await page.waitForTimeout(2200);
      expect((await voiceState(page)).spoken).toEqual([]);
      await expect(page.getByText(/Answer from LifeOS context/i)).toHaveCount(0);
      await expect(page.getByTestId("speech-runtime")).toContainText("No reply has been spoken yet.");
    });
  }

  test("submits a repeated final transcript only once", async ({ page }) => {
    await installFakeVoice(page, { voices: FAKE_VOICES });
    const calls = await mockTurn(page, { delayMs: 300 });
    await page.goto("/conversation");
    await page.getByRole("button", { name: /start conversation/i }).click();
    await expect(page.getByText(/state:\s*listening/i)).toBeVisible();
    await emitFinal(page, "What needs attention");
    await emitFinal(page, "What needs attention");
    await expect(page.getByText(/Answer from LifeOS context/i)).toBeVisible();
    // Same transcript again right after the reply (within the duplicate window).
    await emitFinal(page, "what needs attention?");
    await expect(page.getByTestId("turn-notice")).toContainText("Ignored a repeated");
    await page.waitForTimeout(500);
    expect(calls).toHaveLength(1);
    expect(JSON.parse(calls[0])).toMatchObject({ text: "What needs attention", channel: "voice", responseStyle: "balanced" });
    await expect.poll(async () => (await voiceState(page)).spoken.length).toBe(1);
    await expect(page.getByTestId("speech-runtime")).toContainText("Speaking with browser voice");
  });

  test("recovers from a recognition error without reloading", async ({ page }) => {
    await installFakeVoice(page);
    await page.goto("/conversation");
    await page.getByRole("button", { name: /start conversation/i }).click();
    await expect(page.getByText(/state:\s*listening/i)).toBeVisible();
    expect((await voiceState(page)).created).toBe(1);
    await page.evaluate(() => {
      const recognizers = (window as unknown as { __voiceRecognizers: Array<{ emitError: (code: string) => void }> }).__voiceRecognizers;
      recognizers[recognizers.length - 1].emitError("network");
    });
    await expect(conversationAlert(page)).toContainText(/speech service could not be reached/);
    await expect(page.getByText(/state:\s*error/i)).toBeVisible();
    // A fatal error must not auto-restart in a loop.
    await page.waitForTimeout(300);
    expect((await voiceState(page)).created).toBe(1);
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByText(/state:\s*listening/i)).toBeVisible();
    await expect(conversationAlert(page)).toHaveCount(0);
    expect((await voiceState(page)).created).toBe(2);
  });

  test("Start and Resume while listening do not abort or restart recognition", async ({ page }) => {
    await installFakeVoice(page);
    await page.goto("/conversation");
    await page.getByRole("button", { name: "Start conversation", exact: true }).click();
    await expect(page.getByText(/state:\s*listening/i)).toBeVisible();
    await page.getByRole("button", { name: "Start conversation", exact: true }).click();
    await page.getByRole("button", { name: "Resume conversation", exact: true }).click();
    await page.waitForTimeout(300);
    let state = await voiceState(page);
    expect(state.created).toBe(1);
    expect(state.abort).toBe(0);
    // A natural end (browser timeout) restarts exactly once — no abort→restart cycle.
    await page.evaluate(() => {
      const recognizers = (window as unknown as { __voiceRecognizers: Array<{ onend: (() => void) | null }> }).__voiceRecognizers;
      recognizers[recognizers.length - 1].onend?.();
    });
    await expect.poll(async () => (await voiceState(page)).created).toBe(2);
    await page.waitForTimeout(300);
    state = await voiceState(page);
    expect(state.created).toBe(2);
    expect(state.abort).toBe(0);
    await expect(page.getByText(/state:\s*listening/i)).toBeVisible();
  });

  test("operates Start and Mute from the keyboard", async ({ page }) => {
    await installFakeVoice(page);
    await page.goto("/conversation");
    await page.locator("#conversation-heading").focus();
    const start = page.getByRole("button", { name: "Start conversation", exact: true });
    await tabTo(page, start);
    await page.keyboard.press("Enter");
    await expect(page.getByText(/state:\s*listening/i)).toBeVisible();
    const mute = page.getByRole("button", { name: "Mute microphone", exact: true });
    await tabTo(page, mute);
    await page.keyboard.press("Enter");
    await expect(page.getByText(/state:\s*muted/i)).toBeVisible();
  });

  test("primary voice controls are touch-sized and readable", async ({ page }) => {
    await page.goto("/conversation");
    for (const name of ["Start conversation", "Stop conversation", "Mute microphone", "Unmute microphone", "Interrupt assistant", "Push to talk"]) {
      const button = page.getByRole("button", { name, exact: true });
      const box = await button.boundingBox();
      expect(box, name).not.toBeNull();
      expect(box!.height, `${name} height`).toBeGreaterThanOrEqual(44);
      const ratio = await button.evaluate((element) => {
        const root = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        return parseFloat(getComputedStyle(element).fontSize) / root;
      });
      expect(ratio, `${name} font size (rem)`).toBeGreaterThanOrEqual(0.95);
    }
    const overflow = await page.locator("#main-content").evaluate((node) => node.scrollWidth > node.clientWidth + 1);
    expect(overflow).toBe(false);
  });

  test("Stop while the microphone permission prompt is open never starts listening afterwards", async ({ page }) => {
    await page.addInitScript(() => {
      const calls = { start: 0, grant: null as null | (() => void) };
      (window as Window & { __lifeosRecognition?: typeof calls }).__lifeosRecognition = calls;
      class FakeRecognition {
        lang = "";
        continuous = false;
        interimResults = false;
        onresult = null;
        onerror = null;
        onend = null;
        start() { calls.start += 1; }
        stop() {}
        abort() {}
      }
      Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: FakeRecognition });
      Object.defineProperty(window, "webkitSpeechRecognition", { configurable: true, value: FakeRecognition });
      Object.defineProperty(window.navigator, "mediaDevices", {
        configurable: true,
        value: {
          // The permission prompt stays open until the test grants it.
          getUserMedia: () => new Promise((resolve) => {
            calls.grant = () => resolve({ getTracks: () => [{ stop() {} }] });
          }),
        },
      });
    });

    await page.goto("/conversation");
    await page.getByRole("button", { name: "Start conversation", exact: true }).click();
    type Calls = { start: number; grant: null | (() => void) };
    await expect.poll(async () => page.evaluate(() => Boolean((window as Window & { __lifeosRecognition?: Calls }).__lifeosRecognition?.grant))).toBe(true);

    await page.getByRole("button", { name: "Stop conversation", exact: true }).click();
    await page.evaluate(() => (window as Window & { __lifeosRecognition?: Calls }).__lifeosRecognition?.grant?.());
    await page.waitForTimeout(500);

    expect(await page.evaluate(() => (window as Window & { __lifeosRecognition?: Calls }).__lifeosRecognition?.start ?? 0)).toBe(0);
    await expect(page.getByText(/state:\s*listening/i)).toHaveCount(0);
  });

  test.describe("iOS Safari without continuous listening", () => {
    test.use({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1" });

    test("runs the recognizer single-utterance and restarts it after each phrase", async ({ page }) => {
      await page.addInitScript(() => {
        const calls = { start: 0, continuousValues: [] as boolean[], instances: [] as Array<{ onend: null | (() => void) }> };
        (window as Window & { __lifeosRecognition?: typeof calls }).__lifeosRecognition = calls;
        class FakeRecognition {
          lang = "";
          continuous = false;
          interimResults = false;
          onresult = null;
          onerror = null;
          onend: null | (() => void) = null;
          start() {
            calls.start += 1;
            calls.continuousValues.push(this.continuous);
            calls.instances.push(this);
          }
          stop() {}
          abort() {}
        }
        Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: FakeRecognition });
        Object.defineProperty(window, "webkitSpeechRecognition", { configurable: true, value: FakeRecognition });
        Object.defineProperty(window.navigator, "mediaDevices", {
          configurable: true,
          value: { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }) },
        });
      });

      await page.goto("/conversation");
      await page.getByRole("button", { name: "Start conversation", exact: true }).click();
      type Calls = { start: number; continuousValues: boolean[]; instances: Array<{ onend: null | (() => void) }> };
      const read = () => page.evaluate(() => {
        const calls = (window as Window & { __lifeosRecognition?: Calls }).__lifeosRecognition!;
        return { start: calls.start, continuousValues: calls.continuousValues };
      });
      await expect.poll(async () => (await read()).start).toBe(1);
      expect((await read()).continuousValues).toEqual([false]);

      // The phrase ends; LifeOS restarts listening itself, again single-utterance.
      await page.evaluate(() => {
        const calls = (window as Window & { __lifeosRecognition?: Calls }).__lifeosRecognition!;
        calls.instances.at(-1)?.onend?.();
      });
      await expect.poll(async () => (await read()).start).toBeGreaterThanOrEqual(2);
      expect((await read()).continuousValues.every((value) => value === false)).toBe(true);
    });
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
    await expect(page.getByText(/state:\s*listening/i)).toBeVisible();
    await page.keyboard.up(" ");
    await expect.poll(async () => page.evaluate(() => (window as Window & { __lifeosRecognition?: { stop: number } }).__lifeosRecognition?.stop ?? 0)).toBeGreaterThan(0);
    await expect(page.getByText(/state:\s*listening/i)).toHaveCount(0);
    await expect(page.getByText(/state:\s*idle/i)).toBeVisible();
  });
});

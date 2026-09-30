import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createOpenAiTtsProvider,
  listTtsProviders,
  PAID_TTS_SECRET_MISSING_REASON,
  selectPreferredTtsProvider,
} from "@/lib/voice/tts-providers";

describe("voice tts providers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("selects openai when the key and a paid-TTS authorization secret are configured", () => {
    const provider = selectPreferredTtsProvider({ OPENAI_API_KEY: "test-key", LIFEOS_TTS_SECRET: "tts-secret" });
    expect(provider.id).toBe("openai");
    expect(provider.configured).toBe(true);
    expect(selectPreferredTtsProvider({ OPENAI_API_KEY: "test-key", LIFEOS_WRITE_SECRET: "write-secret" }).id).toBe("openai");
  });

  it("reports openai as not configured when no paid-TTS authorization secret exists", () => {
    const env = { OPENAI_API_KEY: "test-key" };
    const openai = listTtsProviders(env).find((provider) => provider.id === "openai");
    expect(openai?.configured).toBe(false);
    expect(openai?.reason).toBe(PAID_TTS_SECRET_MISSING_REASON);
    expect(openai?.reason).toMatch(/Paid TTS authorization secret is not set/);
    // Never advertise OpenAI as the active provider when every speak call would 503.
    expect(selectPreferredTtsProvider(env).id).toBe("browser");
  });

  it("reports openai as configured with a reason-free status when both key and secret exist", () => {
    const openai = listTtsProviders({ OPENAI_API_KEY: "test-key", LIFEOS_TTS_SECRET: "tts-secret" })
      .find((provider) => provider.id === "openai");
    expect(openai?.configured).toBe(true);
    expect(openai?.reason).toBeUndefined();
  });

  it("falls back to browser when openai key is missing", () => {
    const provider = selectPreferredTtsProvider({ LIFEOS_TTS_SECRET: "tts-secret" });
    expect(provider.id).toBe("browser");
    const openai = listTtsProviders({ LIFEOS_TTS_SECRET: "tts-secret" }).find((item) => item.id === "openai");
    expect(openai?.reason).toMatch(/OPENAI_API_KEY is missing/);
  });

  it("marks openai provider unavailable without key", async () => {
    const provider = createOpenAiTtsProvider(undefined);
    expect(provider.configured).toBe(false);
    const result = await provider.synthesize({
      text: "hello",
      locale: "en-US",
      speed: 1,
      style: "balanced",
    });
    expect(result.ok).toBe(false);
  });

  it("lists browser fallback as configured", () => {
    const providers = listTtsProviders({});
    const browser = providers.find((provider) => provider.id === "browser");
    expect(browser?.configured).toBe(true);
  });

  it("sends response_format (not format) to OpenAI /v1/audio/speech", async () => {
    const fetchMock = vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: { "content-type": "audio/mpeg" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    const provider = createOpenAiTtsProvider("sk-test", { LIFEOS_TTS_SECRET: "tts-secret" });
    const result = await provider.synthesize({ text: "hello", locale: "en-GB", speed: 1.2, style: "balanced" });
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.openai.com/v1/audio/speech");
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body.response_format).toBe("mp3");
    expect(body).not.toHaveProperty("format");
    expect(body.voice).toBe("verse");
    expect(body.speed).toBe(1.2);
  });

  it("uses the owner-chosen OpenAI voice and keeps the style mapping as the default", async () => {
    const fetchMock = vi.fn(async () => new Response(new Uint8Array([1]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const provider = createOpenAiTtsProvider("sk-test", { LIFEOS_TTS_SECRET: "tts-secret" });
    await provider.synthesize({ text: "hi", locale: "en-US", speed: 1, style: "coach", voice: "nova" });
    await provider.synthesize({ text: "hi", locale: "en-US", speed: 1, style: "coach" });
    await provider.synthesize({ text: "hi", locale: "en-US", speed: 1, style: "concise" });
    const voices = fetchMock.mock.calls.map((call) => JSON.parse(String((call as unknown as [string, RequestInit])[1].body)).voice);
    expect(voices).toEqual(["nova", "sage", "alloy"]);
  });
});

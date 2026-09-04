import { describe, expect, it } from "vitest";
import {
  createOpenAiTtsProvider,
  listTtsProviders,
  selectPreferredTtsProvider,
} from "@/lib/voice/tts-providers";

describe("voice tts providers", () => {
  it("selects openai when configured", () => {
    const provider = selectPreferredTtsProvider({ OPENAI_API_KEY: "test-key" });
    expect(provider.id).toBe("openai");
    expect(provider.configured).toBe(true);
  });

  it("falls back to browser when openai key is missing", () => {
    const provider = selectPreferredTtsProvider({});
    expect(provider.id).toBe("browser");
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
});

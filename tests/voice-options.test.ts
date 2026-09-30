import { describe, expect, it } from "vitest";
import {
  composeSpokenReply,
  CONCISE_SPOKEN_MAX_CHARS,
  defaultOpenAiVoiceForStyle,
  filterVoicesForLocale,
  isOpenAiTtsVoice,
  OPENAI_TTS_VOICES,
  toSpeechLang,
  voiceMatchesLocale,
} from "@/lib/voice/voice-options";

describe("speech locale mapping", () => {
  it("keeps the selected locale's BCP-47 tag instead of collapsing to en-US", () => {
    expect(toSpeechLang("en-GB")).toBe("en-GB");
    expect(toSpeechLang("zh-TW")).toBe("zh-TW");
    expect(toSpeechLang("fr-FR")).toBe("fr-FR");
    expect(toSpeechLang("en-US")).toBe("en-US");
    expect(toSpeechLang("en_gb")).toBe("en-GB");
    expect(toSpeechLang("zh-hant-tw")).toBe("zh-Hant-TW");
  });

  it("keeps historical defaults for bare legacy codes and only falls back for invalid input", () => {
    expect(toSpeechLang("en")).toBe("en-US");
    expect(toSpeechLang("fr")).toBe("fr-FR");
    expect(toSpeechLang("ht")).toBe("ht-HT");
    expect(toSpeechLang("")).toBe("en-US");
    expect(toSpeechLang(undefined)).toBe("en-US");
    expect(toSpeechLang("not a locale!")).toBe("en-US");
  });
});

describe("browser voice filtering", () => {
  const voices = [
    { voiceURI: "a", name: "Alpha US", lang: "en-US" },
    { voiceURI: "b", name: "Beta UK", lang: "en_GB" },
    { voiceURI: "c", name: "Mei-Jia", lang: "zh-Hant-TW" },
    { voiceURI: "d", name: "Amelie", lang: "fr-CA" },
  ];

  it("matches language and region, ignoring script subtags and underscores", () => {
    expect(filterVoicesForLocale(voices, "en-GB").map((voice) => voice.name)).toEqual(["Beta UK"]);
    expect(filterVoicesForLocale(voices, "zh-TW").map((voice) => voice.name)).toEqual(["Mei-Jia"]);
    expect(filterVoicesForLocale(voices, "fr-FR")).toEqual([]);
    expect(voiceMatchesLocale("en-US", "en-GB")).toBe(false);
  });
});

describe("OpenAI voice allowlist", () => {
  it("contains exactly the supported voices and keeps the style mapping as the default", () => {
    expect([...OPENAI_TTS_VOICES]).toEqual(["alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer", "verse"]);
    expect(isOpenAiTtsVoice("verse")).toBe(true);
    expect(isOpenAiTtsVoice("Verse")).toBe(false);
    expect(isOpenAiTtsVoice("evil")).toBe(false);
    expect(defaultOpenAiVoiceForStyle("balanced")).toBe("verse");
    expect(defaultOpenAiVoiceForStyle("concise")).toBe("alloy");
    expect(defaultOpenAiVoiceForStyle("coach")).toBe("sage");
  });
});

describe("spoken reply composer", () => {
  const reply = "1 blocked, 0 waiting, 2 reviews due. LifeOS Enterprise needs a review. Needs you: approve the draft PR.";

  it("speaks only the first sentence for concise and the full reply otherwise", () => {
    expect(composeSpokenReply(reply, "concise")).toBe("1 blocked, 0 waiting, 2 reviews due.");
    expect(composeSpokenReply(reply, "balanced")).toBe(reply);
    expect(composeSpokenReply(reply, "coach")).toBe(reply);
  });

  it("is deterministic, never longer than the source, and caps very long sentences", () => {
    const long = `${"word ".repeat(80).trim()}.`;
    const concise = composeSpokenReply(long, "concise");
    expect(concise.length).toBeLessThanOrEqual(CONCISE_SPOKEN_MAX_CHARS);
    expect(concise.endsWith("…")).toBe(true);
    expect(composeSpokenReply(long, "concise")).toBe(concise);
    expect(composeSpokenReply("Version 1.0 is ready", "concise")).toBe("Version 1.0 is ready");
    expect(composeSpokenReply("", "concise")).toBe("");
  });
});

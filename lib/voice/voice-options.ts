/**
 * Client-safe voice option helpers shared by the conversation UI and the
 * server TTS route. No Node-only imports belong in this module.
 */

/** Voices accepted by OpenAI `/v1/audio/speech` for `gpt-4o-mini-tts`. Server-side allowlist. */
export const OPENAI_TTS_VOICES = [
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "fable",
  "nova",
  "onyx",
  "sage",
  "shimmer",
  "verse",
] as const;

export type OpenAiTtsVoice = (typeof OPENAI_TTS_VOICES)[number];

export function isOpenAiTtsVoice(value: unknown): value is OpenAiTtsVoice {
  return typeof value === "string" && (OPENAI_TTS_VOICES as readonly string[]).includes(value);
}

export const RESPONSE_STYLES = ["balanced", "concise", "coach"] as const;
export type ResponseStyle = (typeof RESPONSE_STYLES)[number];

export function isResponseStyle(value: unknown): value is ResponseStyle {
  return typeof value === "string" && (RESPONSE_STYLES as readonly string[]).includes(value);
}

/** Style → voice mapping used when the owner has not chosen an OpenAI voice. */
export function defaultOpenAiVoiceForStyle(style: ResponseStyle): OpenAiTtsVoice {
  if (style === "coach") return "sage";
  if (style === "concise") return "alloy";
  return "verse";
}

const SHORT_LOCALE_DEFAULTS: Record<string, string> = {
  en: "en-US",
  fr: "fr-FR",
  ht: "ht-HT",
};

/**
 * Converts a LifeOS locale setting into the BCP-47 tag used for speech.
 * Region-specific tags (en-GB, zh-TW, …) are preserved; bare legacy codes
 * (en/fr/ht) keep their historical regional defaults. Only empty or invalid
 * input falls back to en-US.
 */
export function toSpeechLang(locale: string | null | undefined): string {
  const raw = (locale ?? "").trim().replace(/_/g, "-");
  if (!raw) return "en-US";
  const short = SHORT_LOCALE_DEFAULTS[raw.toLowerCase()];
  if (short) return short;
  try {
    const [canonical] = Intl.getCanonicalLocales(raw);
    return canonical || "en-US";
  } catch {
    return "en-US";
  }
}

function localeParts(tag: string): { language: string; region: string | null } {
  const parts = tag.trim().replace(/_/g, "-").toLowerCase().split("-").filter(Boolean);
  const language = parts[0] ?? "";
  const region = parts.slice(1).find((part) => /^[a-z]{2}$/.test(part) || /^\d{3}$/.test(part)) ?? null;
  return { language, region };
}

/**
 * True when an installed voice speaks the requested locale. Language and
 * region must match (script subtags such as zh-Hant-TW are ignored); a
 * locale without a region accepts any voice of that language.
 */
export function voiceMatchesLocale(voiceLang: string, locale: string): boolean {
  const voice = localeParts(voiceLang);
  const wanted = localeParts(toSpeechLang(locale));
  if (!voice.language || voice.language !== wanted.language) return false;
  if (!wanted.region) return true;
  return voice.region === wanted.region;
}

export function filterVoicesForLocale<T extends { lang: string }>(voices: readonly T[], locale: string): T[] {
  return voices.filter((voice) => voiceMatchesLocale(voice.lang, locale));
}

export const CONCISE_SPOKEN_MAX_CHARS = 160;

/**
 * Deterministic spoken-reply composer. `concise` speaks only the first
 * sentence (capped at CONCISE_SPOKEN_MAX_CHARS); other styles speak the full
 * reply. The written reply is never shortened.
 */
export function composeSpokenReply(reply: string, style: ResponseStyle): string {
  if (style !== "concise") return reply;
  const text = reply.replace(/\s+/g, " ").trim();
  if (!text) return text;
  const firstSentence = text.match(/^.*?[.!?]+(?=\s|$)/)?.[0] ?? text;
  if (firstSentence.length <= CONCISE_SPOKEN_MAX_CHARS) return firstSentence;
  const cut = firstSentence.slice(0, CONCISE_SPOKEN_MAX_CHARS - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

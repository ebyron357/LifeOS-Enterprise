import { redactSecrets } from "./security";
import {
  defaultOpenAiVoiceForStyle,
  type OpenAiTtsVoice,
  type ResponseStyle,
} from "./voice-options";

export type TtsProviderId = "openai" | "browser";

export type TtsSynthesisOptions = {
  text: string;
  locale: string;
  speed: number;
  style: ResponseStyle;
  /** Owner-chosen OpenAI voice; already validated against OPENAI_TTS_VOICES. */
  voice?: OpenAiTtsVoice;
};

export type TtsSynthesisResult =
  | { ok: true; provider: TtsProviderId; mimeType: string; audio: Buffer }
  | { ok: false; provider: TtsProviderId; error: string };

export type TtsProvider = {
  id: TtsProviderId;
  configured: boolean;
  reason?: string;
  synthesize: (options: TtsSynthesisOptions) => Promise<TtsSynthesisResult>;
};

const OPENAI_ENDPOINT = "https://api.openai.com/v1/audio/speech";

export const OPENAI_KEY_MISSING_REASON = "OPENAI_API_KEY is missing.";
export const PAID_TTS_SECRET_MISSING_REASON =
  "Paid TTS authorization secret is not set (LIFEOS_TTS_SECRET or LIFEOS_WRITE_SECRET).";

/**
 * Paid TTS can only be authorized when an owner secret exists server-side
 * (see authorizePaidTts). Without one, every /api/lifeos/voice/speak call 503s.
 */
export function paidTtsAuthorizationConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.LIFEOS_TTS_SECRET || env.LIFEOS_WRITE_SECRET);
}

function normalizeRate(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(2, Math.max(0.5, value));
}

/**
 * `configured` is only true when OpenAI can actually be used from the
 * conversation UI: the API key exists AND a paid-TTS authorization secret is
 * set. Synthesis itself only needs the API key (the route authorizes first).
 */
export function createOpenAiTtsProvider(
  apiKey: string | undefined = process.env.OPENAI_API_KEY,
  env: Record<string, string | undefined> = process.env,
): TtsProvider {
  const hasKey = Boolean(apiKey);
  const authorizable = paidTtsAuthorizationConfigured(env);
  const configured = hasKey && authorizable;
  return {
    id: "openai",
    configured,
    reason: !hasKey ? OPENAI_KEY_MISSING_REASON : !authorizable ? PAID_TTS_SECRET_MISSING_REASON : undefined,
    async synthesize(options) {
      if (!apiKey) return { ok: false, provider: "openai", error: OPENAI_KEY_MISSING_REASON };
      try {
        const response = await fetch(OPENAI_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + apiKey,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini-tts",
            voice: options.voice ?? defaultOpenAiVoiceForStyle(options.style),
            input: options.text,
            speed: normalizeRate(options.speed),
            response_format: "mp3",
            instructions: `Speak in ${options.locale}.`,
          }),
        });
        if (!response.ok) {
          const message = await response.text();
          return { ok: false, provider: "openai", error: redactSecrets(message || "OpenAI TTS failed.") };
        }
        const arrayBuffer = await response.arrayBuffer();
        return {
          ok: true,
          provider: "openai",
          mimeType: response.headers.get("content-type") || "audio/mpeg",
          audio: Buffer.from(arrayBuffer),
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "OpenAI TTS failed.";
        return { ok: false, provider: "openai", error: redactSecrets(message) };
      }
    },
  };
}

export function createBrowserFallbackTtsProvider(): TtsProvider {
  return {
    id: "browser",
    configured: true,
    reason: "Browser speech fallback is available client-side.",
    async synthesize() {
      return { ok: false, provider: "browser", error: "Browser fallback must synthesize client-side." };
    },
  };
}

export function listTtsProviders(env: Record<string, string | undefined> = process.env) {
  const openai = createOpenAiTtsProvider(env.OPENAI_API_KEY, env);
  const browser = createBrowserFallbackTtsProvider();
  return [openai, browser];
}

export function selectPreferredTtsProvider(env: Record<string, string | undefined> = process.env): TtsProvider {
  const openai = createOpenAiTtsProvider(env.OPENAI_API_KEY, env);
  if (openai.configured) return openai;
  return createBrowserFallbackTtsProvider();
}

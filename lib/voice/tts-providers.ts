import { redactSecrets } from "./security";

export type TtsProviderId = "openai" | "browser";

export type TtsSynthesisOptions = {
  text: string;
  locale: string;
  speed: number;
  style: "balanced" | "concise" | "coach";
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

function normalizeRate(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(2, Math.max(0.5, value));
}

function resolveOpenAiVoice(style: TtsSynthesisOptions["style"]): string {
  if (style === "coach") return "sage";
  if (style === "concise") return "alloy";
  return "verse";
}

export function createOpenAiTtsProvider(apiKey: string | undefined = process.env.OPENAI_API_KEY): TtsProvider {
  const configured = Boolean(apiKey);
  return {
    id: "openai",
    configured,
    reason: configured ? undefined : "OPENAI_API_KEY is missing.",
    async synthesize(options) {
      if (!apiKey) return { ok: false, provider: "openai", error: "OPENAI_API_KEY is missing." };
      try {
        const response = await fetch(OPENAI_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + apiKey,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini-tts",
            voice: resolveOpenAiVoice(options.style),
            input: options.text,
            speed: normalizeRate(options.speed),
            format: "mp3",
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
  const openai = createOpenAiTtsProvider(env.OPENAI_API_KEY);
  const browser = createBrowserFallbackTtsProvider();
  return [openai, browser];
}

export function selectPreferredTtsProvider(env: Record<string, string | undefined> = process.env): TtsProvider {
  const openai = createOpenAiTtsProvider(env.OPENAI_API_KEY);
  if (openai.configured) return openai;
  return createBrowserFallbackTtsProvider();
}

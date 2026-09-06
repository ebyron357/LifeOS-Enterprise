import { NextResponse } from "next/server";
import { validOrigin } from "@/lib/agent/http";
import { authorizePaidTts, rateLimit, redactSecrets, trustedClientIdentity } from "@/lib/voice/security";
import { createOpenAiTtsProvider, type TtsProviderId } from "@/lib/voice/tts-providers";

export const runtime = "nodejs";

const MAX_TTS_CHARS = 2000;

type SpeakBody = {
  text?: string;
  locale?: string;
  speed?: number;
  style?: "balanced" | "concise" | "coach";
  provider?: TtsProviderId | string;
};

function browserFallback(status: number, error: string) {
  return NextResponse.json({
    ok: false,
    provider: "browser",
    fallbackToBrowser: true,
    error,
  }, { status });
}

export async function POST(request: Request) {
  if (!validOrigin(request)) {
    return NextResponse.json({ ok: false, error: "Origin not allowed." }, { status: 403 });
  }
  if (!rateLimit(`voice-speak:${trustedClientIdentity(request)}`, 30)) {
    return NextResponse.json({ ok: false, error: "Rate limit exceeded." }, { status: 429 });
  }

  let body: SpeakBody;
  try {
    body = await request.json() as SpeakBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const requestedProvider = body.provider;
  if (requestedProvider && requestedProvider !== "browser" && requestedProvider !== "openai") {
    return NextResponse.json({ ok: false, error: "Invalid TTS provider." }, { status: 400 });
  }

  if (requestedProvider === "browser") {
    return browserFallback(503, "Browser speech was requested. Server TTS was not used.");
  }

  const text = body.text?.trim();
  if (!text) return NextResponse.json({ ok: false, error: "text is required." }, { status: 400 });
  if (text.length > MAX_TTS_CHARS) {
    return NextResponse.json({ ok: false, error: "text exceeds the server TTS length limit." }, { status: 413 });
  }

  const auth = authorizePaidTts(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const locale = body.locale?.trim() || "en-US";
  const speed = Number.isFinite(body.speed) ? Number(body.speed) : 1;
  const style = body.style ?? "balanced";
  const provider = createOpenAiTtsProvider();

  if (!provider.configured) {
    return NextResponse.json({
      ok: false,
      provider: "openai",
      fallbackToBrowser: true,
      error: "Server-side TTS is unavailable. Use browser fallback.",
    }, { status: 502 });
  }

  const result = await provider.synthesize({ text, locale, speed, style });
  if (!result.ok) {
    return NextResponse.json({
      ok: false,
      provider: result.provider,
      fallbackToBrowser: true,
      error: redactSecrets(result.error),
    }, { status: 502 });
  }

  return new NextResponse(new Uint8Array(result.audio), {
    status: 200,
    headers: {
      "Content-Type": result.mimeType,
      "Cache-Control": "no-store",
      "X-LifeOS-TTS-Provider": result.provider,
    },
  });
}

export const TTS_MAX_CHARS = MAX_TTS_CHARS;

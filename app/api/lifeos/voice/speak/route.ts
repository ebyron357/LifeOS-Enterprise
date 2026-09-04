import { NextResponse } from "next/server";
import { rateLimit, redactSecrets, verifyVoiceSessionToken } from "@/lib/voice/security";
import { createOpenAiTtsProvider, selectPreferredTtsProvider, type TtsProviderId } from "@/lib/voice/tts-providers";

export const runtime = "nodejs";

type SpeakBody = {
  text?: string;
  locale?: string;
  speed?: number;
  style?: "balanced" | "concise" | "coach";
  provider?: TtsProviderId;
};

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  if (!rateLimit(`voice-speak:${ip}`, 50)) {
    return NextResponse.json({ ok: false, error: "Rate limit exceeded." }, { status: 429 });
  }

  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const sessionRequired = Boolean(process.env.LIFEOS_VOICE_SESSION_SECRET);
  if (sessionRequired && !verifyVoiceSessionToken(token)) {
    return NextResponse.json({ ok: false, error: "Voice session required." }, { status: 401 });
  }

  let body: SpeakBody;
  try {
    body = await request.json() as SpeakBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text) return NextResponse.json({ ok: false, error: "text is required." }, { status: 400 });
  const locale = body.locale?.trim() || "en-US";
  const speed = Number.isFinite(body.speed) ? Number(body.speed) : 1;
  const style = body.style ?? "balanced";

  const provider = body.provider === "openai"
    ? createOpenAiTtsProvider()
    : selectPreferredTtsProvider();

  if (provider.id === "browser") {
    return NextResponse.json({
      ok: false,
      provider: "browser",
      fallbackToBrowser: true,
      error: "Server-side TTS is unavailable. Use browser fallback.",
    }, { status: 503 });
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

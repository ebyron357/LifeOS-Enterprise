import { NextResponse } from "next/server";
import {
  createEphemeralVoiceSessionToken,
  getConfiguredVoiceProvider,
  rateLimit,
  voiceFeatureEnabled,
} from "@/lib/voice/security";

export const runtime = "nodejs";

/**
 * Issues ephemeral voice session metadata.
 * Never returns permanent provider API keys.
 * V1 advertises browser speech only — LiveKit room minting is deferred.
 */
export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  if (!rateLimit(`voice-session:${ip}`, 40)) {
    return NextResponse.json({ ok: false, error: "Rate limit exceeded." }, { status: 429 });
  }

  if (!voiceFeatureEnabled()) {
    return NextResponse.json({
      ok: true,
      configured: false,
      provider: "none",
      reason: "Voice is disabled. Set LIFEOS_VOICE_ENABLED=true to enable browser speech. Written LifeOS interaction remains available.",
      sessionToken: null,
      livekit: null,
    });
  }

  const provider = getConfiguredVoiceProvider();
  if (provider === "none") {
    return NextResponse.json({
      ok: true,
      configured: false,
      provider: "none",
      reason: "Voice browser fallback is disabled. Written LifeOS interaction remains available.",
      sessionToken: null,
      livekit: null,
    });
  }

  const sessionToken = createEphemeralVoiceSessionToken();
  const livekitPresent = Boolean(
    process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET,
  );

  return NextResponse.json({
    ok: true,
    configured: true,
    provider: "browser",
    reason: livekitPresent
      ? "Browser speech is active for V1. LiveKit credentials are present but room-token minting is deferred; realtime transport is not advertised as ready."
      : "Browser speech fallback is active. No permanent provider keys are exposed.",
    sessionToken,
    livekit: livekitPresent
      ? {
          url: process.env.LIVEKIT_URL,
          roomToken: null,
          status: "credentials-present-token-mint-deferred",
        }
      : null,
    localeDefaults: {
      locale: process.env.LIFEOS_VOICE_LOCALE || "en",
      transcriptionLanguage: process.env.LIFEOS_VOICE_TRANSCRIPTION_LANGUAGE || "en",
      responseLanguage: process.env.LIFEOS_VOICE_RESPONSE_LANGUAGE || "en",
    },
  });
}

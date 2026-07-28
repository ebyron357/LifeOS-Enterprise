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
 */
export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  if (!rateLimit(`voice-session:${ip}`, 40)) {
    return NextResponse.json({ ok: false, error: "Rate limit exceeded." }, { status: 429 });
  }

  const provider = getConfiguredVoiceProvider();
  const enabled = voiceFeatureEnabled() || provider === "browser";

  if (!enabled || provider === "none") {
    return NextResponse.json({
      ok: true,
      configured: false,
      provider: "none",
      reason: "Voice is disabled or not configured. Written LifeOS interaction remains available.",
      sessionToken: null,
      livekit: null,
    });
  }

  const sessionToken = createEphemeralVoiceSessionToken();

  // LiveKit room tokens require LIVEKIT_API_KEY/SECRET. We intentionally do not mint
  // provider JWTs here unless all values exist; browser fallback remains the default V1 path.
  const livekitConfigured = Boolean(
    process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET,
  );

  return NextResponse.json({
    ok: true,
    configured: true,
    provider: livekitConfigured ? "livekit" : "browser",
    reason: livekitConfigured
      ? "LiveKit credentials detected. Client must still use short-lived session tokens only."
      : "Browser speech fallback is active. No permanent provider keys are exposed.",
    sessionToken,
    livekit: livekitConfigured
      ? {
          url: process.env.LIVEKIT_URL,
          // Room token minting is reserved for a future authenticated hardener.
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

import { describe, expect, it } from "vitest";
import {
  authorizeVoiceRequest,
  createEphemeralVoiceSessionToken,
  getConfiguredVoiceProvider,
  rateLimit,
  redactSecrets,
  verifyVoiceSessionToken,
  voiceFeatureEnabled,
} from "@/lib/voice/security";

describe("voice security helpers", () => {
  it("defaults to browser provider when fallback is allowed", () => {
    const previous = process.env.LIFEOS_VOICE_BROWSER_FALLBACK;
    process.env.LIFEOS_VOICE_BROWSER_FALLBACK = "true";
    expect(getConfiguredVoiceProvider()).toBe("browser");
    process.env.LIFEOS_VOICE_BROWSER_FALLBACK = previous;
  });

  it("does not treat LiveKit env as a ready V1 provider", () => {
    const previousUrl = process.env.LIVEKIT_URL;
    const previousKey = process.env.LIVEKIT_API_KEY;
    const previousSecret = process.env.LIVEKIT_API_SECRET;
    const previousFallback = process.env.LIFEOS_VOICE_BROWSER_FALLBACK;
    process.env.LIVEKIT_URL = "https://example.livekit.cloud";
    process.env.LIVEKIT_API_KEY = "key";
    process.env.LIVEKIT_API_SECRET = "secret";
    process.env.LIFEOS_VOICE_BROWSER_FALLBACK = "true";
    expect(getConfiguredVoiceProvider()).toBe("browser");
    process.env.LIVEKIT_URL = previousUrl;
    process.env.LIVEKIT_API_KEY = previousKey;
    process.env.LIVEKIT_API_SECRET = previousSecret;
    process.env.LIFEOS_VOICE_BROWSER_FALLBACK = previousFallback;
  });

  it("gates the feature flag explicitly", () => {
    const previous = process.env.LIFEOS_VOICE_ENABLED;
    process.env.LIFEOS_VOICE_ENABLED = "false";
    expect(voiceFeatureEnabled()).toBe(false);
    process.env.LIFEOS_VOICE_ENABLED = "true";
    expect(voiceFeatureEnabled()).toBe(true);
    process.env.LIFEOS_VOICE_ENABLED = previous;
  });

  it("requires write secret for write authorization", () => {
    const previousEnabled = process.env.LIFEOS_WRITE_ENABLED;
    const previousSecret = process.env.LIFEOS_WRITE_SECRET;
    process.env.LIFEOS_WRITE_ENABLED = "true";
    process.env.LIFEOS_WRITE_SECRET = "test-secret";
    const denied = authorizeVoiceRequest(new Request("http://localhost/api", {
      headers: { Authorization: "Bearer wrong" },
    }), { requireWriteSecret: true });
    expect(denied.ok).toBe(false);
    const allowed = authorizeVoiceRequest(new Request("http://localhost/api", {
      headers: { Authorization: "Bearer test-secret" },
    }), { requireWriteSecret: true });
    expect(allowed.ok).toBe(true);
    process.env.LIFEOS_WRITE_ENABLED = previousEnabled;
    process.env.LIFEOS_WRITE_SECRET = previousSecret;
  });

  it("issues and verifies HMAC session tokens", () => {
    const previous = process.env.LIFEOS_VOICE_SESSION_SECRET;
    process.env.LIFEOS_VOICE_SESSION_SECRET = "session-test-secret";
    const now = Date.now();
    const token = createEphemeralVoiceSessionToken(now);
    expect(token).toMatch(/^lifeos-voice\.\d+\.[a-f0-9]+\.[a-f0-9]+$/i);
    expect(verifyVoiceSessionToken(token!, now)).toBe(true);
    expect(verifyVoiceSessionToken("lifeos-voice.forged", now)).toBe(false);
    expect(verifyVoiceSessionToken(token!, now + 3_600_001)).toBe(false);
    const authorized = authorizeVoiceRequest(new Request("http://localhost/api", {
      headers: { Authorization: `Bearer ${token}` },
    }));
    expect(authorized.ok).toBe(true);
    process.env.LIFEOS_VOICE_SESSION_SECRET = previous;
  });

  it("rate limits repeated keys", () => {
    const key = `test-${Date.now()}`;
    expect(rateLimit(key, 2, 60_000)).toBe(true);
    expect(rateLimit(key, 2, 60_000)).toBe(true);
    expect(rateLimit(key, 2, 60_000)).toBe(false);
  });

  it("redacts bearer tokens from log-like strings", () => {
    expect(redactSecrets("Authorization Bearer abc.def.ghi")).toMatch(/\[redacted\]/);
  });
});

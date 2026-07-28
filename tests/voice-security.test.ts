import { describe, expect, it } from "vitest";
import { authorizeVoiceRequest, getConfiguredVoiceProvider, rateLimit, redactSecrets } from "@/lib/voice/security";

describe("voice security helpers", () => {
  it("defaults to browser provider when LiveKit is absent", () => {
    const previous = process.env.LIFEOS_VOICE_BROWSER_FALLBACK;
    process.env.LIFEOS_VOICE_BROWSER_FALLBACK = "true";
    delete process.env.LIVEKIT_URL;
    delete process.env.LIVEKIT_API_KEY;
    delete process.env.LIVEKIT_API_SECRET;
    expect(getConfiguredVoiceProvider()).toBe("browser");
    process.env.LIFEOS_VOICE_BROWSER_FALLBACK = previous;
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

import { createHash, timingSafeEqual } from "node:crypto";

export type VoiceAuthResult =
  | { ok: true; subject: string }
  | { ok: false; status: number; error: string };

const recentHits = new Map<string, number[]>();

export function voiceFeatureEnabled() {
  return process.env.LIFEOS_VOICE_ENABLED === "true";
}

export function getConfiguredVoiceProvider(): "browser" | "livekit" | "none" {
  if (process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET) {
    return "livekit";
  }
  if (process.env.LIFEOS_VOICE_BROWSER_FALLBACK !== "false") {
    return "browser";
  }
  return "none";
}

export function authorizeVoiceRequest(request: Request, opts?: { requireWriteSecret?: boolean }): VoiceAuthResult {
  if (!voiceFeatureEnabled() && opts?.requireWriteSecret) {
    // Write tools still require explicit enablement + secret even if voice UI is available in browser fallback.
  }

  const requireWrite = Boolean(opts?.requireWriteSecret);
  if (requireWrite) {
    if (process.env.LIFEOS_WRITE_ENABLED !== "true") {
      return { ok: false, status: 503, error: "Write service is disabled." };
    }
    const expected = process.env.LIFEOS_WRITE_SECRET;
    if (!expected) return { ok: false, status: 503, error: "Write authorization is not configured." };
    const header = request.headers.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!safeEqual(token, expected)) {
      return { ok: false, status: 401, error: "Unauthorized." };
    }
    return { ok: true, subject: hashSubject(token) };
  }

  // Read tools: optional session bearer when LIFEOS_VOICE_SESSION_SECRET is configured.
  const sessionSecret = process.env.LIFEOS_VOICE_SESSION_SECRET;
  if (!sessionSecret) {
    return { ok: true, subject: "anonymous-local-read" };
  }
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token || !token.startsWith("lifeos-voice.")) {
    return { ok: false, status: 401, error: "Voice session required." };
  }
  return { ok: true, subject: hashSubject(token) };
}

export function rateLimit(key: string, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  const hits = (recentHits.get(key) || []).filter((time) => now - time < windowMs);
  if (hits.length >= limit) return false;
  hits.push(now);
  recentHits.set(key, hits);
  return true;
}

export function hashSubject(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function createEphemeralVoiceSessionToken() {
  const secret = process.env.LIFEOS_VOICE_SESSION_SECRET;
  if (!secret) return null;
  const nonce = createHash("sha256").update(`${secret}:${Date.now()}:${Math.random()}`).digest("hex").slice(0, 24);
  // Opaque session marker only — not a provider API key.
  return `lifeos-voice.${nonce}`;
}

export function redactSecrets(value: string) {
  return value
    .replace(/(Bearer\s+)[^\s]+/gi, "$1[redacted]")
    .replace(/(api[_-]?key|secret|token)(=|:)\s*["']?[^"'\\s]+/gi, "$1$2[redacted]");
}

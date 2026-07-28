import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export type VoiceAuthResult =
  | { ok: true; subject: string }
  | { ok: false; status: number; error: string };

const recentHits = new Map<string, number[]>();
const SESSION_TTL_MS = 60 * 60 * 1000;

export function voiceFeatureEnabled() {
  return process.env.LIFEOS_VOICE_ENABLED === "true";
}

/**
 * V1 ships browser speech only. LiveKit credentials may exist in the environment
 * for a future release, but they must not advertise a ready realtime provider
 * until short-lived room tokens are minted server-side.
 */
export function getConfiguredVoiceProvider(): "browser" | "none" {
  if (process.env.LIFEOS_VOICE_BROWSER_FALLBACK === "false") {
    return "none";
  }
  return "browser";
}

export function authorizeVoiceRequest(request: Request, opts?: { requireWriteSecret?: boolean }): VoiceAuthResult {
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

  // Read tools: optional HMAC session bearer when LIFEOS_VOICE_SESSION_SECRET is configured.
  const sessionSecret = process.env.LIFEOS_VOICE_SESSION_SECRET;
  if (!sessionSecret) {
    return { ok: true, subject: "anonymous-local-read" };
  }
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!verifyVoiceSessionToken(token)) {
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

/**
 * Opaque HMAC-signed session marker. Never a permanent provider API key.
 * Format: lifeos-voice.<expMs>.<nonce>.<hmacSha256Hex>
 */
export function createEphemeralVoiceSessionToken(now = Date.now()) {
  const secret = process.env.LIFEOS_VOICE_SESSION_SECRET;
  if (!secret) return null;
  const exp = now + SESSION_TTL_MS;
  const nonce = randomBytes(16).toString("hex");
  const payload = `${exp}.${nonce}`;
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  return `lifeos-voice.${payload}.${signature}`;
}

export function verifyVoiceSessionToken(token: string, now = Date.now()) {
  const secret = process.env.LIFEOS_VOICE_SESSION_SECRET;
  if (!secret || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "lifeos-voice") return false;
  const exp = Number(parts[1]);
  if (!Number.isFinite(exp) || now > exp) return false;
  const nonce = parts[2];
  if (!nonce || !/^[a-f0-9]+$/i.test(nonce)) return false;
  const payload = `${parts[1]}.${nonce}`;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  return safeEqual(parts[3], expected);
}

export function redactSecrets(value: string) {
  return value
    .replace(/(Bearer\s+)[^\s]+/gi, "$1[redacted]")
    .replace(/(api[_-]?key|secret|token)(=|:)\s*["']?[^"'\\s]+/gi, "$1$2[redacted]");
}

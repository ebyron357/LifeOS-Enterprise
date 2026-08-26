import { rateLimit } from "@/lib/voice/security";

export function validOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const allowed = process.env.LIFEOS_ALLOWED_ORIGIN;
  if (allowed) return origin === allowed;
  try {
    return origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function clientKey(request: Request): string {
  return request.headers.get("x-forwarded-for") || "local";
}

export function withinAgentRateLimit(request: Request, limit = 40): boolean {
  return rateLimit(`agent:${clientKey(request)}`, limit);
}

import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/lifeos/voice/speak/route";

describe("voice speak route", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.OPENAI_API_KEY;
    delete process.env.LIFEOS_VOICE_SESSION_SECRET;
  });

  it("returns browser fallback response when server-side provider is unavailable", async () => {
    const request = new Request("http://localhost/api/lifeos/voice/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "hello world", provider: "openai" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(502);
    const payload = await response.json();
    expect(payload.fallbackToBrowser).toBe(true);
  });

  it("requires session token when voice session secret is configured", async () => {
    process.env.LIFEOS_VOICE_SESSION_SECRET = "secret";
    const request = new Request("http://localhost/api/lifeos/voice/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "hello world", provider: "openai" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});

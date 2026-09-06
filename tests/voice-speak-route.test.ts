import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/lifeos/voice/speak/route";
import { createEphemeralVoiceSessionToken } from "@/lib/voice/security";

function speakRequest(body: Record<string, unknown>, secret?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Origin: "https://lifeos.example",
  };
  if (secret) headers.Authorization = `Bearer ${secret}`;
  return new Request("https://lifeos.example/api/lifeos/voice/speak", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("voice speak route", () => {
  beforeEach(() => {
    vi.stubEnv("LIFEOS_ALLOWED_ORIGIN", "https://lifeos.example");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    delete process.env.OPENAI_API_KEY;
    delete process.env.LIFEOS_VOICE_SESSION_SECRET;
    delete process.env.LIFEOS_TTS_SECRET;
    delete process.env.LIFEOS_WRITE_SECRET;
  });

  it("returns browser fallback immediately when the client selects browser", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    vi.stubEnv("LIFEOS_TTS_SECRET", "tts-secret");
    const response = await POST(speakRequest({ text: "hello world", provider: "browser" }));
    expect(response.status).toBe(503);
    const payload = await response.json();
    expect(payload).toMatchObject({
      provider: "browser",
      fallbackToBrowser: true,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns browser fallback response when authorized OpenAI TTS is unavailable", async () => {
    vi.stubEnv("LIFEOS_TTS_SECRET", "tts-secret");
    const request = speakRequest({ text: "hello world", provider: "openai" }, "tts-secret");
    const response = await POST(request);
    expect(response.status).toBe(502);
    const payload = await response.json();
    expect(payload.fallbackToBrowser).toBe(true);
  });

  it("rejects unauthorized OpenAI requests, including public voice-session tokens", async () => {
    vi.stubEnv("LIFEOS_TTS_SECRET", "tts-secret");
    vi.stubEnv("LIFEOS_VOICE_SESSION_SECRET", "voice-session-secret");
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const anonymous = await POST(speakRequest({ text: "hello world", provider: "openai" }));
    expect(anonymous.status).toBe(401);

    const sessionToken = createEphemeralVoiceSessionToken();
    const session = await POST(speakRequest({ text: "hello world", provider: "openai" }, sessionToken!));
    expect(session.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects oversized OpenAI TTS text before spending a provider request", async () => {
    vi.stubEnv("LIFEOS_TTS_SECRET", "tts-secret");
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(speakRequest({
      text: "x".repeat(2001),
      provider: "openai",
    }, "tts-secret"));
    expect(response.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects invalid TTS providers", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(speakRequest({ text: "hello world", provider: "evil" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: expect.stringMatching(/invalid tts provider/i) });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

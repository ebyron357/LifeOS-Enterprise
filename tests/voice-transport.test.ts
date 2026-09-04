import { afterEach, describe, expect, it, vi } from "vitest";
import { createBrowserVoiceTransport } from "@/lib/voice/provider";

class FakeRecognition {
  lang = "";
  continuous = false;
  interimResults = false;
  onresult: ((event: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  started = false;
  aborted = false;
  stopped = false;

  start() {
    this.started = true;
  }

  stop() {
    this.stopped = true;
    this.onend?.();
  }

  abort() {
    this.aborted = true;
    this.onend?.();
  }
}

describe("browser voice transport mute contract", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("aborts recognition and clears handlers so mute cannot submit a leftover transcript", async () => {
    const recognition = new FakeRecognition();
    class RecognitionCtor {
      constructor() {
        return recognition;
      }
    }
    Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: RecognitionCtor });
    Object.defineProperty(window, "webkitSpeechRecognition", { configurable: true, value: RecognitionCtor });

    const transport = createBrowserVoiceTransport();
    const onFinal = vi.fn();
    await transport.startListening({
      lang: "en-US",
      continuous: true,
      onInterim: vi.fn(),
      onFinal,
      onError: vi.fn(),
      onEnd: vi.fn(),
    });

    transport.stopListening();
    expect(recognition.aborted).toBe(true);
    expect(recognition.onresult).toBeNull();
    expect(recognition.onend).toBeNull();
    recognition.onresult?.({
      resultIndex: 0,
      results: [{ isFinal: true, 0: { transcript: "should not submit" } }],
    });
    expect(onFinal).not.toHaveBeenCalled();
  });
});

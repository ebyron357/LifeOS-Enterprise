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

  it("releaseListening stops recognition without clearing handlers so the last utterance can flush", async () => {
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
      continuous: false,
      onInterim: vi.fn(),
      onFinal,
      onError: vi.fn(),
      onEnd: vi.fn(),
    });

    transport.releaseListening();
    expect(recognition.stopped).toBe(true);
    expect(recognition.onresult).not.toBeNull();
    recognition.onresult?.({
      resultIndex: 0,
      results: [{ isFinal: true, 0: { transcript: "hold to talk" } }],
    });
    expect(onFinal).toHaveBeenCalledWith("hold to talk");
  });
});

class CountingRecognition extends FakeRecognition {
  static created: CountingRecognition[] = [];
  constructor() {
    super();
    CountingRecognition.created.push(this);
  }
}

function installCountingRecognition() {
  CountingRecognition.created = [];
  Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: CountingRecognition });
  Object.defineProperty(window, "webkitSpeechRecognition", { configurable: true, value: CountingRecognition });
}

function listeningHandlers() {
  return { onInterim: vi.fn(), onFinal: vi.fn(), onError: vi.fn(), onEnd: vi.fn() };
}

describe("browser voice transport restart-loop protection", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is idempotent when Start is pressed while already listening with the same settings", async () => {
    installCountingRecognition();
    const transport = createBrowserVoiceTransport();
    const first = listeningHandlers();
    await transport.startListening({ ...first, lang: "en-US", continuous: true });
    expect(transport.isListening()).toBe(true);
    const second = listeningHandlers();
    await transport.startListening({ ...second, lang: "en-US", continuous: true });
    expect(CountingRecognition.created).toHaveLength(1);
    expect(CountingRecognition.created[0].aborted).toBe(false);
    expect(first.onEnd).not.toHaveBeenCalled();
    // Results route to the latest handlers.
    CountingRecognition.created[0].onresult?.({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: "hello" } }] });
    expect(second.onFinal).toHaveBeenCalledWith("hello");
    expect(first.onFinal).not.toHaveBeenCalled();
  });

  it("detaches the old recognizer's handlers before abort so its onend cannot trigger an auto-restart", async () => {
    installCountingRecognition();
    const transport = createBrowserVoiceTransport();
    const first = listeningHandlers();
    await transport.startListening({ ...first, lang: "en-US", continuous: true });
    const old = CountingRecognition.created[0];
    const second = listeningHandlers();
    await transport.startListening({ ...second, lang: "fr-FR", continuous: true });
    expect(old.aborted).toBe(true);
    expect(old.onend).toBeNull();
    expect(old.onresult).toBeNull();
    // FakeRecognition.abort() fires onend synchronously, like an eager browser would; it must be detached first.
    expect(first.onEnd).not.toHaveBeenCalled();
    expect(CountingRecognition.created).toHaveLength(2);
    expect(CountingRecognition.created[1].lang).toBe("fr-FR");
  });

  it("allows a fresh start after the recognizer ends naturally", async () => {
    installCountingRecognition();
    const transport = createBrowserVoiceTransport();
    const handlers = listeningHandlers();
    await transport.startListening({ ...handlers, lang: "en-US", continuous: true });
    CountingRecognition.created[0].onend?.();
    expect(handlers.onEnd).toHaveBeenCalledTimes(1);
    expect(transport.isListening()).toBe(false);
    await transport.startListening({ ...handlers, lang: "en-US", continuous: true });
    expect(CountingRecognition.created).toHaveLength(2);
  });

  it("does not treat a released push-to-talk recognizer as still listening", async () => {
    installCountingRecognition();
    const transport = createBrowserVoiceTransport();
    const handlers = listeningHandlers();
    await transport.startListening({ ...handlers, lang: "en-US", continuous: false });
    CountingRecognition.created[0].stop = function stop(this: CountingRecognition) {
      this.stopped = true;
    };
    transport.releaseListening();
    expect(transport.isListening()).toBe(false);
    await transport.startListening({ ...handlers, lang: "en-US", continuous: false });
    expect(CountingRecognition.created).toHaveLength(2);
  });
});

class FakeUtterance {
  text: string;
  lang = "";
  rate = 1;
  pitch = 1;
  voice: unknown = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: { error?: string }) => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

function installFakeSynthesis(voices: Array<{ voiceURI: string; name: string; lang: string; default?: boolean }>) {
  const spoken: FakeUtterance[] = [];
  vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
  vi.stubGlobal("speechSynthesis", {
    cancel: vi.fn(),
    speak: vi.fn((utterance: FakeUtterance) => {
      spoken.push(utterance);
    }),
    getVoices: () => voices,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  return spoken;
}

describe("browser voice transport speech", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("speaks the selected locale's BCP-47 tag instead of mapping everything to en-US", () => {
    const spoken = installFakeSynthesis([]);
    const transport = createBrowserVoiceTransport();
    for (const lang of ["en-GB", "zh-TW", "fr-FR", "en", "fr", "ht"]) transport.speak("hello", { rate: 1, lang });
    expect(spoken.map((utterance) => utterance.lang)).toEqual(["en-GB", "zh-TW", "fr-FR", "en-US", "fr-FR", "ht-HT"]);
  });

  it("applies the chosen voice only when it speaks the selected locale", () => {
    const voices = [
      { voiceURI: "uk-1", name: "Beta UK", lang: "en-GB" },
      { voiceURI: "us-1", name: "Alpha US", lang: "en-US" },
    ];
    const spoken = installFakeSynthesis(voices);
    const transport = createBrowserVoiceTransport();
    const chosen = transport.speak("hello", { rate: 1, lang: "en-GB", voiceURI: "uk-1" });
    expect(chosen).toMatchObject({ started: true, lang: "en-GB", voiceName: "Beta UK" });
    expect(spoken[0].voice).toBe(voices[0]);
    // A stale voice from another locale is ignored: the language is never silently switched.
    const mismatched = transport.speak("hello", { rate: 1, lang: "en-GB", voiceURI: "us-1" });
    expect(mismatched.voiceName).toBeNull();
    expect(spoken[1].voice).toBeNull();
    expect(spoken[1].lang).toBe("en-GB");
  });

  it("does not report cancel/interrupt as a synthesis failure", () => {
    const spoken = installFakeSynthesis([]);
    const transport = createBrowserVoiceTransport();
    const onError = vi.fn();
    transport.speak("hello", { rate: 1, lang: "en-US", onError });
    spoken[0].onerror?.({ error: "interrupted" });
    spoken[0].onerror?.({ error: "canceled" });
    expect(onError).not.toHaveBeenCalled();
    spoken[0].onerror?.({ error: "synthesis-failed" });
    expect(onError).toHaveBeenCalledWith("Speech synthesis failed.");
  });
});

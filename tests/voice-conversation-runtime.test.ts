import { describe, expect, it } from "vitest";
import {
  classifyRecognitionError,
  createRequestGate,
  createTurnGuard,
  DEFAULT_VOICE_SETTINGS,
  describeCapabilityNotes,
  describeRejectedTurn,
  describeSpeechRuntime,
  detectVoiceCapabilities,
  DUPLICATE_TRANSCRIPT_WINDOW_MS,
  isAbortError,
  normalizeTranscript,
  OWNER_SECRET_MISSING_REASON,
  parseVoiceSettings,
  resolveSpeechProvider,
} from "@/lib/voice/conversation-runtime";

describe("request gate (interrupt / stop / newer reply)", () => {
  it("marks older generations stale and aborts their signals", () => {
    const gate = createRequestGate();
    const first = gate.advance();
    const firstSignal = gate.signalFor(first);
    expect(gate.isCurrent(first)).toBe(true);
    expect(firstSignal.aborted).toBe(false);

    // A newer reply starts a new generation: the older one can never speak.
    const second = gate.advance();
    expect(firstSignal.aborted).toBe(true);
    expect(gate.isCurrent(first)).toBe(false);
    expect(gate.isCurrent(second)).toBe(true);

    // Interrupt / Stop cancels everything in flight.
    const secondSignal = gate.signalFor(second);
    gate.cancel();
    expect(secondSignal.aborted).toBe(true);
    expect(gate.isCurrent(second)).toBe(false);
    // A stale id gets an already-aborted signal.
    expect(gate.signalFor(second).aborted).toBe(true);
  });

  it("drops a delayed response after cancel (simulated in-flight fetch)", async () => {
    const gate = createRequestGate();
    const spoken: string[] = [];
    async function turn(reply: string, delayMs: number) {
      const id = gate.advance();
      const signal = gate.signalFor(id);
      try {
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(resolve, delayMs);
          signal.addEventListener("abort", () => {
            clearTimeout(timer);
            reject(new DOMException("Aborted", "AbortError"));
          });
        });
      } catch (error) {
        expect(isAbortError(error)).toBe(true);
        return;
      }
      if (gate.isCurrent(id)) spoken.push(reply);
    }
    const pending = turn("stale reply", 20);
    gate.cancel();
    await pending;
    await turn("fresh reply", 1);
    expect(spoken).toEqual(["fresh reply"]);
  });
});

describe("turn guard (duplicate / concurrent transcripts)", () => {
  it("rejects a new transcript while a turn is in flight", () => {
    const guard = createTurnGuard();
    const first = guard.tryBegin("What needs attention?", 0);
    expect(first.accepted).toBe(true);
    expect(guard.inFlight).toBe(true);
    expect(guard.tryBegin("Something else", 100)).toEqual({ accepted: false, reason: "in-flight" });
    if (first.accepted) guard.finish(first.id, 500);
    expect(guard.inFlight).toBe(false);
    expect(guard.tryBegin("Something else", 600).accepted).toBe(true);
  });

  it("drops an identical transcript resubmitted within the window, ignoring case and punctuation", () => {
    const guard = createTurnGuard();
    const first = guard.tryBegin("What needs attention?", 1_000);
    if (first.accepted) guard.finish(first.id, 1_200);
    expect(guard.tryBegin("what needs  attention", 2_000)).toEqual({ accepted: false, reason: "duplicate" });
    // The window is measured from the later of submission and reply.
    expect(guard.tryBegin("What needs attention?", 1_200 + DUPLICATE_TRANSCRIPT_WINDOW_MS - 1).accepted).toBe(false);
    expect(guard.tryBegin("What needs attention?", 1_200 + DUPLICATE_TRANSCRIPT_WINDOW_MS).accepted).toBe(true);
  });

  it("ignores stale finish calls and lets the owner resubmit after cancel", () => {
    const guard = createTurnGuard();
    const first = guard.tryBegin("hello", 0);
    guard.cancel();
    expect(guard.inFlight).toBe(false);
    const again = guard.tryBegin("hello", 10);
    expect(again.accepted).toBe(true);
    if (first.accepted) guard.finish(first.id, 20);
    expect(guard.inFlight).toBe(true);
  });

  it("treats blank input as empty and normalizes transcripts", () => {
    expect(createTurnGuard().tryBegin("   ", 0)).toEqual({ accepted: false, reason: "empty" });
    expect(normalizeTranscript("  Hello   World!! ")).toBe("hello world");
    expect(describeRejectedTurn("in-flight", "Next step")).toMatch(/Still working on your last request/);
    expect(describeRejectedTurn("duplicate", "Next step")).toMatch(/Ignored a repeated/);
  });
});

describe("provider truth and runtime indicator", () => {
  const openaiReady = { id: "openai" as const, configured: true, reason: null };

  it("never auto-selects OpenAI: stored settings without a provider use the browser voice", () => {
    expect(parseVoiceSettings(null).provider).toBe("browser");
    expect(parseVoiceSettings(JSON.stringify({ locale: "en-GB" })).provider).toBe("browser");
    expect(parseVoiceSettings(JSON.stringify({ provider: "openai" })).provider).toBe("openai");
  });

  it("does not attempt OpenAI when the server reports it unconfigured", () => {
    const decision = resolveSpeechProvider({
      selected: "openai",
      openai: { id: "openai", configured: false, reason: "Paid TTS authorization secret is not set (LIFEOS_TTS_SECRET or LIFEOS_WRITE_SECRET)." },
      ownerSecretPresent: true,
    });
    expect(decision.provider).toBe("browser");
    expect(decision.fallbackReason).toMatch(/OpenAI unavailable: Paid TTS authorization secret is not set/);
  });

  it("does not attempt OpenAI until the owner types the secret (it is never stored)", () => {
    expect(resolveSpeechProvider({ selected: "openai", openai: openaiReady, ownerSecretPresent: false }))
      .toEqual({ provider: "browser", fallbackReason: OWNER_SECRET_MISSING_REASON });
    expect(resolveSpeechProvider({ selected: "openai", openai: openaiReady, ownerSecretPresent: true }))
      .toEqual({ provider: "openai", fallbackReason: null });
    expect(resolveSpeechProvider({ selected: "browser", openai: openaiReady, ownerSecretPresent: true }))
      .toEqual({ provider: "browser", fallbackReason: null });
    expect(resolveSpeechProvider({ selected: "openai", openai: null, ownerSecretPresent: true }).provider).toBe("browser");
  });

  it("describes the provider actually used and the fallback reason", () => {
    expect(describeSpeechRuntime(null)).toMatch(/No reply has been spoken yet/);
    expect(describeSpeechRuntime({ provider: "openai", voice: "nova", fallbackReason: null })).toBe("Speaking with OpenAI voice (nova).");
    expect(describeSpeechRuntime({ provider: "browser", voice: null, fallbackReason: null })).toBe("Speaking with browser voice (system default).");
    expect(describeSpeechRuntime({ provider: "browser", voice: "Beta UK", fallbackReason: "OpenAI unavailable: Unauthorized." }))
      .toBe("Speaking with browser voice (Beta UK) — OpenAI unavailable: Unauthorized.");
    expect(describeSpeechRuntime({ provider: "none", voice: null, fallbackReason: "Speech synthesis is not supported in this browser." }))
      .toMatch(/text only/);
  });
});

describe("persisted voice settings", () => {
  it("round-trips voice choices and validates them", () => {
    const stored = JSON.stringify({
      ...DEFAULT_VOICE_SETTINGS,
      provider: "openai",
      locale: "en_GB",
      openaiVoice: "coral",
      browserVoiceURI: "uk-voice",
      responseStyle: "concise",
    });
    const parsed = parseVoiceSettings(stored);
    expect(parsed).toMatchObject({ provider: "openai", locale: "en-GB", openaiVoice: "coral", browserVoiceURI: "uk-voice", responseStyle: "concise" });
    expect(parseVoiceSettings(JSON.stringify({ openaiVoice: "evil" })).openaiVoice).toBe("");
    expect(parseVoiceSettings("not json")).toEqual(DEFAULT_VOICE_SETTINGS);
  });

  it("applies server locale defaults only when nothing is stored", () => {
    const defaults = { locale: "fr", transcriptionLanguage: "fr-FR" };
    expect(parseVoiceSettings(null, defaults)).toMatchObject({ locale: "fr-FR", transcriptionLanguage: "fr-FR" });
    expect(parseVoiceSettings(JSON.stringify({ locale: "zh-TW" }), defaults).locale).toBe("zh-TW");
  });
});

describe("capability detection", () => {
  it("detects missing recognition and synthesis", () => {
    const none = detectVoiceCapabilities({ navigator: { userAgent: "Firefox" } });
    expect(none).toEqual({ recognition: false, synthesis: false, continuous: false });
    const notes = describeCapabilityNotes(none);
    expect(notes.join(" ")).toMatch(/Speech recognition isn't supported/);
    expect(notes.join(" ")).toMatch(/Speech synthesis isn't supported/);
  });

  it("flags continuous listening as unsupported on iOS/iPadOS WebKit", () => {
    const iphone = detectVoiceCapabilities({
      webkitSpeechRecognition: function Recognition() {},
      speechSynthesis: {},
      navigator: { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)" },
    });
    expect(iphone).toEqual({ recognition: true, synthesis: true, continuous: false });
    expect(describeCapabilityNotes(iphone).join(" ")).toMatch(/Continuous listening isn't supported/);
    const ipad = detectVoiceCapabilities({
      webkitSpeechRecognition: function Recognition() {},
      speechSynthesis: {},
      navigator: { userAgent: "Mozilla/5.0 (Macintosh)", platform: "MacIntel", maxTouchPoints: 5 },
    });
    expect(ipad.continuous).toBe(false);
  });

  it("reports full support on desktop Chromium", () => {
    const desktop = detectVoiceCapabilities({
      SpeechRecognition: function Recognition() {},
      speechSynthesis: {},
      navigator: { userAgent: "Mozilla/5.0 (X11; Linux x86_64) Chrome/140", platform: "Linux x86_64", maxTouchPoints: 0 },
    });
    expect(desktop).toEqual({ recognition: true, synthesis: true, continuous: true });
    expect(describeCapabilityNotes(desktop)).toEqual([]);
  });
});

describe("recognition error classification", () => {
  it("ignores benign codes and stops auto-restart for everything else", () => {
    expect(classifyRecognitionError("no-speech").kind).toBe("ignore");
    expect(classifyRecognitionError("aborted").kind).toBe("ignore");
    expect(classifyRecognitionError("not-allowed").kind).toBe("permission");
    expect(classifyRecognitionError("network")).toMatchObject({ kind: "fatal", message: expect.stringMatching(/speech service/) });
    expect(classifyRecognitionError("audio-capture").kind).toBe("fatal");
    expect(classifyRecognitionError("bad-grammar").message).toBe("Speech recognition failed (bad-grammar).");
    expect(classifyRecognitionError("Speech recognition is not supported in this browser.").message)
      .toBe("Speech recognition is not supported in this browser.");
  });
});

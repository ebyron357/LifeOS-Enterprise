import { detectVoiceCapabilities, type VoiceCapabilities } from "./conversation-runtime";
import { toSpeechLang, voiceMatchesLocale } from "./voice-options";

export type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

export type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
};

export type SpeakOutcome = {
  started: boolean;
  /** BCP-47 tag the utterance was spoken with. */
  lang: string;
  /** Name of the applied browser voice; null means the browser default. */
  voiceName: string | null;
  error?: string;
};

type ListeningHandlers = {
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (message: string) => void;
  onEnd: () => void;
};

export type VoiceTransport = {
  id: "browser";
  requestPermission: () => Promise<boolean>;
  startListening: (handlers: ListeningHandlers & {
    lang: string;
    continuous?: boolean;
  }) => Promise<void>;
  /** True while a recognizer is running and has not been released. */
  isListening: () => boolean;
  stopListening: () => void;
  releaseListening: () => void;
  speak: (text: string, opts: {
    rate: number;
    pitch?: number;
    lang: string;
    /** SpeechSynthesisVoice.voiceURI to use; ignored unless it speaks `lang`. */
    voiceURI?: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (message: string) => void;
  }) => SpeakOutcome;
  stopSpeaking: () => void;
  disconnect: () => void;
};

type RecognitionWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as RecognitionWindow;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

function detachRecognition(target: SpeechRecognitionLike) {
  target.onresult = null;
  target.onerror = null;
  target.onend = null;
}

function findBrowserVoice(voiceURI: string, lang: string): SpeechSynthesisVoice | null {
  try {
    const voices = window.speechSynthesis.getVoices() ?? [];
    return voices.find((voice) => (voice.voiceURI || voice.name) === voiceURI && voiceMatchesLocale(voice.lang, lang)) ?? null;
  } catch {
    return null;
  }
}

export function createBrowserVoiceTransport(): VoiceTransport {
  let recognition: SpeechRecognitionLike | null = null;
  /** Per-recognizer state; handlers live here so a released recognizer can still flush its last result. */
  let active: { lang: string; continuous: boolean; stopping: boolean; handlers: ListeningHandlers } | null = null;

  /** Detach handlers BEFORE aborting so the old recognizer's onend cannot trigger an auto-restart. */
  function abortCurrent() {
    const current = recognition;
    recognition = null;
    active = null;
    if (!current) return;
    detachRecognition(current);
    try {
      current.abort();
    } catch {
      try {
        current.stop();
      } catch {
        // Already stopped.
      }
    }
  }

  return {
    id: "browser",
    async requestPermission() {
      if (!navigator.mediaDevices?.getUserMedia) return false;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        return true;
      } catch {
        return false;
      }
    },
    async startListening({ onInterim, onFinal, onError, onEnd, lang, continuous = false }) {
      const Ctor = getRecognitionCtor();
      if (!Ctor) {
        onError("Speech recognition is not supported in this browser.");
        return;
      }
      const nextHandlers: ListeningHandlers = { onInterim, onFinal, onError, onEnd };
      if (recognition && active && !active.stopping && active.lang === lang && active.continuous === continuous) {
        // Already listening with this configuration: stay idempotent (no abort → no restart loop),
        // but route results to the latest handlers.
        active.handlers = nextHandlers;
        return;
      }
      abortCurrent();
      const next = new Ctor();
      const slot = { lang, continuous, stopping: false, handlers: nextHandlers };
      recognition = next;
      active = slot;
      next.lang = lang;
      next.continuous = continuous;
      next.interimResults = true;
      next.onresult = (event) => {
        let interim = "";
        let finalText = "";
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          if (result.isFinal) finalText += result[0].transcript;
          else interim += result[0].transcript;
        }
        if (interim) slot.handlers.onInterim(interim.trim());
        if (finalText) slot.handlers.onFinal(finalText.trim());
      };
      next.onerror = (event) => slot.handlers.onError(event.error || "Recognition failed.");
      next.onend = () => {
        if (recognition === next) {
          recognition = null;
          active = null;
        }
        slot.handlers.onEnd();
      };
      try {
        next.start();
      } catch (error) {
        abortCurrent();
        onError(error instanceof Error && error.message ? error.message : "Speech recognition could not start.");
      }
    },
    isListening() {
      return Boolean(recognition && active && !active.stopping);
    },
    stopListening() {
      abortCurrent();
    },
    releaseListening() {
      if (!recognition) return;
      if (active) active.stopping = true;
      try {
        recognition.stop();
      } catch {
        abortCurrent();
      }
    },
    speak(text, opts) {
      const lang = toSpeechLang(opts.lang);
      if (typeof window === "undefined" || !("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
        const error = "Speech synthesis is not supported in this browser.";
        opts.onError?.(error);
        return { started: false, lang, voiceName: null, error };
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = opts.rate;
      if (typeof opts.pitch === "number" && Number.isFinite(opts.pitch)) utterance.pitch = opts.pitch;
      // Always speak the selected locale's BCP-47 tag; never silently switch language.
      utterance.lang = lang;
      const voice = opts.voiceURI ? findBrowserVoice(opts.voiceURI, lang) : null;
      if (voice) utterance.voice = voice;
      utterance.onstart = () => opts.onStart?.();
      utterance.onend = () => opts.onEnd?.();
      utterance.onerror = (event) => {
        const code = (event as { error?: string } | undefined)?.error;
        // cancel() (Interrupt, Stop, or a newer reply) is not a synthesis failure.
        if (code === "interrupted" || code === "canceled") return;
        opts.onError?.("Speech synthesis failed.");
      };
      window.speechSynthesis.speak(utterance);
      return { started: true, lang, voiceName: voice?.name ?? null };
    },
    stopSpeaking() {
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    },
    disconnect() {
      this.stopListening();
      this.stopSpeaking();
    },
  };
}

/**
 * V1 always uses browser speech. LiveKit remains a documented future transport.
 */
export function selectVoiceTransport(provider: "browser" | "openai" | "livekit" | "none"): VoiceTransport | null {
  if (provider === "none") return null;
  return createBrowserVoiceTransport();
}

/* ------------------------------------------------------------------ */
/* Browser voices (external store for useSyncExternalStore)            */
/* ------------------------------------------------------------------ */

export type BrowserVoiceOption = { voiceURI: string; name: string; lang: string; isDefault: boolean };
export type BrowserVoicesSnapshot = { loaded: boolean; voices: BrowserVoiceOption[] };

const EMPTY_VOICES: BrowserVoicesSnapshot = { loaded: false, voices: [] };
let cachedVoices: BrowserVoicesSnapshot = EMPTY_VOICES;
let cachedVoicesKey = "";
let voicesEventSeen = false;

/** Stable snapshot of speechSynthesis.getVoices(); `loaded` flips after voiceschanged or a non-empty list. */
export function getBrowserVoicesSnapshot(): BrowserVoicesSnapshot {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return EMPTY_VOICES;
  let list: SpeechSynthesisVoice[] = [];
  try {
    list = Array.from(window.speechSynthesis.getVoices?.() ?? []);
  } catch {
    list = [];
  }
  const voices = list.map((voice) => ({
    voiceURI: voice.voiceURI || voice.name,
    name: voice.name,
    lang: voice.lang,
    isDefault: Boolean(voice.default),
  }));
  const loaded = voices.length > 0 || voicesEventSeen;
  const key = `${loaded ? 1 : 0}|${voices.map((voice) => `${voice.voiceURI}\u0000${voice.lang}\u0000${voice.name}`).join("\u0001")}`;
  if (key !== cachedVoicesKey) {
    cachedVoicesKey = key;
    cachedVoices = { loaded, voices };
  }
  return cachedVoices;
}

export function getServerBrowserVoicesSnapshot(): BrowserVoicesSnapshot {
  return EMPTY_VOICES;
}

/** Subscribes to the async `voiceschanged` event (Chrome loads voices after first paint). */
export function subscribeBrowserVoices(listener: () => void): () => void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return () => {};
  const synth = window.speechSynthesis;
  const onChange = () => {
    voicesEventSeen = true;
    listener();
  };
  if (typeof synth.addEventListener === "function") {
    synth.addEventListener("voiceschanged", onChange);
    return () => synth.removeEventListener("voiceschanged", onChange);
  }
  return () => {};
}

/* ------------------------------------------------------------------ */
/* Capabilities (external store; computed on the client only)          */
/* ------------------------------------------------------------------ */

let cachedCapabilities: VoiceCapabilities | null = null;

export function getVoiceCapabilitiesSnapshot(): VoiceCapabilities | null {
  if (typeof window === "undefined") return null;
  const next = detectVoiceCapabilities(window as unknown as Parameters<typeof detectVoiceCapabilities>[0]);
  if (
    !cachedCapabilities
    || cachedCapabilities.recognition !== next.recognition
    || cachedCapabilities.synthesis !== next.synthesis
    || cachedCapabilities.continuous !== next.continuous
  ) {
    cachedCapabilities = next;
  }
  return cachedCapabilities;
}

export function getServerVoiceCapabilitiesSnapshot(): VoiceCapabilities | null {
  return null;
}

export function subscribeVoiceCapabilities(): () => void {
  return () => {};
}

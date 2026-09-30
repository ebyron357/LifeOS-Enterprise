/**
 * Pure, client-safe runtime helpers for the /conversation voice UI:
 * cancellation gates, duplicate-turn protection, provider truth, persisted
 * settings parsing, capability detection, and recognition error mapping.
 */
import type { TtsProviderId } from "./tts-providers";
import {
  isOpenAiTtsVoice,
  isResponseStyle,
  toSpeechLang,
  type OpenAiTtsVoice,
  type ResponseStyle,
} from "./voice-options";

/* ------------------------------------------------------------------ */
/* Cancellation gate                                                   */
/* ------------------------------------------------------------------ */

export type RequestGate = {
  /** Current generation id. */
  readonly generation: number;
  /** Cancels all older work and returns the new generation id. */
  advance: () => number;
  /** Cancels all in-flight work (Interrupt, Stop, Mute). */
  cancel: () => void;
  isCurrent: (id: number) => boolean;
  /** AbortSignal bound to `id`; already aborted when `id` is stale. */
  signalFor: (id: number) => AbortSignal;
};

/**
 * Monotonic generation counter plus AbortControllers. Any response that
 * arrives for an older generation must be dropped, never spoken.
 */
export function createRequestGate(): RequestGate {
  let generation = 0;
  let controllers: AbortController[] = [];
  function cancel() {
    generation += 1;
    const pending = controllers;
    controllers = [];
    for (const controller of pending) controller.abort();
  }
  return {
    get generation() {
      return generation;
    },
    advance() {
      cancel();
      return generation;
    },
    cancel,
    isCurrent(id) {
      return id === generation;
    },
    signalFor(id) {
      const controller = new AbortController();
      if (id !== generation) controller.abort();
      else controllers.push(controller);
      return controller.signal;
    },
  };
}

export function isAbortError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && (error as { name?: unknown }).name === "AbortError");
}

/* ------------------------------------------------------------------ */
/* Duplicate / concurrent turn protection                              */
/* ------------------------------------------------------------------ */

export const DUPLICATE_TRANSCRIPT_WINDOW_MS = 3000;

export function normalizeTranscript(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ").replace(/[\s.!?,;:]+$/, "");
}

export type TurnDecision =
  | { accepted: true; id: number; normalized: string }
  | { accepted: false; reason: "empty" | "in-flight" | "duplicate" };

export type TurnGuard = {
  tryBegin: (text: string, nowMs: number) => TurnDecision;
  /** Marks turn `id` complete; no-op for stale ids. */
  finish: (id: number, nowMs: number) => void;
  /** Owner cancelled (Interrupt/Stop): clears in-flight and duplicate memory. */
  cancel: () => void;
  readonly inFlight: boolean;
};

/**
 * One turn at a time. While a turn is in flight new transcripts are
 * rejected (the UI shows a note); an identical transcript within
 * `windowMs` of the last submission or reply is dropped.
 */
export function createTurnGuard(windowMs = DUPLICATE_TRANSCRIPT_WINDOW_MS): TurnGuard {
  let nextId = 0;
  let current: number | null = null;
  let lastText: string | null = null;
  let lastAt = Number.NEGATIVE_INFINITY;
  return {
    tryBegin(text, nowMs) {
      const normalized = normalizeTranscript(text);
      if (!normalized) return { accepted: false, reason: "empty" };
      if (current !== null) return { accepted: false, reason: "in-flight" };
      if (lastText === normalized && nowMs - lastAt < windowMs) return { accepted: false, reason: "duplicate" };
      nextId += 1;
      current = nextId;
      lastText = normalized;
      lastAt = nowMs;
      return { accepted: true, id: nextId, normalized };
    },
    finish(id, nowMs) {
      if (current !== id) return;
      current = null;
      lastAt = Math.max(lastAt, nowMs);
    },
    cancel() {
      current = null;
      lastText = null;
      lastAt = Number.NEGATIVE_INFINITY;
    },
    get inFlight() {
      return current !== null;
    },
  };
}

export function describeRejectedTurn(reason: "in-flight" | "duplicate", text: string): string {
  const quoted = text.trim().length > 80 ? `${text.trim().slice(0, 77)}…` : text.trim();
  if (reason === "in-flight") {
    return `Still working on your last request, so “${quoted}” was not sent. Say or send it again after LifeOS replies.`;
  }
  return `Ignored a repeated “${quoted}” (same request within ${Math.round(DUPLICATE_TRANSCRIPT_WINDOW_MS / 1000)} seconds).`;
}

/* ------------------------------------------------------------------ */
/* Provider truth                                                      */
/* ------------------------------------------------------------------ */

export type TtsProviderStatus = { id: TtsProviderId; configured: boolean; reason: string | null };

export type SpeechProviderDecision = { provider: TtsProviderId; fallbackReason: string | null };

export const OWNER_SECRET_MISSING_REASON =
  "OpenAI unavailable: enter the owner secret (LIFEOS_TTS_SECRET or LIFEOS_WRITE_SECRET) in the Agent panel.";

/**
 * Decides which provider will speak the next reply. Paid OpenAI TTS is only
 * attempted when the server reports it configured AND the owner typed a
 * secret this session (it is never stored, so it cannot be auto-selected).
 */
export function resolveSpeechProvider(input: {
  selected: TtsProviderId;
  openai: TtsProviderStatus | null;
  ownerSecretPresent: boolean;
}): SpeechProviderDecision {
  if (input.selected !== "openai") return { provider: "browser", fallbackReason: null };
  if (!input.openai?.configured) {
    return {
      provider: "browser",
      fallbackReason: `OpenAI unavailable: ${input.openai?.reason || "the server did not report OpenAI voice as configured."}`,
    };
  }
  if (!input.ownerSecretPresent) return { provider: "browser", fallbackReason: OWNER_SECRET_MISSING_REASON };
  return { provider: "openai", fallbackReason: null };
}

export type SpeechRuntime = {
  provider: TtsProviderId | "none";
  voice: string | null;
  fallbackReason: string | null;
};

/** Visible, aria-live description of what actually spoke the last reply. */
export function describeSpeechRuntime(runtime: SpeechRuntime | null): string {
  if (!runtime) return "No reply has been spoken yet.";
  if (runtime.provider === "none") {
    return `Reply shown as text only — ${runtime.fallbackReason || "speech synthesis is unavailable."}`;
  }
  if (runtime.provider === "openai") return `Speaking with OpenAI voice (${runtime.voice || "default"}).`;
  const voice = runtime.voice ? ` (${runtime.voice})` : " (system default)";
  if (runtime.fallbackReason) return `Speaking with browser voice${voice} — ${runtime.fallbackReason}`;
  return `Speaking with browser voice${voice}.`;
}

/* ------------------------------------------------------------------ */
/* Persisted voice settings                                            */
/* ------------------------------------------------------------------ */

export type VoiceSettings = {
  provider: TtsProviderId;
  locale: string;
  transcriptionLanguage: string;
  speechRate: number;
  pitch: number;
  responseStyle: ResponseStyle;
  /** Browser SpeechSynthesisVoice.voiceURI; "" means system default. */
  browserVoiceURI: string;
  /** OpenAI voice; "" means the response-style default. */
  openaiVoice: OpenAiTtsVoice | "";
};

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  provider: "browser",
  locale: "en-US",
  transcriptionLanguage: "en-US",
  speechRate: 1,
  pitch: 1,
  responseStyle: "balanced",
  browserVoiceURI: "",
  openaiVoice: "",
};

function clampNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0.5, Math.min(2, value)) : fallback;
}

/**
 * Parses stored settings. The provider is never auto-selected: OpenAI is
 * only used when the owner explicitly chose it. `defaults` (server locale
 * defaults) only apply when nothing has been stored yet.
 */
export function parseVoiceSettings(
  raw: string | null,
  defaults?: { locale?: string | null; transcriptionLanguage?: string | null } | null,
): VoiceSettings {
  const base: VoiceSettings = {
    ...DEFAULT_VOICE_SETTINGS,
    locale: defaults?.locale ? toSpeechLang(defaults.locale) : DEFAULT_VOICE_SETTINGS.locale,
    transcriptionLanguage: defaults?.transcriptionLanguage
      ? toSpeechLang(defaults.transcriptionLanguage)
      : DEFAULT_VOICE_SETTINGS.transcriptionLanguage,
  };
  if (!raw) return base;
  let parsed: Partial<Record<keyof VoiceSettings, unknown>>;
  try {
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== "object") return DEFAULT_VOICE_SETTINGS;
    parsed = value as Partial<Record<keyof VoiceSettings, unknown>>;
  } catch {
    return DEFAULT_VOICE_SETTINGS;
  }
  return {
    provider: parsed.provider === "openai" ? "openai" : "browser",
    locale: typeof parsed.locale === "string" && parsed.locale.trim() ? toSpeechLang(parsed.locale) : DEFAULT_VOICE_SETTINGS.locale,
    transcriptionLanguage: typeof parsed.transcriptionLanguage === "string" && parsed.transcriptionLanguage.trim()
      ? toSpeechLang(parsed.transcriptionLanguage)
      : DEFAULT_VOICE_SETTINGS.transcriptionLanguage,
    speechRate: clampNumber(parsed.speechRate, 1),
    pitch: clampNumber(parsed.pitch, 1),
    responseStyle: isResponseStyle(parsed.responseStyle) ? parsed.responseStyle : "balanced",
    browserVoiceURI: typeof parsed.browserVoiceURI === "string" ? parsed.browserVoiceURI.slice(0, 500) : "",
    openaiVoice: isOpenAiTtsVoice(parsed.openaiVoice) ? parsed.openaiVoice : "",
  };
}

/* ------------------------------------------------------------------ */
/* Capability detection                                                */
/* ------------------------------------------------------------------ */

export type VoiceCapabilities = {
  recognition: boolean;
  synthesis: boolean;
  /** Continuous recognition is reliable (not iOS/iPadOS WebKit). */
  continuous: boolean;
};

type CapabilityWindow = {
  SpeechRecognition?: unknown;
  webkitSpeechRecognition?: unknown;
  speechSynthesis?: unknown;
  navigator?: { userAgent?: string; platform?: string; maxTouchPoints?: number };
};

export function detectVoiceCapabilities(win: CapabilityWindow | undefined | null): VoiceCapabilities {
  if (!win) return { recognition: false, synthesis: false, continuous: false };
  const recognition = Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
  const synthesis = Boolean(win.speechSynthesis);
  const ua = win.navigator?.userAgent ?? "";
  const appleMobile = /iPad|iPhone|iPod/.test(ua)
    || (win.navigator?.platform === "MacIntel" && (win.navigator?.maxTouchPoints ?? 0) > 1);
  return { recognition, synthesis, continuous: recognition && !appleMobile };
}

export function describeCapabilityNotes(capabilities: VoiceCapabilities): string[] {
  const notes: string[] = [];
  if (!capabilities.recognition) {
    notes.push("Speech recognition isn't supported in this browser. Type your request in Ask LifeOS instead; replies can still be spoken.");
  } else if (!capabilities.continuous) {
    notes.push("Continuous listening isn't supported in this browser. LifeOS restarts listening after each phrase; use Push to talk if it stops responding.");
  }
  if (!capabilities.synthesis) {
    notes.push("Speech synthesis isn't supported in this browser. Replies are shown as text only unless OpenAI voice is configured.");
  }
  return notes;
}

/* ------------------------------------------------------------------ */
/* Recognition errors                                                  */
/* ------------------------------------------------------------------ */

export type RecognitionErrorKind = "ignore" | "permission" | "fatal";

/**
 * Maps Web Speech `error` codes. `no-speech`/`aborted` are benign (the
 * recognizer ends and continuous mode restarts). Everything else stops
 * auto-restart so a persistent failure cannot loop; the owner recovers with
 * "Try again".
 */
export function classifyRecognitionError(code: string): { kind: RecognitionErrorKind; message: string } {
  const normalized = code.trim().toLowerCase();
  if (normalized === "no-speech" || normalized === "aborted") return { kind: "ignore", message: "" };
  if (normalized === "not-allowed" || normalized === "service-not-allowed") {
    return { kind: "permission", message: "Microphone permission was denied." };
  }
  if (normalized === "audio-capture") return { kind: "fatal", message: "No microphone was found or it is in use by another app." };
  if (normalized === "network") {
    return { kind: "fatal", message: "Speech recognition failed: the browser's speech service could not be reached." };
  }
  if (normalized === "language-not-supported") {
    return { kind: "fatal", message: "Speech recognition does not support the selected input language in this browser." };
  }
  if (!normalized) return { kind: "fatal", message: "Speech recognition failed." };
  // Transport messages (already sentences) pass through; bare codes are labelled.
  if (!/^[a-z-]+$/.test(normalized)) return { kind: "fatal", message: code.trim() };
  return { kind: "fatal", message: `Speech recognition failed (${normalized}).` };
}

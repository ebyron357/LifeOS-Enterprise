/**
 * localStorage-backed store for /conversation voice settings, read through
 * useSyncExternalStore so persisted settings hydrate on mount independently of
 * any network request, and defaults are never written over saved settings.
 */
import type { VoiceSettings } from "./conversation-runtime";

export const VOICE_SETTINGS_KEY = "lifeos-conversation-voice-settings-v1";

const listeners = new Set<() => void>();
/** In-memory copy used when storage is unavailable (private mode, blocked site data). */
let memoryValue: string | null = null;
let lastWriteFailed = false;

export function readStoredVoiceSettingsRaw(): string | null {
  if (typeof window === "undefined") return null;
  if (lastWriteFailed) return memoryValue;
  try {
    return window.localStorage.getItem(VOICE_SETTINGS_KEY);
  } catch {
    return memoryValue;
  }
}

/** Server render has no storage; the client re-renders with the stored value after hydration. */
export function readServerVoiceSettingsRaw(): string | null {
  return null;
}

/** Shown when settings could not be written to browser storage. */
export const VOICE_SETTINGS_NOT_SAVED =
  "Voice settings could not be saved in this browser (private mode, full, or blocked storage). They apply until you reload or close this page.";

/** Null while persistence is healthy; a warning after the last write failed. */
export function readVoiceSettingsWriteError(): string | null {
  return lastWriteFailed ? VOICE_SETTINGS_NOT_SAVED : null;
}

export function readServerVoiceSettingsWriteError(): string | null {
  return null;
}

export function writeStoredVoiceSettings(settings: VoiceSettings): void {
  const raw = JSON.stringify(settings);
  memoryValue = raw;
  try {
    window.localStorage.setItem(VOICE_SETTINGS_KEY, raw);
    lastWriteFailed = false;
  } catch {
    // Storage unavailable: keep the in-memory copy for this page session and report it.
    lastWriteFailed = true;
  }
  for (const listener of listeners) listener();
}

export function subscribeStoredVoiceSettings(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === VOICE_SETTINGS_KEY) listener();
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

/** Test helper: forget the in-memory fallback copy. */
export function resetVoiceSettingsMemoryForTests(): void {
  memoryValue = null;
  lastWriteFailed = false;
}

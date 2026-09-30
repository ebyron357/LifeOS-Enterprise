export type ConversationVoiceState =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "muted"
  | "error"
  | "permission-denied"
  | "stopped";

export type ConversationVoiceMode = "conversation" | "push-to-talk";

export type ConversationVoiceSession = {
  state: ConversationVoiceState;
  mode: ConversationVoiceMode;
  startedAt: string | null;
  durationMs: number;
  microphoneOpen: boolean;
  muted: boolean;
  speaking: boolean;
  processing: boolean;
  connection: "disconnected" | "connecting" | "connected" | "error";
  error: string | null;
  transcriptVisible: boolean;
  transcriptPrivacy: "ephemeral" | "hidden";
  recordingAudio: false;
};

export const INITIAL_CONVERSATION_VOICE: ConversationVoiceSession = {
  state: "idle",
  mode: "conversation",
  startedAt: null,
  durationMs: 0,
  microphoneOpen: false,
  muted: false,
  speaking: false,
  processing: false,
  connection: "disconnected",
  error: null,
  transcriptVisible: true,
  transcriptPrivacy: "ephemeral",
  recordingAudio: false,
};

/**
 * Opens the microphone. Pass `mode` whenever the caller knows it (Start /
 * Resume → "conversation", hold-to-talk → "push-to-talk") so a previous
 * push-to-talk hold can never leave a continuous conversation stuck in
 * push-to-talk mode. Without `mode` the current mode is kept.
 */
export function startConversation(
  session: ConversationVoiceSession,
  nowIso: string,
  mode?: ConversationVoiceMode,
): ConversationVoiceSession {
  return {
    ...session,
    state: "listening",
    mode: mode ?? (session.mode === "push-to-talk" ? "push-to-talk" : "conversation"),
    startedAt: session.startedAt ?? nowIso,
    microphoneOpen: !session.muted,
    muted: session.muted,
    speaking: false,
    processing: false,
    connection: "connected",
    error: null,
    recordingAudio: false,
  };
}

export function stopConversation(session: ConversationVoiceSession): ConversationVoiceSession {
  return {
    ...session,
    state: "stopped",
    mode: "conversation",
    microphoneOpen: false,
    speaking: false,
    processing: false,
    connection: "disconnected",
  };
}

export function muteConversation(session: ConversationVoiceSession): ConversationVoiceSession {
  return { ...session, state: "muted", muted: true, microphoneOpen: false };
}

/**
 * Unmutes. Only a started continuous conversation goes back to listening;
 * push-to-talk waits for the next hold and a never-started session stays idle.
 */
export function unmuteConversation(session: ConversationVoiceSession): ConversationVoiceSession {
  if (session.state === "stopped") return { ...session, muted: false };
  if (listeningModeAfterUnmute({ ...session, muted: false }) !== "continuous") {
    return { ...session, state: "idle", muted: false, microphoneOpen: false };
  }
  return { ...session, state: "listening", muted: false, microphoneOpen: true };
}

/**
 * Whether unmuting should reopen continuous listening. Push-to-talk never
 * reopens the microphone on its own; it waits for the next hold.
 */
export function listeningModeAfterUnmute(session: ConversationVoiceSession): "continuous" | null {
  if (session.state === "stopped" || !session.startedAt) return null;
  return session.mode === "conversation" ? "continuous" : null;
}

/**
 * Stops assistant speech. `listening` reports whether the microphone is
 * actually live; when it is not (push-to-talk released, typed-only turn), the
 * session settles to idle instead of claiming LifeOS can hear the owner.
 */
export function interruptSpeech(session: ConversationVoiceSession, listening = true): ConversationVoiceSession {
  if (session.state === "stopped") return session;
  if (session.muted) {
    return { ...session, state: "muted", speaking: false, processing: false, microphoneOpen: false };
  }
  return {
    ...session,
    state: listening ? "listening" : "idle",
    speaking: false,
    processing: false,
    microphoneOpen: listening,
  };
}

/**
 * Settles the session after a reply was shown or finished speaking.
 * Errors stay visible; otherwise the state reflects whether the mic is live.
 */
export function settleAfterReply(session: ConversationVoiceSession, listening: boolean): ConversationVoiceSession {
  const quiet = { ...session, speaking: false, processing: false };
  if (session.muted) return { ...quiet, state: "muted", microphoneOpen: false };
  if (session.state === "stopped" || session.state === "error" || session.state === "permission-denied") return quiet;
  if (listening) return { ...quiet, state: "listening", microphoneOpen: true, connection: "connected", error: null };
  return { ...quiet, state: "idle", microphoneOpen: false, error: null };
}

/** Clears a recognition/turn error so the owner can try again without reloading. */
export function recoverConversation(session: ConversationVoiceSession): ConversationVoiceSession {
  return {
    ...session,
    state: session.muted ? "muted" : "idle",
    connection: "disconnected",
    error: null,
    microphoneOpen: false,
    speaking: false,
    processing: false,
  };
}

/**
 * After "Try again": re-request the microphone when permission was denied or
 * a started continuous conversation failed; otherwise just clear the error.
 */
export function recoveryPlan(session: ConversationVoiceSession): "listen" | "clear" {
  if (session.muted) return "clear";
  if (session.state === "permission-denied") return "listen";
  if (session.state === "error" && session.startedAt && session.mode === "conversation") return "listen";
  return "clear";
}

export function resumeConversation(session: ConversationVoiceSession): ConversationVoiceSession {
  if (session.state === "stopped") return startConversation(INITIAL_CONVERSATION_VOICE, new Date().toISOString());
  if (session.muted) return session;
  return { ...session, state: "listening", mode: "conversation", connection: "connected", microphoneOpen: true, error: null };
}

export function markThinking(session: ConversationVoiceSession): ConversationVoiceSession {
  return { ...session, state: "thinking", processing: true, speaking: false };
}

export function markSpeaking(session: ConversationVoiceSession): ConversationVoiceSession {
  return { ...session, state: "speaking", processing: false, speaking: true };
}

export function failConversation(session: ConversationVoiceSession, error: string): ConversationVoiceSession {
  return { ...session, state: "error", connection: "error", error, microphoneOpen: false, speaking: false, processing: false };
}

export function denyMicrophone(session: ConversationVoiceSession): ConversationVoiceSession {
  return {
    ...session,
    state: "permission-denied",
    connection: "error",
    error: "Microphone permission was denied.",
    microphoneOpen: false,
    speaking: false,
    processing: false,
    muted: false,
  };
}

export function enablePushToTalk(session: ConversationVoiceSession): ConversationVoiceSession {
  return { ...session, mode: "push-to-talk", microphoneOpen: false, state: session.state === "stopped" ? "idle" : "idle" };
}

export function releasePushToTalk(session: ConversationVoiceSession): ConversationVoiceSession {
  if (session.muted) return { ...session, mode: "push-to-talk", microphoneOpen: false, state: "muted" };
  if (session.state === "thinking" || session.state === "speaking" || session.state === "stopped") {
    return { ...session, mode: "push-to-talk", microphoneOpen: false };
  }
  return { ...session, mode: "push-to-talk", state: "idle", microphoneOpen: false };
}

export function setTranscriptPrivacy(
  session: ConversationVoiceSession,
  privacy: ConversationVoiceSession["transcriptPrivacy"],
): ConversationVoiceSession {
  return { ...session, transcriptPrivacy: privacy, transcriptVisible: privacy !== "hidden" };
}

export function tickDuration(session: ConversationVoiceSession, nowMs: number): ConversationVoiceSession {
  if (!session.startedAt || session.state === "stopped") return session;
  return { ...session, durationMs: Math.max(0, nowMs - Date.parse(session.startedAt)) };
}

export function formatDuration(durationMs: number): string {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function describeConversationVoice(session: ConversationVoiceSession): string {
  if (session.state === "error") return session.error || "Voice session error.";
  if (session.state === "permission-denied") return "Microphone permission was denied. Grant access to start listening.";
  if (session.state === "stopped" || session.state === "idle") return "LifeOS is not listening.";
  if (session.muted) return "Microphone is muted. LifeOS cannot hear you.";
  if (session.state === "thinking") return "LifeOS is processing.";
  if (session.state === "speaking") return "LifeOS is speaking. You can interrupt.";
  if (session.microphoneOpen) return "LifeOS can hear you.";
  return "Voice session is connected but the microphone is closed.";
}

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

export function startConversation(session: ConversationVoiceSession, nowIso: string): ConversationVoiceSession {
  return {
    ...session,
    state: "listening",
    mode: session.mode === "push-to-talk" ? "push-to-talk" : "conversation",
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
    microphoneOpen: false,
    speaking: false,
    processing: false,
    connection: "disconnected",
  };
}

export function muteConversation(session: ConversationVoiceSession): ConversationVoiceSession {
  return { ...session, state: "muted", muted: true, microphoneOpen: false };
}

export function unmuteConversation(session: ConversationVoiceSession): ConversationVoiceSession {
  if (session.state === "stopped") return session;
  return { ...session, state: "listening", muted: false, microphoneOpen: true };
}

export function interruptSpeech(session: ConversationVoiceSession): ConversationVoiceSession {
  if (session.state === "stopped") return session;
  return {
    ...session,
    state: session.muted ? "muted" : "listening",
    speaking: false,
    processing: false,
    microphoneOpen: !session.muted,
  };
}

export function resumeConversation(session: ConversationVoiceSession): ConversationVoiceSession {
  if (session.state === "stopped") return startConversation(INITIAL_CONVERSATION_VOICE, new Date().toISOString());
  if (session.muted) return session;
  return { ...session, state: "listening", connection: "connected", microphoneOpen: true, error: null };
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

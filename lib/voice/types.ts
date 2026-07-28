export type VoiceState =
  | "disabled"
  | "idle"
  | "requesting_permission"
  | "connecting"
  | "ready"
  | "listening"
  | "transcribing"
  | "thinking"
  | "awaiting_confirmation"
  | "executing_tool"
  | "speaking"
  | "interrupted"
  | "muted"
  | "reconnecting"
  | "error";

export type VoiceLocale = "en" | "ht" | "fr";

export type VoiceProviderId = "browser" | "livekit" | "none";

export type TranscriptRole = "user" | "lifeos" | "system" | "tool" | "confirmation" | "error";

export type TranscriptEntry = {
  id: string;
  role: TranscriptRole;
  text: string;
  interim?: boolean;
  createdAt: number;
  temporary: boolean;
};

export type VoiceSettings = {
  audioEnabled: boolean;
  interfaceSoundsEnabled: boolean;
  speechRate: number;
  locale: VoiceLocale;
  transcriptionLanguage: VoiceLocale;
  responseLanguage: VoiceLocale;
  muted: boolean;
};

export type PendingWriteConfirmation = {
  toolName: string;
  summary: string;
  spokenSummary: string;
  payload: Record<string, unknown>;
  requestId: string;
};

export type VoiceToolClassification = "read" | "write";

export type VoiceToolDefinition = {
  name: string;
  description: string;
  classification: VoiceToolClassification;
  requiresAuth: boolean;
  requiresConfirmation: boolean;
  requiresAudit: boolean;
};

export type VoiceToolResult = {
  ok: boolean;
  toolName: string;
  humanResult: string;
  spokenResult: string;
  navigation?: string;
  stagedChange?: Record<string, unknown>;
  error?: string;
};

export type VoiceSessionStatus = {
  configured: boolean;
  provider: VoiceProviderId;
  reason?: string;
};

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  audioEnabled: true,
  interfaceSoundsEnabled: false,
  speechRate: 1,
  locale: "en",
  transcriptionLanguage: "en",
  responseLanguage: "en",
  muted: false,
};

export const VOICE_TRANSITIONS: Record<VoiceState, readonly VoiceState[]> = {
  disabled: ["idle", "error"],
  idle: ["requesting_permission", "connecting", "ready", "disabled", "error", "muted"],
  requesting_permission: ["ready", "idle", "error", "disabled"],
  connecting: ["ready", "reconnecting", "error", "idle", "disabled"],
  ready: ["listening", "thinking", "speaking", "muted", "idle", "disabled", "error", "connecting"],
  listening: ["transcribing", "interrupted", "ready", "idle", "error", "muted"],
  transcribing: ["thinking", "ready", "error", "idle"],
  thinking: ["awaiting_confirmation", "executing_tool", "speaking", "ready", "error", "idle"],
  awaiting_confirmation: ["executing_tool", "ready", "idle", "speaking", "error"],
  executing_tool: ["speaking", "ready", "awaiting_confirmation", "error", "idle"],
  speaking: ["interrupted", "ready", "idle", "listening", "error", "muted"],
  interrupted: ["ready", "listening", "idle", "error"],
  muted: ["ready", "idle", "disabled", "error"],
  reconnecting: ["ready", "error", "idle", "disabled"],
  error: ["idle", "ready", "disabled", "connecting"],
};

export function canTransition(from: VoiceState, to: VoiceState): boolean {
  return VOICE_TRANSITIONS[from].includes(to);
}

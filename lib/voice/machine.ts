import { assign, setup } from "xstate";
import { canTransition, type PendingWriteConfirmation, type VoiceState } from "./types";

export type VoiceMachineContext = {
  errorMessage: string | null;
  lastUserText: string;
  lastLifeosText: string;
  pendingConfirmation: PendingWriteConfirmation | null;
  lastToolRequestId: string | null;
  microphoneActive: boolean;
  speakingActive: boolean;
};

export type VoiceMachineEvent =
  | { type: "ENABLE" }
  | { type: "DISABLE" }
  | { type: "REQUEST_PERMISSION" }
  | { type: "PERMISSION_GRANTED" }
  | { type: "PERMISSION_DENIED"; message?: string }
  | { type: "CONNECT" }
  | { type: "CONNECTED" }
  | { type: "RECONNECT" }
  | { type: "START_LISTENING" }
  | { type: "STOP_LISTENING" }
  | { type: "TRANSCRIPT_INTERIM"; text: string }
  | { type: "TRANSCRIPT_FINAL"; text: string }
  | { type: "THINK" }
  | { type: "NEED_CONFIRMATION"; confirmation: PendingWriteConfirmation }
  | { type: "CONFIRM" }
  | { type: "CANCEL_CONFIRMATION" }
  | { type: "EXECUTE_TOOL"; requestId: string }
  | { type: "TOOL_DONE"; spoken: string; human: string }
  | { type: "SPEAK"; text: string }
  | { type: "SPEECH_END" }
  | { type: "INTERRUPT" }
  | { type: "MUTE" }
  | { type: "UNMUTE" }
  | { type: "FAIL"; message: string }
  | { type: "RESET" };

function guardTransition(from: VoiceState, to: VoiceState) {
  return () => canTransition(from, to);
}

export const voiceMachine = setup({
  types: {
    context: {} as VoiceMachineContext,
    events: {} as VoiceMachineEvent,
  },
  actions: {
    clearError: assign({ errorMessage: null }),
    setError: assign(({ event }) => ({
      errorMessage: event.type === "FAIL" || event.type === "PERMISSION_DENIED"
        ? (event.message || "Voice session failed.")
        : "Voice session failed.",
      microphoneActive: false,
      speakingActive: false,
    })),
    markMicOn: assign({ microphoneActive: true }),
    markMicOff: assign({ microphoneActive: false }),
    markSpeakingOn: assign({ speakingActive: true }),
    markSpeakingOff: assign({ speakingActive: false }),
    storeUserText: assign(({ event }) => ({
      lastUserText: event.type === "TRANSCRIPT_FINAL" ? event.text : "",
    })),
    storeLifeosText: assign(({ event }) => ({
      lastLifeosText: event.type === "SPEAK" || event.type === "TOOL_DONE"
        ? ("text" in event ? event.text : event.spoken)
        : "",
      speakingActive: event.type === "SPEAK",
    })),
    storeConfirmation: assign(({ event }) => ({
      pendingConfirmation: event.type === "NEED_CONFIRMATION" ? event.confirmation : null,
    })),
    clearConfirmation: assign({ pendingConfirmation: null }),
    storeToolRequest: assign(({ event }) => ({
      lastToolRequestId: event.type === "EXECUTE_TOOL" ? event.requestId : null,
    })),
  },
  guards: {
    canEnable: guardTransition("disabled", "idle"),
    notDuplicateTool: ({ context, event }) => {
      if (event.type !== "EXECUTE_TOOL") return true;
      return context.lastToolRequestId !== event.requestId;
    },
  },
}).createMachine({
  id: "lifeosVoice",
  initial: "disabled",
  context: {
    errorMessage: null,
    lastUserText: "",
    lastLifeosText: "",
    pendingConfirmation: null,
    lastToolRequestId: null,
    microphoneActive: false,
    speakingActive: false,
  },
  states: {
    disabled: {
      on: {
        ENABLE: { target: "idle", actions: "clearError" },
        FAIL: { target: "error", actions: "setError" },
      },
    },
    idle: {
      entry: ["markMicOff", "markSpeakingOff"],
      on: {
        REQUEST_PERMISSION: "requesting_permission",
        CONNECT: "connecting",
        CONNECTED: "ready",
        MUTE: "muted",
        DISABLE: "disabled",
        FAIL: { target: "error", actions: "setError" },
      },
    },
    requesting_permission: {
      on: {
        PERMISSION_GRANTED: { target: "ready", actions: "clearError" },
        PERMISSION_DENIED: { target: "error", actions: "setError" },
        DISABLE: "disabled",
        RESET: "idle",
      },
    },
    connecting: {
      on: {
        CONNECTED: "ready",
        RECONNECT: "reconnecting",
        FAIL: { target: "error", actions: "setError" },
        DISABLE: "disabled",
        RESET: "idle",
      },
    },
    ready: {
      entry: ["markMicOff", "markSpeakingOff"],
      on: {
        START_LISTENING: { target: "listening", actions: "markMicOn" },
        THINK: "thinking",
        SPEAK: { target: "speaking", actions: "storeLifeosText" },
        MUTE: "muted",
        CONNECT: "connecting",
        DISABLE: "disabled",
        RESET: "idle",
        FAIL: { target: "error", actions: "setError" },
      },
    },
    listening: {
      entry: "markMicOn",
      exit: "markMicOff",
      on: {
        TRANSCRIPT_INTERIM: { target: "listening" },
        TRANSCRIPT_FINAL: { target: "transcribing", actions: "storeUserText" },
        STOP_LISTENING: "ready",
        INTERRUPT: "interrupted",
        MUTE: "muted",
        FAIL: { target: "error", actions: "setError" },
      },
    },
    transcribing: {
      on: {
        THINK: "thinking",
        RESET: "ready",
        FAIL: { target: "error", actions: "setError" },
      },
    },
    thinking: {
      on: {
        NEED_CONFIRMATION: { target: "awaiting_confirmation", actions: "storeConfirmation" },
        EXECUTE_TOOL: { target: "executing_tool", guard: "notDuplicateTool", actions: "storeToolRequest" },
        SPEAK: { target: "speaking", actions: "storeLifeosText" },
        RESET: "ready",
        FAIL: { target: "error", actions: "setError" },
      },
    },
    awaiting_confirmation: {
      on: {
        CONFIRM: "executing_tool",
        CANCEL_CONFIRMATION: { target: "ready", actions: "clearConfirmation" },
        SPEAK: { target: "speaking", actions: "storeLifeosText" },
        FAIL: { target: "error", actions: "setError" },
      },
    },
    executing_tool: {
      on: {
        TOOL_DONE: { target: "speaking", actions: ["storeLifeosText", "clearConfirmation"] },
        NEED_CONFIRMATION: { target: "awaiting_confirmation", actions: "storeConfirmation" },
        FAIL: { target: "error", actions: "setError" },
        RESET: "ready",
      },
    },
    speaking: {
      entry: "markSpeakingOn",
      exit: "markSpeakingOff",
      on: {
        SPEECH_END: "ready",
        INTERRUPT: "interrupted",
        START_LISTENING: { target: "listening", actions: "markMicOn" },
        MUTE: "muted",
        FAIL: { target: "error", actions: "setError" },
      },
    },
    interrupted: {
      entry: ["markSpeakingOff", "markMicOff"],
      on: {
        START_LISTENING: { target: "listening", actions: "markMicOn" },
        RESET: "ready",
        FAIL: { target: "error", actions: "setError" },
      },
    },
    muted: {
      entry: ["markMicOff", "markSpeakingOff"],
      on: {
        UNMUTE: "ready",
        DISABLE: "disabled",
        RESET: "idle",
        FAIL: { target: "error", actions: "setError" },
      },
    },
    reconnecting: {
      on: {
        CONNECTED: "ready",
        FAIL: { target: "error", actions: "setError" },
        RESET: "idle",
        DISABLE: "disabled",
      },
    },
    error: {
      on: {
        RESET: { target: "idle", actions: "clearError" },
        CONNECT: "connecting",
        ENABLE: "idle",
        DISABLE: "disabled",
      },
    },
  },
});

export type VoiceMachine = typeof voiceMachine;

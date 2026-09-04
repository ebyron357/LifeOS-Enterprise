import { describe, expect, it } from "vitest";
import {
  describeConversationVoice,
  enablePushToTalk,
  failConversation,
  formatDuration,
  INITIAL_CONVERSATION_VOICE,
  interruptSpeech,
  markSpeaking,
  muteConversation,
  setTranscriptPrivacy,
  startConversation,
  stopConversation,
  unmuteConversation,
} from "@/lib/voice/conversation";

describe("conversation voice session", () => {
  it("starts a listening session without enabling audio recording", () => {
    const session = startConversation(INITIAL_CONVERSATION_VOICE, "2026-08-26T12:00:00.000Z");
    expect(session.state).toBe("listening");
    expect(session.microphoneOpen).toBe(true);
    expect(session.recordingAudio).toBe(false);
    expect(describeConversationVoice(session)).toMatch(/can hear you/i);
  });

  it("mutes, unmutes, interrupts, and stops without leftover speech", () => {
    let session = startConversation(INITIAL_CONVERSATION_VOICE, "2026-08-26T12:00:00.000Z");
    session = markSpeaking(session);
    session = interruptSpeech(session);
    expect(session.speaking).toBe(false);
    session = muteConversation(session);
    expect(session.muted).toBe(true);
    expect(session.microphoneOpen).toBe(false);
    expect(describeConversationVoice(session)).toMatch(/cannot hear you/i);
    session = unmuteConversation(session);
    expect(session.state).toBe("listening");
    expect(session.microphoneOpen).toBe(true);
    session = stopConversation(session);
    expect(session.state).toBe("stopped");
    expect(session.microphoneOpen).toBe(false);
  });

  it("supports push-to-talk fallback and transcript privacy", () => {
    const hidden = setTranscriptPrivacy(enablePushToTalk(INITIAL_CONVERSATION_VOICE), "hidden");
    expect(hidden.mode).toBe("push-to-talk");
    expect(hidden.transcriptVisible).toBe(false);
    expect(formatDuration(65000)).toBe("1:05");
  });

  it("surfaces a visible error/recovery state", () => {
    const failed = failConversation(INITIAL_CONVERSATION_VOICE, "Recognition failed.");
    expect(failed.state).toBe("error");
    expect(describeConversationVoice(failed)).toMatch(/Recognition failed/);
  });
});

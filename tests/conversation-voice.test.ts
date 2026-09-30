import { describe, expect, it } from "vitest";
import {
  denyMicrophone,
  describeConversationVoice,
  enablePushToTalk,
  failConversation,
  releasePushToTalk,
  formatDuration,
  INITIAL_CONVERSATION_VOICE,
  interruptSpeech,
  listeningModeAfterUnmute,
  markSpeaking,
  markThinking,
  muteConversation,
  recoverConversation,
  recoveryPlan,
  resumeConversation,
  setTranscriptPrivacy,
  settleAfterReply,
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

  it("releases push-to-talk without leaving a listening microphone", () => {
    let session = startConversation(enablePushToTalk(INITIAL_CONVERSATION_VOICE), "2026-08-26T12:00:00.000Z");
    expect(session.mode).toBe("push-to-talk");
    expect(session.state).toBe("listening");
    session = releasePushToTalk(session);
    expect(session.state).toBe("idle");
    expect(session.microphoneOpen).toBe(false);
    expect(session.mode).toBe("push-to-talk");
  });

  it("keeps thinking state when push-to-talk is released after a turn starts", () => {
    let session = startConversation(enablePushToTalk(INITIAL_CONVERSATION_VOICE), "2026-08-26T12:00:00.000Z");
    session = markThinking(session);
    session = releasePushToTalk(session);
    expect(session.state).toBe("thinking");
    expect(session.microphoneOpen).toBe(false);
  });

  it("surfaces a visible error/recovery state", () => {
    const failed = failConversation(INITIAL_CONVERSATION_VOICE, "Recognition failed.");
    expect(failed.state).toBe("error");
    expect(describeConversationVoice(failed)).toMatch(/Recognition failed/);
  });

  it("resets push-to-talk mode when a continuous conversation starts, so unmute resumes continuous listening", () => {
    // Owner uses push-to-talk once…
    let session = startConversation(enablePushToTalk(INITIAL_CONVERSATION_VOICE), "2026-08-26T12:00:00.000Z", "push-to-talk");
    session = releasePushToTalk(session);
    expect(session.mode).toBe("push-to-talk");
    // …then presses Start conversation.
    session = startConversation(session, "2026-08-26T12:01:00.000Z", "conversation");
    expect(session.mode).toBe("conversation");
    session = muteConversation(session);
    expect(listeningModeAfterUnmute(session)).toBe("continuous");
    session = unmuteConversation(session);
    expect(session.state).toBe("listening");
    expect(session.microphoneOpen).toBe(true);
  });

  it("does not reopen the microphone on unmute while in push-to-talk mode or before starting", () => {
    let session = startConversation(enablePushToTalk(INITIAL_CONVERSATION_VOICE), "2026-08-26T12:00:00.000Z", "push-to-talk");
    session = releasePushToTalk(session);
    session = unmuteConversation(muteConversation(session));
    expect(listeningModeAfterUnmute(session)).toBeNull();
    expect(session.state).toBe("idle");
    expect(session.microphoneOpen).toBe(false);

    const neverStarted = unmuteConversation(muteConversation(INITIAL_CONVERSATION_VOICE));
    expect(neverStarted.state).toBe("idle");
    expect(neverStarted.muted).toBe(false);
  });

  it("resets mode to conversation when stopped and clears muted on unmute after stop", () => {
    let session = startConversation(enablePushToTalk(INITIAL_CONVERSATION_VOICE), "2026-08-26T12:00:00.000Z", "push-to-talk");
    session = muteConversation(session);
    session = stopConversation(session);
    expect(session.mode).toBe("conversation");
    session = unmuteConversation(session);
    expect(session.muted).toBe(false);
    expect(session.state).toBe("stopped");
    expect(resumeConversation(session).mode).toBe("conversation");
  });

  it("recovers from an error without a reload and decides whether to re-listen", () => {
    const started = startConversation(INITIAL_CONVERSATION_VOICE, "2026-08-26T12:00:00.000Z", "conversation");
    const failed = failConversation(started, "Speech recognition failed (network).");
    expect(recoveryPlan(failed)).toBe("listen");
    const recovered = recoverConversation(failed);
    expect(recovered.state).toBe("idle");
    expect(recovered.error).toBeNull();
    expect(recovered.connection).toBe("disconnected");
    expect(describeConversationVoice(recovered)).toMatch(/not listening/i);

    expect(recoveryPlan(denyMicrophone(INITIAL_CONVERSATION_VOICE))).toBe("listen");
    // A typed-turn failure with no voice session only clears the error.
    expect(recoveryPlan(failConversation(INITIAL_CONVERSATION_VOICE, "Agent turn failed."))).toBe("clear");
  });

  it("settles after a reply according to whether the microphone is live", () => {
    const thinking = markThinking(startConversation(INITIAL_CONVERSATION_VOICE, "2026-08-26T12:00:00.000Z"));
    expect(settleAfterReply(markSpeaking(thinking), true).state).toBe("listening");
    expect(settleAfterReply(markSpeaking(thinking), false).state).toBe("idle");
    expect(settleAfterReply(muteConversation(thinking), true).state).toBe("muted");
    expect(settleAfterReply(stopConversation(thinking), true).state).toBe("stopped");
    const typedOnly = settleAfterReply(markThinking(INITIAL_CONVERSATION_VOICE), false);
    expect(typedOnly.state).toBe("idle");
    expect(typedOnly.microphoneOpen).toBe(false);
  });

  it("interrupt does not claim the microphone is open when it is not", () => {
    const speaking = markSpeaking(startConversation(INITIAL_CONVERSATION_VOICE, "2026-08-26T12:00:00.000Z"));
    expect(interruptSpeech(speaking, false)).toMatchObject({ state: "idle", microphoneOpen: false, speaking: false });
    expect(interruptSpeech(speaking, true)).toMatchObject({ state: "listening", microphoneOpen: true });
  });

  it("surfaces permission-denied as a distinct state and closes the microphone", () => {
    const denied = denyMicrophone(startConversation(INITIAL_CONVERSATION_VOICE, "2026-08-26T12:00:00.000Z"));
    expect(denied.state).toBe("permission-denied");
    expect(denied.microphoneOpen).toBe(false);
    expect(describeConversationVoice(denied)).toMatch(/permission was denied/i);
  });
});

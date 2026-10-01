"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { ActivityEvent, AgentTurnResult, ApprovalRequest, ScreenAwarenessSnapshot, TeachingPlan, ToolDefinition } from "@/lib/agent/types";
import type { VaultDashboardData } from "@/lib/lifeos/types";
import { appendActivity, createActivityEvent } from "@/lib/agent/activity";
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
  tickDuration,
  unmuteConversation,
  type ConversationVoiceSession,
} from "@/lib/voice/conversation";
import {
  classifyRecognitionError,
  createRequestGate,
  createTurnGuard,
  DEFAULT_VOICE_SETTINGS,
  describeCapabilityNotes,
  describeRejectedTurn,
  describeSpeechRuntime,
  isAbortError,
  parseVoiceSettings,
  resolveSpeechProvider,
  type SpeechRuntime,
  type TtsProviderStatus,
  type VoiceSettings,
  recognizerContinuous,
} from "@/lib/voice/conversation-runtime";
import {
  createBrowserVoiceTransport,
  getBrowserVoicesSnapshot,
  getServerBrowserVoicesSnapshot,
  getServerVoiceCapabilitiesSnapshot,
  getVoiceCapabilitiesSnapshot,
  subscribeBrowserVoices,
  subscribeVoiceCapabilities,
} from "@/lib/voice/provider";
import {
  readServerVoiceSettingsRaw,
  readServerVoiceSettingsWriteError,
  readStoredVoiceSettingsRaw,
  readVoiceSettingsWriteError,
  subscribeStoredVoiceSettings,
  writeStoredVoiceSettings,
} from "@/lib/voice/settings-store";
import type { TranscriptEntry } from "@/lib/voice/types";
import { createTranscriptEntry } from "@/lib/voice/transcript";
import {
  defaultOpenAiVoiceForStyle,
  filterVoicesForLocale,
  isOpenAiTtsVoice,
  isResponseStyle,
  OPENAI_TTS_VOICES,
  toSpeechLang,
} from "@/lib/voice/voice-options";
import {
  pauseScreenAnalysis,
  requestDisplayMedia,
  resumeScreenAnalysis,
  stopScreenShare,
  toAwarenessSnapshot,
} from "@/lib/screen/browser";
import { describeScreenShare, INITIAL_SCREEN_SHARE, type ScreenShareSnapshot } from "@/lib/screen/state";
import type { TtsProviderId } from "@/lib/voice/tts-providers";
import styles from "./AgentConversationWorkspace.module.css";

type AgentConversationWorkspaceProps = {
  vault: Pick<VaultDashboardData, "projects" | "agents" | "activeProjects" | "waitingOn" | "reviewsDue" | "priorities">;
};

const SESSION_KEY = "lifeos-agent-session-id";
const SESSION_LOAD_ERROR = "Unable to load agent session metadata.";

const LOCALE_OPTIONS = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "zh-TW", label: "中文（台灣）" },
  { value: "fr-FR", label: "Français" },
];

type LocaleDefaults = { locale: string | null; transcriptionLanguage: string | null };

function sessionId(): string {
  if (typeof window === "undefined") return "ssr";
  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const next = `sess-${crypto.randomUUID()}`;
  window.sessionStorage.setItem(SESSION_KEY, next);
  return next;
}

function localeOptionsWith(value: string) {
  return LOCALE_OPTIONS.some((option) => option.value === value)
    ? LOCALE_OPTIONS
    : [...LOCALE_OPTIONS, { value, label: value }];
}

export function AgentConversationWorkspace({ vault }: AgentConversationWorkspaceProps) {
  const [voice, setVoice] = useState<ConversationVoiceSession>(INITIAL_CONVERSATION_VOICE);
  const [screen, setScreen] = useState<ScreenShareSnapshot>(INITIAL_SCREEN_SHARE);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [draft, setDraft] = useState("");
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [writeSecret, setWriteSecret] = useState("");
  const [result, setResult] = useState<AgentTurnResult | null>(null);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [paused, setPaused] = useState(false);
  const [teaching, setTeaching] = useState<TeachingPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [turnNotice, setTurnNotice] = useState<string | null>(null);
  const [speechRuntime, setSpeechRuntime] = useState<SpeechRuntime | null>(null);
  const [micEverStarted, setMicEverStarted] = useState(false);
  const [availableProviders, setAvailableProviders] = useState<TtsProviderStatus[]>([]);
  const [fallbackProvider, setFallbackProvider] = useState<TtsProviderId>("browser");
  const [localeDefaults, setLocaleDefaults] = useState<LocaleDefaults | null>(null);
  const [sessionAttempt, setSessionAttempt] = useState(0);
  const [sessionLoadFailed, setSessionLoadFailed] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const streamRef = useRef<MediaStream | null>(null);
  const shareGenerationRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const transportRef = useRef(createBrowserVoiceTransport());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const keepListeningRef = useRef(false);
  // Bumped by Stop, mute, push-to-talk release, errors, recovery, and unmount so a microphone
  // permission prompt that resolves afterwards can never start listening.
  const listenGenerationRef = useRef(0);
  const mutedRef = useRef(false);
  const voiceRef = useRef<ConversationVoiceSession>(INITIAL_CONVERSATION_VOICE);
  const restartListeningRef = useRef<((continuous: boolean) => Promise<void>) | null>(null);
  const submitTurnRef = useRef<((text: string, channel: "text" | "voice") => boolean) | null>(null);
  /** Cancels in-flight /api/lifeos/agent/turn requests (Interrupt, Stop). */
  const turnGateRef = useRef(createRequestGate());
  /** Cancels in-flight /api/lifeos/voice/speak requests and stale speech (Interrupt, Stop, Mute, newer reply). */
  const speechGateRef = useRef(createRequestGate());
  /** One turn at a time + duplicate transcript suppression. */
  const turnGuardRef = useRef(createTurnGuard());
  /** Explicit owner-cancellation epoch. WebKit may resolve an aborted fetch, so stale work also checks this epoch. */
  const ownerCancelEpochRef = useRef(0);

  // Persisted settings hydrate from localStorage on mount, independent of the session fetch.
  // Nothing is written until the owner changes a setting, so defaults never overwrite saved values.
  const storedSettingsRaw = useSyncExternalStore(subscribeStoredVoiceSettings, readStoredVoiceSettingsRaw, readServerVoiceSettingsRaw);
  const voiceSettings = useMemo(() => parseVoiceSettings(storedSettingsRaw, localeDefaults), [storedSettingsRaw, localeDefaults]);
  const voiceSettingsWriteError = useSyncExternalStore(
    subscribeStoredVoiceSettings,
    readVoiceSettingsWriteError,
    readServerVoiceSettingsWriteError,
  );
  const browserVoices = useSyncExternalStore(subscribeBrowserVoices, getBrowserVoicesSnapshot, getServerBrowserVoicesSnapshot);
  const capabilities = useSyncExternalStore(subscribeVoiceCapabilities, getVoiceCapabilitiesSnapshot, getServerVoiceCapabilitiesSnapshot);
  const capabilitiesRef = useRef(capabilities);
  useEffect(() => {
    capabilitiesRef.current = capabilities;
  }, [capabilities]);

  const updateVoiceSettings = useCallback((patch: Partial<VoiceSettings>) => {
    const current = parseVoiceSettings(readStoredVoiceSettingsRaw(), localeDefaults);
    writeStoredVoiceSettings({ ...current, ...patch });
  }, [localeDefaults]);

  const awareness: ScreenAwarenessSnapshot = useMemo(() => toAwarenessSnapshot(screen, nowMs), [screen, nowMs]);
  const openaiStatus = useMemo(() => availableProviders.find((provider) => provider.id === "openai") ?? null, [availableProviders]);
  const nextSpeech = useMemo(() => resolveSpeechProvider({
    selected: voiceSettings.provider,
    openai: openaiStatus,
    ownerSecretPresent: writeSecret.trim().length > 0,
  }), [openaiStatus, voiceSettings.provider, writeSecret]);
  const localeVoices = useMemo(() => filterVoicesForLocale(browserVoices.voices, voiceSettings.locale), [browserVoices.voices, voiceSettings.locale]);
  const selectedBrowserVoice = localeVoices.find((item) => item.voiceURI === voiceSettings.browserVoiceURI) ?? null;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
      setVoice((current) => tickDuration(current, Date.now()));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/lifeos/agent/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled) return;
        setTools(Array.isArray(payload.tools) ? payload.tools : []);
        setToken(typeof payload.sessionToken === "string" ? payload.sessionToken : null);
        const tts = payload.tts && typeof payload.tts === "object" ? payload.tts : null;
        const providers: TtsProviderStatus[] = Array.isArray(tts?.providers)
          ? tts.providers
              .map((provider: { id?: string; configured?: boolean; reason?: string | null }) => ({
                id: provider?.id === "openai" ? "openai" : "browser",
                configured: Boolean(provider?.configured),
                reason: typeof provider?.reason === "string" ? provider.reason : null,
              }))
          : [];
        setAvailableProviders(providers);
        setFallbackProvider(tts?.fallbackProvider === "openai" ? "openai" : "browser");
        const defaults = payload?.localeDefaults;
        setLocaleDefaults({
          locale: typeof defaults?.locale === "string" ? defaults.locale : null,
          transcriptionLanguage: typeof defaults?.transcriptionLanguage === "string" ? defaults.transcriptionLanguage : null,
        });
        setSessionLoadFailed(false);
      })
      .catch(() => {
        if (cancelled) return;
        setSessionLoadFailed(true);
        setError(SESSION_LOAD_ERROR);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionAttempt]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = streamRef.current;
  }, [screen.state]);

  useEffect(() => {
    mutedRef.current = voice.muted;
    voiceRef.current = voice;
  }, [voice]);

  useEffect(() => {
    const transport = transportRef.current;
    const turnGate = turnGateRef.current;
    const speechGate = speechGateRef.current;
    return () => {
      keepListeningRef.current = false;
      listenGenerationRef.current += 1;
      shareGenerationRef.current += 1;
      turnGate.cancel();
      speechGate.cancel();
      transport.disconnect();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  const appendLine = useCallback((role: TranscriptEntry["role"], text: string) => {
    setTranscript((entries) => [...entries, createTranscriptEntry(role, text, { temporary: true })].slice(-80));
  }, []);

  const headers = useCallback(() => {
    const next: Record<string, string> = { "Content-Type": "application/json" };
    if (token) next.Authorization = `Bearer ${token}`;
    return next;
  }, [token]);

  const writeHeaders = useCallback(() => {
    const next: Record<string, string> = { "Content-Type": "application/json" };
    if (writeSecret) next.Authorization = `Bearer ${writeSecret}`;
    return next;
  }, [writeSecret]);

  const micIsLive = useCallback(
    () => !mutedRef.current && (keepListeningRef.current || transportRef.current.isListening()),
    [],
  );

  const settleVoice = useCallback(() => {
    const listening = micIsLive();
    setVoice((current) => settleAfterReply(current, listening));
  }, [micIsLive]);

  const stopPlayback = useCallback(() => {
    transportRef.current.stopSpeaking();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = "";
      audioRef.current = null;
    }
  }, []);

  /**
   * Speaks one reply. Every call starts a new speech generation, so an older
   * pending OpenAI clip or browser utterance can never play over it, and
   * Interrupt/Stop/Mute cancel the in-flight /voice/speak request.
   */
  const speakReply = useCallback(async (text: string) => {
    const spoken = text.trim();
    if (!spoken) return;
    const speechGate = speechGateRef.current;
    const generation = speechGate.advance();
    stopPlayback();
    const settings = voiceSettings;
    const decision = resolveSpeechProvider({
      selected: settings.provider,
      openai: openaiStatus,
      ownerSecretPresent: writeSecret.trim().length > 0,
    });
    let fallbackReason = decision.fallbackReason;

    if (decision.provider === "openai") {
      const openaiVoice = settings.openaiVoice || defaultOpenAiVoiceForStyle(settings.responseStyle);
      let objectUrl: string | null = null;
      try {
        const response = await fetch("/api/lifeos/voice/speak", {
          method: "POST",
          headers: writeHeaders(),
          signal: speechGate.signalFor(generation),
          body: JSON.stringify({
            text: spoken,
            locale: toSpeechLang(settings.locale),
            speed: settings.speechRate,
            style: settings.responseStyle,
            provider: "openai",
            ...(settings.openaiVoice ? { voice: settings.openaiVoice } : {}),
          }),
        });
        if (!speechGate.isCurrent(generation)) return;
        if (response.ok) {
          const blob = await response.blob();
          if (!speechGate.isCurrent(generation)) return;
          const url = URL.createObjectURL(blob);
          objectUrl = url;
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.onended = () => {
            URL.revokeObjectURL(url);
            if (speechGate.isCurrent(generation)) settleVoice();
          };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            if (speechGate.isCurrent(generation)) setVoice((current) => failConversation(current, "Server-side TTS playback failed."));
          };
          await audio.play();
          if (!speechGate.isCurrent(generation)) return;
          setSpeechRuntime({ provider: "openai", voice: openaiVoice, fallbackReason: null });
          return;
        }
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        fallbackReason = `OpenAI unavailable: ${payload?.error || `the server returned ${response.status}.`}`;
      } catch (caught) {
        if (isAbortError(caught) || !speechGate.isCurrent(generation)) return;
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        fallbackReason = `OpenAI unavailable: ${caught instanceof Error && caught.message ? caught.message : "the request failed."}`;
      }
    }

    if (!speechGate.isCurrent(generation)) return;
    const outcome = transportRef.current.speak(spoken, {
      rate: settings.speechRate,
      pitch: settings.pitch,
      lang: settings.locale,
      voiceURI: settings.browserVoiceURI || undefined,
      onEnd: () => {
        if (speechGate.isCurrent(generation)) settleVoice();
      },
      onError: (message) => {
        if (speechGate.isCurrent(generation)) setVoice((current) => failConversation(current, message));
      },
    });
    if (outcome.started) {
      setSpeechRuntime({ provider: "browser", voice: outcome.voiceName, fallbackReason });
    } else {
      setSpeechRuntime({ provider: "none", voice: null, fallbackReason: outcome.error ?? "speech synthesis is unavailable." });
      settleVoice();
    }
  }, [openaiStatus, settleVoice, stopPlayback, voiceSettings, writeHeaders, writeSecret]);

  const runTurn = useCallback(async (text: string, channel: "text" | "voice", turnId: number) => {
    const guard = turnGuardRef.current;
    const ownerCancelEpoch = ownerCancelEpochRef.current;
    const turnGate = turnGateRef.current;
    const generation = turnGate.advance();
    speechGateRef.current.cancel();
    stopPlayback();
    setTurnNotice(null);
    const privacy = voiceRef.current.transcriptPrivacy;
    if (privacy !== "hidden") appendLine("user", text);
    setVoice((current) => markThinking(current));
    setActivity((events) => appendActivity(events, createActivityEvent("mission-started", "Sending owner request.")));
    try {
      const response = await fetch("/api/lifeos/agent/turn", {
        method: "POST",
        headers: headers(),
        signal: turnGate.signalFor(generation),
        body: JSON.stringify({
          sessionId: sessionId(),
          text,
          channel,
          screen: awareness,
          paused,
          pendingApprovals: approvals,
          transcriptPrivacy: privacy,
          responseStyle: voiceSettings.responseStyle,
        }),
      });
      const payload = await response.json();
      // Interrupt / Stop cancelled this turn: never apply or speak a stale reply.
      if (!turnGate.isCurrent(generation) || ownerCancelEpoch !== ownerCancelEpochRef.current) return;
      guard.finish(turnId, Date.now());
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Agent turn failed.");
      const next = payload.result as AgentTurnResult;
      setResult(next);
      setApprovals(next.approvals);
      setTeaching(next.teaching);
      setActivity((events) => [...events, ...next.activity].slice(-80));
      setError(null);
      if (voiceRef.current.transcriptPrivacy !== "hidden") appendLine("lifeos", next.reply);
      const session = voiceRef.current;
      const speakAloud = !mutedRef.current && !session.muted && Boolean(session.startedAt) && session.state !== "stopped";
      if (!speakAloud) {
        settleVoice();
        return;
      }
      setVoice((current) => markSpeaking(current));
      await speakReply(next.spokenReply);
    } catch (caught) {
      if (isAbortError(caught) || !turnGate.isCurrent(generation)) return;
      guard.finish(turnId, Date.now());
      const message = caught instanceof Error ? caught.message : "Agent turn failed.";
      setError(message);
      setVoice((current) => failConversation(current, message));
      appendLine("error", message);
    }
  }, [appendLine, approvals, awareness, headers, paused, settleVoice, speakReply, stopPlayback, voiceSettings.responseStyle]);

  /** Returns false when the transcript was not sent (turn in flight, duplicate, muted, empty). */
  const submitTurn = useCallback((text: string, channel: "text" | "voice"): boolean => {
    if (mutedRef.current && channel === "voice") return false;
    const decision = turnGuardRef.current.tryBegin(text, Date.now());
    if (!decision.accepted) {
      if (decision.reason !== "empty") setTurnNotice(describeRejectedTurn(decision.reason, text));
      return false;
    }
    void runTurn(text, channel, decision.id);
    return true;
  }, [runTurn]);

  useEffect(() => {
    submitTurnRef.current = submitTurn;
  }, [submitTurn]);

  const handleRecognitionError = useCallback((code: string) => {
    const classified = classifyRecognitionError(code);
    if (classified.kind === "ignore") return;
    // Stop auto-restart so a persistent failure cannot loop; "Try again" recovers.
    keepListeningRef.current = false;
    listenGenerationRef.current += 1;
    transportRef.current.stopListening();
    if (classified.kind === "permission") setVoice((current) => denyMicrophone(current));
    else setVoice((current) => failConversation(current, classified.message));
    setActivity((events) => appendActivity(events, createActivityEvent("recoverable-error", classified.message)));
  }, []);

  const beginListening = useCallback(async (continuous: boolean) => {
    if (mutedRef.current) return;
    const transport = transportRef.current;
    const mode = continuous ? "conversation" : "push-to-talk";
    if (transport.isListening() && keepListeningRef.current === continuous) {
      // Start/Resume while already listening is a no-op: no abort, no restart cycle.
      const busy = (state: ConversationVoiceSession["state"]) => state === "listening" || state === "thinking" || state === "speaking";
      setVoice((current) => (busy(current.state) ? current : startConversation(current, new Date().toISOString(), mode)));
      return;
    }
    keepListeningRef.current = continuous;
    listenGenerationRef.current += 1;
    const generation = listenGenerationRef.current;
    const allowed = await transport.requestPermission();
    // Stop, mute, release, or unmount happened while the permission prompt was open.
    if (generation !== listenGenerationRef.current) return;
    if (!allowed) {
      keepListeningRef.current = false;
      setVoice((current) => denyMicrophone(current));
      return;
    }
    if (mutedRef.current) return;
    setError(null);
    setMicEverStarted(true);
    setVoice((current) => startConversation(current, new Date().toISOString(), mode));
    setActivity((events) => appendActivity(events, createActivityEvent("session-started", "Voice conversation started.")));
    await transport.startListening({
      lang: voiceSettings.transcriptionLanguage,
      // keepListeningRef still restarts after each phrase; the recognizer itself only runs continuous where supported.
      continuous: recognizerContinuous(continuous, capabilitiesRef.current),
      onInterim: (text) => {
        if (mutedRef.current || voiceRef.current.transcriptPrivacy === "hidden") return;
        setTranscript((entries) => {
          const without = entries.filter((entry) => !(entry.role === "user" && entry.interim));
          return [...without, createTranscriptEntry("user", text, { interim: true, temporary: true })];
        });
      },
      onFinal: (text) => {
        if (mutedRef.current || !text) return;
        submitTurnRef.current?.(text, "voice");
      },
      onError: handleRecognitionError,
      onEnd: () => {
        if (keepListeningRef.current && !mutedRef.current) {
          void restartListeningRef.current?.(true);
        }
      },
    });
  }, [handleRecognitionError, voiceSettings.transcriptionLanguage]);

  useEffect(() => {
    restartListeningRef.current = beginListening;
  }, [beginListening]);

  /** Cancels the in-flight turn, any pending server speech, and current playback. */
  function cancelPendingWork(): boolean {
    const hadPendingTurn = turnGuardRef.current.inFlight;
    ownerCancelEpochRef.current += 1;
    turnGateRef.current.cancel();
    speechGateRef.current.cancel();
    turnGuardRef.current.cancel();
    stopPlayback();
    return hadPendingTurn;
  }

  function interruptAssistant() {
    const hadPendingTurn = cancelPendingWork();
    const listening = micIsLive();
    setVoice((current) => interruptSpeech(current, listening));
    if (hadPendingTurn) {
      setTurnNotice("Interrupted. The pending reply was cancelled and will not be spoken.");
      setActivity((events) => appendActivity(events, createActivityEvent("agent-stopped", "Owner interrupted; pending reply cancelled.")));
    }
  }

  function endVoice() {
    keepListeningRef.current = false;
    listenGenerationRef.current += 1;
    transportRef.current.disconnect();
    cancelPendingWork();
    setVoice((current) => stopConversation(current));
    setActivity((events) => appendActivity(events, createActivityEvent("session-stopped", "Voice conversation stopped.")));
  }

  function startPushToTalk() {
    setVoice((current) => enablePushToTalk(current));
    void beginListening(false);
  }

  function endPushToTalk() {
    keepListeningRef.current = false;
    listenGenerationRef.current += 1;
    transportRef.current.releaseListening();
    setVoice((current) => releasePushToTalk(current));
  }

  function muteMic() {
    keepListeningRef.current = false;
    listenGenerationRef.current += 1;
    mutedRef.current = true;
    transportRef.current.stopListening();
    speechGateRef.current.cancel();
    stopPlayback();
    setVoice((current) => muteConversation(current));
  }

  function unmuteMic() {
    mutedRef.current = false;
    const resume = listeningModeAfterUnmute(voice);
    setVoice((current) => unmuteConversation(current));
    if (resume === "continuous") void beginListening(true);
  }

  function recoverVoice() {
    const plan = recoveryPlan(voice);
    setError(null);
    setTurnNotice(null);
    keepListeningRef.current = false;
    listenGenerationRef.current += 1;
    transportRef.current.stopListening();
    setVoice((current) => recoverConversation(current));
    setActivity((events) => appendActivity(events, createActivityEvent("session-started", "Owner chose Try again; voice recovered without reload.")));
    // Re-request session metadata (tools, provider status) if it failed to load.
    if (sessionLoadFailed) setSessionAttempt((attempt) => attempt + 1);
    if (plan === "listen") void beginListening(true);
  }

  async function shareScreen() {
    const generation = ++shareGenerationRef.current;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    const result = await requestDisplayMedia((snapshot) => {
      if (generation !== shareGenerationRef.current) return;
      setScreen(snapshot);
    });
    if (generation !== shareGenerationRef.current) {
      result.stream?.getTracks().forEach((track) => track.stop());
      return;
    }
    streamRef.current = result.stream;
    setScreen(result.snapshot);
    if (result.stream) {
      const track = result.stream.getVideoTracks()[0];
      track?.addEventListener("ended", () => {
        if (generation !== shareGenerationRef.current) return;
        streamRef.current = null;
        setScreen(stopScreenShare());
        setActivity((events) => appendActivity(events, createActivityEvent("screen-share-stopped", "The browser ended the shared screen.")));
      });
      setActivity((events) => appendActivity(events, createActivityEvent("screen-share-started", `Owner shared ${result.snapshot.sourceName || "a window"}.`)));
    }
  }

  function endScreen() {
    shareGenerationRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScreen(stopScreenShare());
    setActivity((events) => appendActivity(events, createActivityEvent("screen-share-stopped", "Owner stopped screen sharing.")));
  }

  const currentProject = vault.priorities[0] ?? vault.projects[0] ?? null;

  async function decide(approval: ApprovalRequest, decision: "approved" | "rejected") {
    const response = await fetch("/api/lifeos/agent/approval", {
      method: "POST",
      headers: writeHeaders(),
      body: JSON.stringify({
        sessionId: sessionId(),
        approvalId: approval.id,
        decision,
        projectPath: approval.projectPath ?? currentProject?.path ?? null,
        repository: approval.repository ?? "ebyron357/LifeOS-Enterprise",
        screen: awareness,
      }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      setError(payload.error || "Approval update failed.");
      return;
    }
    setApprovals((current) => {
      const decided = Array.isArray(payload.approvals) ? (payload.approvals as ApprovalRequest[]) : [];
      const byId = new Map(decided.map((item) => [item.id, item]));
      return current.map((item) => byId.get(item.id) ?? item);
    });
    setActivity((events) => appendActivity(events, createActivityEvent(decision === "approved" ? "approval-accepted" : "approval-rejected", `${approval.toolId} ${decision}.`)));
    if (payload.result?.summary) appendLine("tool", payload.result.summary);
  }

  const visibleTranscript = voice.transcriptPrivacy === "hidden" ? [] : transcript;
  const voiceLabel = describeConversationVoice(voice);
  const screenLabel = describeScreenShare(screen, nowMs);
  const alertMessage = error ?? (voice.state === "error" || voice.state === "permission-denied" ? voiceLabel : null);
  const capabilityNotes = capabilities ? describeCapabilityNotes(capabilities) : [];
  const unavailableProviders = availableProviders.filter((provider) => !provider.configured);
  const openaiSelectable = Boolean(openaiStatus?.configured);
  const speechLocale = toSpeechLang(voiceSettings.locale);
  const showNoVoiceWarning = nextSpeech.provider === "browser" && browserVoices.loaded && localeVoices.length === 0;
  const voiceSelectValue = voiceSettings.provider === "openai" ? voiceSettings.openaiVoice : (selectedBrowserVoice?.voiceURI ?? "");
  const nextVoiceLabel = nextSpeech.provider === "openai"
    ? `OpenAI voice (${voiceSettings.openaiVoice || defaultOpenAiVoiceForStyle(voiceSettings.responseStyle)})`
    : `Browser voice (${selectedBrowserVoice?.name ?? "system default"})`;

  return (
    <div className={styles.workspace}>
      <header className={styles.commsHero}>
        <div>
          <span className={styles.eyebrow}>COMMUNICATIONS COMMAND</span>
          <h2>ARIA Communications Hub</h2>
          <p>Talk, type, share your screen, review approvals, and keep the mission moving from one place.</p>
        </div>
        <div className={styles.commsStatus}>
          <span data-tone={voice.microphoneOpen ? "ok" : "warn"}>{voiceLabel}</span>
          <span data-tone={screen.state === "sharing" ? "ok" : "neutral"}>{screen.state === "sharing" ? "Screen shared" : "Screen off"}</span>
          <span data-tone={paused ? "warn" : "ok"}>{paused ? "Agent paused" : "Agent ready"}</span>
        </div>
      </header>

      <nav className={styles.channelBar} aria-label="Communication modes">
        <a href="#conversation-heading">ARIA Chat</a>
        <a href="#agent-activity">Approvals</a>
        <a href="#screen-share">Screen</a>
        <a href="#context-panel">Context</a>
        <a href="#advanced-settings">Settings</a>
      </nav>

      <section className={`${styles.panel} ${styles.conversationPanel}`} aria-label="Conversation">
        <h2 id="conversation-heading" tabIndex={-1}>Conversation</h2>
        <div className={styles.statusRow} aria-live="polite">
          <span className={styles.badge} data-tone={voice.microphoneOpen ? "ok" : "warn"}>{voiceLabel}</span>
          <span className={styles.badge}>{voice.connection}</span>
        </div>
        <div className={`${styles.toolbar} ${styles.voiceControls}`} role="toolbar" aria-label="Voice controls">
          <button type="button" onClick={() => void beginListening(true)}>Start conversation</button>
          <button type="button" onClick={endVoice}>Stop conversation</button>
          <button type="button" onClick={muteMic} disabled={voice.muted}>Mute microphone</button>
          <button type="button" onClick={unmuteMic} disabled={!voice.muted}>Unmute microphone</button>
          <button type="button" onClick={interruptAssistant}>Interrupt assistant</button>
          <button type="button" onClick={() => { setError(null); setVoice((current) => resumeConversation(current)); void beginListening(true); }}>Resume conversation</button>
          <button
            type="button"
            aria-label="Push to talk"
            title="Hold to speak, release to send"
            onPointerDown={(event) => {
              if (event.button > 0) return;
              try {
                event.currentTarget.setPointerCapture(event.pointerId);
              } catch {
                // Capture is optional; listening still starts on hold.
              }
              startPushToTalk();
            }}
            onPointerUp={endPushToTalk}
            onPointerCancel={endPushToTalk}
            onKeyDown={(event) => {
              if (event.repeat) return;
              if (event.key === " " || event.key === "Enter") {
                event.preventDefault();
                startPushToTalk();
              }
            }}
            onKeyUp={(event) => {
              if (event.key === " " || event.key === "Enter") {
                event.preventDefault();
                endPushToTalk();
              }
            }}
          >
            Push to talk
          </button>
        </div>
        <details className={styles.sessionDetails}>
          <summary>Session details & privacy</summary>
          <div className={styles.sessionDetailBody}>
            <p className={styles.runtime} role="status" aria-live="polite" data-testid="speech-runtime">
              {describeSpeechRuntime(speechRuntime)}
            </p>
            <p>State: {voice.state} · Duration {formatDuration(voice.durationMs)} · Audio recording off</p>
            {!micEverStarted ? (
              <p className={styles.note} data-testid="voice-privacy-note">
                Privacy: when you start the microphone, speech recognition audio is processed by your browser or operating
                system&apos;s speech service. When OpenAI voice is used, the reply text is sent to OpenAI to create audio.
                Nothing is recorded or stored by LifeOS.
              </p>
            ) : null}
            {capabilityNotes.map((note) => (
              <p key={note} className={styles.note} data-testid="voice-capability-note">{note}</p>
            ))}
            <div className={styles.toolbar}>
              <button type="button" onClick={() => setTranscript([])}>Clear transcript</button>
              <button type="button" onClick={() => setVoice((current) => setTranscriptPrivacy(current, current.transcriptPrivacy === "hidden" ? "ephemeral" : "hidden"))}>
                Transcript {voice.transcriptPrivacy === "hidden" ? "hidden" : "visible"}
              </button>
            </div>
          </div>
        </details>
        {turnNotice ? <p className={styles.note} role="status" data-testid="turn-notice">{turnNotice}</p> : null}
        <div className={styles.transcript} aria-label="Transcript">
          {!visibleTranscript.length ? <p>Transcript is empty or hidden. Nothing is stored as a permanent recording.</p> : null}
          {visibleTranscript.map((entry) => (
            <p key={entry.id}><strong>{entry.role}:</strong> {entry.text}</p>
          ))}
        </div>
        <form
          className={styles.composer}
          onSubmit={(event) => {
            event.preventDefault();
            const text = draft.trim();
            if (!text) return;
            // Keep the draft when the turn was not sent (another turn in flight or a duplicate).
            if (submitTurn(text, "text")) setDraft("");
          }}
        >
          <label>
            Ask LifeOS
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} aria-label="Ask LifeOS" />
          </label>
          <button type="submit">Send</button>
        </form>
        {alertMessage ? (
          <div className={styles.alert}>
            <p role="alert">{alertMessage}</p>
            <button type="button" onClick={recoverVoice}>Try again</button>
          </div>
        ) : null}
      </section>

      <details className={styles.advanced} id="advanced-settings">
        <summary>Voice & accessibility settings</summary>
        <section className={styles.panel} aria-label="Voice settings">
        <h2>Voice settings</h2>
        <div className={styles.toolbar}>
          <label>
            Provider
            <select
              value={voiceSettings.provider}
              onChange={(event) => updateVoiceSettings({ provider: event.target.value === "openai" ? "openai" : "browser" })}
            >
              <option value="browser">Browser voice (free, on this device)</option>
              <option value="openai" disabled={!openaiSelectable}>
                {openaiSelectable ? "OpenAI voice (owner secret required)" : "OpenAI voice (unavailable)"}
              </option>
            </select>
          </label>
          <label>
            Locale
            <select
              value={voiceSettings.locale}
              onChange={(event) => updateVoiceSettings({ locale: event.target.value, browserVoiceURI: "" })}
            >
              {localeOptionsWith(voiceSettings.locale).map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            Voice
            <select
              value={voiceSelectValue}
              onChange={(event) => {
                const value = event.target.value;
                if (voiceSettings.provider === "openai") updateVoiceSettings({ openaiVoice: isOpenAiTtsVoice(value) ? value : "" });
                else updateVoiceSettings({ browserVoiceURI: value });
              }}
            >
              {voiceSettings.provider === "openai" ? (
                <>
                  <option value="">Style default ({defaultOpenAiVoiceForStyle(voiceSettings.responseStyle)})</option>
                  {OPENAI_TTS_VOICES.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </>
              ) : (
                <>
                  <option value="">System default</option>
                  {localeVoices.map((item) => (
                    <option key={item.voiceURI} value={item.voiceURI}>{item.name}</option>
                  ))}
                </>
              )}
            </select>
          </label>
          <label>
            Input language
            <select
              value={voiceSettings.transcriptionLanguage}
              onChange={(event) => updateVoiceSettings({ transcriptionLanguage: event.target.value })}
            >
              {localeOptionsWith(voiceSettings.transcriptionLanguage).map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            Response style
            <select
              value={voiceSettings.responseStyle}
              onChange={(event) => updateVoiceSettings({ responseStyle: isResponseStyle(event.target.value) ? event.target.value : "balanced" })}
            >
              <option value="balanced">Balanced</option>
              <option value="concise">Concise</option>
              <option value="coach">Teaching coach</option>
            </select>
          </label>
          <label>
            Speed
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={voiceSettings.speechRate}
              onChange={(event) => updateVoiceSettings({ speechRate: Number(event.target.value) })}
            />
          </label>
          <label>
            Pitch
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={voiceSettings.pitch}
              onChange={(event) => updateVoiceSettings({ pitch: Number(event.target.value) })}
            />
          </label>
          <button type="button" onClick={() => void speakReply("This is your current LifeOS voice preview.")}>Preview voice</button>
          <button type="button" onClick={() => writeStoredVoiceSettings(DEFAULT_VOICE_SETTINGS)}>Reset to default</button>
        </div>
        <p>Next reply: {nextVoiceLabel}. Fallback: {fallbackProvider}.</p>
        {voiceSettingsWriteError ? (
          <p className={styles.warning} role="alert" data-testid="voice-settings-not-saved">{voiceSettingsWriteError}</p>
        ) : null}
        {voiceSettings.provider === "openai" && nextSpeech.fallbackReason ? (
          <p className={styles.warning} data-testid="openai-fallback-note">{nextSpeech.fallbackReason} Replies use the browser voice until then.</p>
        ) : null}
        {showNoVoiceWarning ? (
          <p className={styles.warning} role="status" data-testid="no-voice-warning">
            No installed browser voice matches {speechLocale}. LifeOS will not switch languages: replies stay in {speechLocale}, but
            your browser may read them with its default voice or stay silent. Install a voice for {speechLocale} in your
            operating system settings, or choose OpenAI voice.
          </p>
        ) : null}
        {unavailableProviders.map((provider) => (
          <p key={provider.id}>{provider.id} unavailable: {provider.reason}</p>
        ))}
        </section>
      </details>

      <div className={styles.grid}>
        <section className={styles.panel} aria-label="Screen share" id="screen-share">
          <h2>Screen</h2>
          <p className={styles.status}>{screenLabel}</p>
          <div className={styles.toolbar} role="toolbar" aria-label="Screen share controls">
            <button type="button" onClick={() => void shareScreen()}>Share screen</button>
            <button type="button" onClick={endScreen}>Stop sharing</button>
            <button type="button" onClick={() => { setScreen((current) => pauseScreenAnalysis(current)); setActivity((events) => appendActivity(events, createActivityEvent("screen-analysis-paused", "Screen analysis paused."))); }}>Pause analysis</button>
            <button type="button" onClick={() => { setScreen((current) => resumeScreenAnalysis(current, new Date().toISOString())); setActivity((events) => appendActivity(events, createActivityEvent("screen-analysis-resumed", "Screen analysis resumed."))); }}>Resume analysis</button>
          </div>
          <video ref={videoRef} className={styles.preview} autoPlay muted playsInline aria-label="Shared screen preview" />
          <p>LifeOS never starts capture by itself and does not store full recordings.</p>
        </section>

        <section className={styles.panel} aria-label="Agent activity" id="agent-activity">
          <h2>Agent</h2>
          <div className={styles.statusRow} aria-live="polite">
            <span className={styles.badge} data-tone={paused ? "warn" : result?.waitingForOwner ? "warn" : "ok"}>{paused ? "paused" : result?.state ?? "idle"}</span>
            {result?.waitingForOwner ? <span className={styles.badge} data-tone="warn">Waiting for owner</span> : null}
          </div>
          <p>Mission: {result?.mission || "No active mission."}</p>
          <p>Current task: {result?.currentTask || "None"}</p>
          <p>Last completed step: {result?.lastCompletedStep || "None"}</p>
          <p>Next planned step: {result?.nextStep || "None"}</p>
          <div className={styles.toolbar} role="toolbar" aria-label="Agent controls">
            <button type="button" onClick={() => setPaused(true)}>Pause agent</button>
            <button type="button" onClick={() => setPaused(false)}>Resume agent</button>
            <button type="button" onClick={() => { setPaused(true); setResult(null); setApprovals([]); setActivity((events) => appendActivity(events, createActivityEvent("agent-stopped", "Owner stopped the current task."))); }}>Stop task</button>
          </div>
          <label>
            <span>Owner write secret</span>
            <input
              type="password"
              autoComplete="off"
              value={writeSecret}
              onChange={(event) => setWriteSecret(event.target.value)}
              aria-describedby="approval-write-secret-help"
            />
          </label>
          <p id="approval-write-secret-help">
            Required to approve or reject writes, and to authorize OpenAI voice (enter LIFEOS_TTS_SECRET or LIFEOS_WRITE_SECRET).
            Voice session tokens cannot authorize Slack, ClickUp, n8n, Vercel, or other external actions. This value is not stored.
          </p>
          <ul className={styles.list} aria-label="Approvals">
            {approvals.filter((item) => item.decision === "pending").map((item) => (
              <li key={item.id}>
                <strong>{item.summary}</strong>
                <pre aria-label={`Approved arguments for ${item.toolId}`}>{JSON.stringify(item.args, null, 2)}</pre>
                <div className={styles.toolbar}>
                  <button type="button" onClick={() => void decide(item, "approved")}>Approve</button>
                  <button type="button" onClick={() => void decide(item, "rejected")}>Reject</button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.panel} aria-label="Context" id="context-panel">
          <h2>Context</h2>
          <p>Workspace: Conversation</p>
          <p>Current project: {currentProject ? `${currentProject.name} (${currentProject.status})` : "None selected"}</p>
          <p>Active projects: {vault.activeProjects}. Waiting: {vault.waitingOn}. Reviews due: {vault.reviewsDue}.</p>
          <p>Registered tools: {tools.filter((tool) => tool.configured).length} configured, {tools.filter((tool) => !tool.configured).length} unavailable.</p>
        </section>

        <section className={styles.panel} aria-label="Teaching">
          <h2>Teaching</h2>
          {!teaching ? <p>Ask LifeOS to explain, walk you through it, teach you, or show you what to click.</p> : (
            <>
              <p>{teaching.mode}: {teaching.goal}</p>
              <p>Current step {teaching.currentStepIndex + 1} of {teaching.steps.length}: {teaching.steps[teaching.currentStepIndex]?.instruction}</p>
              <p>Look for: {teaching.steps[teaching.currentStepIndex]?.lookFor}</p>
              <p>Expected: {teaching.steps[teaching.currentStepIndex]?.expectedResult}</p>
            </>
          )}
        </section>

        <section className={styles.panel} aria-label="Evidence">
          <h2>Evidence</h2>
          <ul className={styles.list}>
            {activity.slice().reverse().map((event) => (
              <li key={event.id}>
                <strong>{event.kind}</strong>
                <span> {event.message}</span>
                <div>{new Date(event.at).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

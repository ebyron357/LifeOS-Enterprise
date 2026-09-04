"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  markSpeaking,
  markThinking,
  muteConversation,
  resumeConversation,
  setTranscriptPrivacy,
  startConversation,
  stopConversation,
  tickDuration,
  unmuteConversation,
  type ConversationVoiceSession,
} from "@/lib/voice/conversation";
import { createBrowserVoiceTransport } from "@/lib/voice/provider";
import type { TranscriptEntry } from "@/lib/voice/types";
import { createTranscriptEntry } from "@/lib/voice/transcript";
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
const VOICE_SETTINGS_KEY = "lifeos-conversation-voice-settings-v1";

type ResponseStyle = "balanced" | "concise" | "coach";
type VoiceSettings = {
  provider: TtsProviderId;
  locale: string;
  transcriptionLanguage: string;
  speechRate: number;
  pitch: number;
  responseStyle: ResponseStyle;
};

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  provider: "browser",
  locale: "en-US",
  transcriptionLanguage: "en-US",
  speechRate: 1,
  pitch: 1,
  responseStyle: "balanced",
};

function parseVoiceSettings(raw: string | null): VoiceSettings {
  if (!raw) return DEFAULT_VOICE_SETTINGS;
  try {
    const parsed = JSON.parse(raw) as Partial<VoiceSettings>;
    return {
      provider: parsed.provider === "openai" ? "openai" : "browser",
      locale: typeof parsed.locale === "string" && parsed.locale.trim() ? parsed.locale : "en-US",
      transcriptionLanguage: typeof parsed.transcriptionLanguage === "string" && parsed.transcriptionLanguage.trim()
        ? parsed.transcriptionLanguage
        : "en-US",
      speechRate: typeof parsed.speechRate === "number" && Number.isFinite(parsed.speechRate)
        ? Math.max(0.5, Math.min(2, parsed.speechRate))
        : 1,
      pitch: typeof parsed.pitch === "number" && Number.isFinite(parsed.pitch)
        ? Math.max(0.5, Math.min(2, parsed.pitch))
        : 1,
      responseStyle: parsed.responseStyle === "concise" || parsed.responseStyle === "coach" ? parsed.responseStyle : "balanced",
    };
  } catch {
    return DEFAULT_VOICE_SETTINGS;
  }
}

function sessionId(): string {
  if (typeof window === "undefined") return "ssr";
  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const next = `sess-${crypto.randomUUID()}`;
  window.sessionStorage.setItem(SESSION_KEY, next);
  return next;
}

export function AgentConversationWorkspace({ vault }: AgentConversationWorkspaceProps) {
  const [voice, setVoice] = useState<ConversationVoiceSession>(INITIAL_CONVERSATION_VOICE);
  const [screen, setScreen] = useState<ScreenShareSnapshot>(INITIAL_SCREEN_SHARE);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [draft, setDraft] = useState("");
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [result, setResult] = useState<AgentTurnResult | null>(null);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [paused, setPaused] = useState(false);
  const [teaching, setTeaching] = useState<TeachingPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);
  const [availableProviders, setAvailableProviders] = useState<Array<{ id: TtsProviderId; configured: boolean; reason: string | null }>>([]);
  const [activeProvider, setActiveProvider] = useState<TtsProviderId>("browser");
  const [fallbackProvider, setFallbackProvider] = useState<TtsProviderId>("browser");
  const [nowMs, setNowMs] = useState(() => Date.now());
  const streamRef = useRef<MediaStream | null>(null);
  const shareGenerationRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const transportRef = useRef(createBrowserVoiceTransport());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const keepListeningRef = useRef(false);
  const mutedRef = useRef(false);
  const restartListeningRef = useRef<((continuous: boolean) => Promise<void>) | null>(null);
  const lastSubmissionRef = useRef<string>("");
  const skipFirstVoicePersistRef = useRef(true);

  const awareness: ScreenAwarenessSnapshot = useMemo(() => toAwarenessSnapshot(screen, nowMs), [screen, nowMs]);

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
        const providers: Array<{ id: TtsProviderId; configured: boolean; reason: string | null }> = Array.isArray(tts?.providers)
          ? tts.providers
              .map((provider: { id?: string; configured?: boolean; reason?: string | null }) => ({
                id: provider?.id === "openai" ? "openai" : "browser",
                configured: Boolean(provider?.configured),
                reason: typeof provider?.reason === "string" ? provider.reason : null,
              }))
          : [];
        setAvailableProviders(providers);
        setActiveProvider(tts?.activeProvider === "openai" ? "openai" : "browser");
        setFallbackProvider(tts?.fallbackProvider === "openai" ? "openai" : "browser");
        setVoiceSettings((current) => {
          const storedRaw = typeof window === "undefined" ? null : window.localStorage.getItem(VOICE_SETTINGS_KEY);
          const stored = parseVoiceSettings(storedRaw);
          const supported = providers.filter((provider) => provider.configured).map((provider) => provider.id);
          const provider = supported.includes(stored.provider) ? stored.provider : (tts?.activeProvider === "openai" ? "openai" : "browser");
          const next = {
            ...current,
            ...stored,
            provider,
            locale: storedRaw ? stored.locale : payload?.localeDefaults?.locale || current.locale,
            transcriptionLanguage: storedRaw
              ? stored.transcriptionLanguage
              : payload?.localeDefaults?.transcriptionLanguage || current.transcriptionLanguage,
          };
          return next;
        });
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load agent session metadata.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = streamRef.current;
  }, [screen.state]);

  useEffect(() => {
    mutedRef.current = voice.muted;
  }, [voice.muted]);

  useEffect(() => {
    const transport = transportRef.current;
    return () => {
      keepListeningRef.current = false;
      shareGenerationRef.current += 1;
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

  useEffect(() => {
    if (skipFirstVoicePersistRef.current) {
      skipFirstVoicePersistRef.current = false;
      return;
    }
    window.localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify(voiceSettings));
  }, [voiceSettings]);

  const appendLine = useCallback((role: TranscriptEntry["role"], text: string) => {
    setTranscript((entries) => [...entries, createTranscriptEntry(role, text, { temporary: true })].slice(-80));
  }, []);

  const headers = useCallback(() => {
    const next: Record<string, string> = { "Content-Type": "application/json" };
    if (token) next.Authorization = `Bearer ${token}`;
    return next;
  }, [token]);

  const speakReply = useCallback(async (text: string) => {
    if (!text.trim()) return;
    const selected = voiceSettings.provider;
    if (selected === "openai") {
      try {
        const response = await fetch("/api/lifeos/voice/speak", {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({
            text,
            locale: voiceSettings.locale,
            speed: voiceSettings.speechRate,
            style: voiceSettings.responseStyle,
            provider: "openai",
          }),
        });
        if (response.ok) {
          const blob = await response.blob();
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
          }
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.onended = () => {
            URL.revokeObjectURL(url);
            setVoice((current) => (current.muted ? muteConversation(current) : { ...current, speaking: false, processing: false, state: keepListeningRef.current ? "listening" : current.state }));
          };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            setVoice((current) => failConversation(current, "Server-side TTS playback failed."));
          };
          await audio.play();
          return;
        }
      } catch {
        // Fall through to browser synthesis.
      }
    }

    transportRef.current.speak(text, {
      rate: voiceSettings.speechRate,
      pitch: voiceSettings.pitch,
      lang: voiceSettings.locale,
      onEnd: () => {
        setVoice((current) => (current.muted ? muteConversation(current) : { ...current, speaking: false, processing: false, state: keepListeningRef.current ? "listening" : current.state }));
      },
      onError: (message) => setVoice((current) => failConversation(current, message)),
    });
  }, [headers, voiceSettings]);

  const stopPlayback = useCallback(() => {
    transportRef.current.stopSpeaking();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = "";
      audioRef.current = null;
    }
  }, []);

  const sendTurn = useCallback(async (text: string, channel: "text" | "voice") => {
    if (mutedRef.current && channel === "voice") return;
    stopPlayback();
    const normalized = text.trim().toLowerCase();
    const dedupeKey = `${channel}:${normalized}`;
    if (!normalized || lastSubmissionRef.current === dedupeKey) return;
    lastSubmissionRef.current = dedupeKey;
    if (voice.transcriptPrivacy !== "hidden") appendLine("user", text);
    setVoice((current) => markThinking(current));
    setActivity((events) => appendActivity(events, createActivityEvent("mission-started", "Sending owner request.")));
    try {
      const response = await fetch("/api/lifeos/agent/turn", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          sessionId: sessionId(),
          text,
          channel,
          screen: awareness,
          paused,
          pendingApprovals: approvals,
          transcriptPrivacy: voice.transcriptPrivacy,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Agent turn failed.");
      const next = payload.result as AgentTurnResult;
      setResult(next);
      setApprovals(next.approvals);
      setTeaching(next.teaching);
      setActivity((events) => [...events, ...next.activity].slice(-80));
      if (voice.transcriptPrivacy !== "hidden") appendLine("lifeos", next.reply);
      if (mutedRef.current || voice.muted || !voice.startedAt) {
        setVoice((current) => ({ ...current, processing: false, state: current.muted ? "muted" : current.state === "stopped" ? "stopped" : "listening" }));
        return;
      }
      setVoice((current) => markSpeaking(current));
      await speakReply(next.spokenReply);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Agent turn failed.";
      setError(message);
      setVoice((current) => failConversation(current, message));
      appendLine("error", message);
    } finally {
      window.setTimeout(() => {
        if (lastSubmissionRef.current === dedupeKey) lastSubmissionRef.current = "";
      }, 1200);
    }
  }, [appendLine, approvals, awareness, headers, paused, speakReply, stopPlayback, voice.muted, voice.startedAt, voice.transcriptPrivacy]);

  const beginListening = useCallback(async (continuous: boolean) => {
    if (mutedRef.current) return;
    keepListeningRef.current = continuous;
    const allowed = await transportRef.current.requestPermission();
    if (!allowed) {
      setVoice((current) => denyMicrophone(current));
      return;
    }
    setVoice((current) => startConversation(current, new Date().toISOString()));
    setActivity((events) => appendActivity(events, createActivityEvent("session-started", "Voice conversation started.")));
    await transportRef.current.startListening({
      lang: voiceSettings.transcriptionLanguage,
      continuous,
      onInterim: (text) => {
        if (mutedRef.current || voice.transcriptPrivacy === "hidden") return;
        setTranscript((entries) => {
          const without = entries.filter((entry) => !(entry.role === "user" && entry.interim));
          return [...without, createTranscriptEntry("user", text, { interim: true, temporary: true })];
        });
      },
      onFinal: (text) => {
        if (mutedRef.current) return;
        if (text) {
          stopPlayback();
          void sendTurn(text, "voice");
        }
      },
      onError: (message) => setVoice((current) => failConversation(current, message)),
      onEnd: () => {
        if (keepListeningRef.current && !mutedRef.current) {
          void restartListeningRef.current?.(true);
        }
      },
    });
  }, [sendTurn, stopPlayback, voice.transcriptPrivacy, voiceSettings.transcriptionLanguage]);

  useEffect(() => {
    restartListeningRef.current = beginListening;
  }, [beginListening]);

  function endVoice() {
    keepListeningRef.current = false;
    transportRef.current.disconnect();
    stopPlayback();
    setVoice((current) => stopConversation(current));
    setActivity((events) => appendActivity(events, createActivityEvent("session-stopped", "Voice conversation stopped.")));
  }

  function startPushToTalk() {
    setVoice((current) => enablePushToTalk(current));
    void beginListening(false);
  }

  function endPushToTalk() {
    keepListeningRef.current = false;
    transportRef.current.releaseListening();
    setVoice((current) => releasePushToTalk(current));
  }

  function muteMic() {
    keepListeningRef.current = false;
    mutedRef.current = true;
    transportRef.current.stopListening();
    stopPlayback();
    setVoice((current) => muteConversation(current));
  }

  function unmuteMic() {
    mutedRef.current = false;
    const continuous = voice.mode !== "push-to-talk";
    setVoice((current) => unmuteConversation(current));
    if (voice.state !== "stopped" && voice.startedAt) {
      void beginListening(continuous);
    }
  }

  async function shareScreen() {
    const generation = ++shareGenerationRef.current;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    const result = await requestDisplayMedia();
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
      headers: headers(),
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

  return (
    <div className={styles.workspace}>
      <section className={styles.panel} aria-label="Conversation">
        <h2>Conversation</h2>
        <div className={styles.statusRow} aria-live="polite">
          <span className={styles.badge} data-tone={voice.microphoneOpen ? "ok" : "warn"}>{voiceLabel}</span>
          <span className={styles.badge} data-voice-state={voice.state}>State: {voice.state}</span>
          <span className={styles.badge}>{voice.connection}</span>
          <span className={styles.badge}>Duration {formatDuration(voice.durationMs)}</span>
          <span className={styles.badge}>Audio recording off</span>
        </div>
        <div className={styles.toolbar} role="toolbar" aria-label="Voice controls">
          <button type="button" onClick={() => void beginListening(true)}>Start conversation</button>
          <button type="button" onClick={endVoice}>Stop conversation</button>
          <button type="button" onClick={muteMic} disabled={voice.muted}>Mute microphone</button>
          <button type="button" onClick={unmuteMic} disabled={!voice.muted}>Unmute microphone</button>
          <button type="button" onClick={() => { stopPlayback(); setVoice((current) => interruptSpeech(current)); }}>Interrupt assistant</button>
          <button type="button" onClick={() => { setVoice((current) => resumeConversation(current)); void beginListening(true); }}>Resume conversation</button>
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
          <button type="button" onClick={() => setTranscript([])}>Clear transcript</button>
          <button type="button" onClick={() => setVoice((current) => setTranscriptPrivacy(current, current.transcriptPrivacy === "hidden" ? "ephemeral" : "hidden"))}>
            Transcript {voice.transcriptPrivacy === "hidden" ? "hidden" : "visible"}
          </button>
        </div>
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
            setDraft("");
            void sendTurn(text, "text");
          }}
        >
          <label>
            Ask LifeOS
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} aria-label="Ask LifeOS" />
          </label>
          <button type="submit">Send</button>
        </form>
        {error ? <p role="alert">{error}</p> : null}
      </section>

      <section className={styles.panel} aria-label="Voice settings">
        <h2>Voice settings</h2>
        <div className={styles.toolbar}>
          <label>
            Provider
            <select
              value={voiceSettings.provider}
              onChange={(event) => setVoiceSettings((current) => ({ ...current, provider: event.target.value === "openai" ? "openai" : "browser" }))}
            >
              {availableProviders.filter((provider) => provider.configured).map((provider) => (
                <option key={provider.id} value={provider.id}>{provider.id}</option>
              ))}
              {!availableProviders.some((provider) => provider.configured) ? <option value="browser">browser</option> : null}
            </select>
          </label>
          <label>
            Locale
            <select
              value={voiceSettings.locale}
              onChange={(event) => setVoiceSettings((current) => ({ ...current, locale: event.target.value }))}
            >
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="zh-TW">中文（台灣）</option>
              <option value="fr-FR">Français</option>
            </select>
          </label>
          <label>
            Input language
            <select
              value={voiceSettings.transcriptionLanguage}
              onChange={(event) => setVoiceSettings((current) => ({ ...current, transcriptionLanguage: event.target.value }))}
            >
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="zh-TW">中文（台灣）</option>
              <option value="fr-FR">Français</option>
            </select>
          </label>
          <label>
            Response style
            <select
              value={voiceSettings.responseStyle}
              onChange={(event) => setVoiceSettings((current) => ({ ...current, responseStyle: event.target.value as ResponseStyle }))}
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
              onChange={(event) => setVoiceSettings((current) => ({ ...current, speechRate: Number(event.target.value) }))}
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
              onChange={(event) => setVoiceSettings((current) => ({ ...current, pitch: Number(event.target.value) }))}
            />
          </label>
          <button type="button" onClick={() => void speakReply("This is your current LifeOS voice preview.")}>Preview voice</button>
          <button type="button" onClick={() => setVoiceSettings(DEFAULT_VOICE_SETTINGS)}>Reset to default</button>
        </div>
        <p>Active provider: {activeProvider}. Fallback: {fallbackProvider}.</p>
        {availableProviders.filter((provider) => !provider.configured).map((provider) => (
          <p key={provider.id}>{provider.id} unavailable: {provider.reason}</p>
        ))}
      </section>

      <div className={styles.grid}>
        <section className={styles.panel} aria-label="Screen share">
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

        <section className={styles.panel} aria-label="Agent activity">
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
          <ul className={styles.list} aria-label="Approvals">
            {approvals.filter((item) => item.decision === "pending").map((item) => (
              <li key={item.id}>
                <strong>{item.summary}</strong>
                <div className={styles.toolbar}>
                  <button type="button" onClick={() => void decide(item, "approved")}>Approve</button>
                  <button type="button" onClick={() => void decide(item, "rejected")}>Reject</button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.panel} aria-label="Context">
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

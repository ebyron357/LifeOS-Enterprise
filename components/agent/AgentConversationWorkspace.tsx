"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ActivityEvent, AgentTurnResult, ApprovalRequest, ScreenAwarenessSnapshot, TeachingPlan, ToolDefinition } from "@/lib/agent/types";
import type { VaultDashboardData } from "@/lib/lifeos/types";
import { appendActivity, createActivityEvent } from "@/lib/agent/activity";
import {
  describeConversationVoice,
  enablePushToTalk,
  failConversation,
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
import styles from "./AgentConversationWorkspace.module.css";

type AgentConversationWorkspaceProps = {
  vault: Pick<VaultDashboardData, "projects" | "agents" | "activeProjects" | "waitingOn" | "reviewsDue" | "priorities">;
};

const SESSION_KEY = "lifeos-agent-session-id";

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
  const [nowMs, setNowMs] = useState(() => Date.now());
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const transportRef = useRef(createBrowserVoiceTransport());
  const keepListeningRef = useRef(false);
  const restartListeningRef = useRef<((continuous: boolean) => Promise<void>) | null>(null);

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

  const appendLine = useCallback((role: TranscriptEntry["role"], text: string) => {
    setTranscript((entries) => [...entries, createTranscriptEntry(role, text, { temporary: true })].slice(-80));
  }, []);

  const headers = useCallback(() => {
    const next: Record<string, string> = { "Content-Type": "application/json" };
    if (token) next.Authorization = `Bearer ${token}`;
    return next;
  }, [token]);

  const sendTurn = useCallback(async (text: string, channel: "text" | "voice") => {
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
      if (voice.muted || !voice.startedAt) {
        setVoice((current) => ({ ...current, processing: false, state: current.muted ? "muted" : current.state === "stopped" ? "stopped" : "listening" }));
        return;
      }
      setVoice((current) => markSpeaking(current));
      transportRef.current.speak(next.spokenReply, {
        rate: 1,
        lang: "en-US",
        onEnd: () => {
          setVoice((current) => (current.muted ? muteConversation(current) : { ...current, speaking: false, processing: false, state: keepListeningRef.current ? "listening" : current.state }));
        },
      });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Agent turn failed.";
      setError(message);
      setVoice((current) => failConversation(current, message));
      appendLine("error", message);
    }
  }, [appendLine, approvals, awareness, headers, paused, voice.muted, voice.startedAt, voice.transcriptPrivacy]);

  const beginListening = useCallback(async (continuous: boolean) => {
    keepListeningRef.current = continuous;
    const allowed = await transportRef.current.requestPermission();
    if (!allowed) {
      setVoice((current) => failConversation(current, "Microphone permission was denied."));
      return;
    }
    setVoice((current) => startConversation(current, new Date().toISOString()));
    setActivity((events) => appendActivity(events, createActivityEvent("session-started", "Voice conversation started.")));
    await transportRef.current.startListening({
      lang: "en-US",
      continuous,
      onInterim: (text) => {
        if (voice.transcriptPrivacy === "hidden") return;
        setTranscript((entries) => {
          const without = entries.filter((entry) => !(entry.role === "user" && entry.interim));
          return [...without, createTranscriptEntry("user", text, { interim: true, temporary: true })];
        });
      },
      onFinal: (text) => {
        if (text) void sendTurn(text, "voice");
      },
      onError: (message) => setVoice((current) => failConversation(current, message)),
      onEnd: () => {
        if (keepListeningRef.current && !voice.muted) {
          void restartListeningRef.current?.(true);
        }
      },
    });
  }, [sendTurn, voice.muted, voice.transcriptPrivacy]);

  useEffect(() => {
    restartListeningRef.current = beginListening;
  }, [beginListening]);

  function endVoice() {
    keepListeningRef.current = false;
    transportRef.current.disconnect();
    setVoice((current) => stopConversation(current));
    setActivity((events) => appendActivity(events, createActivityEvent("session-stopped", "Voice conversation stopped.")));
  }

  async function shareScreen() {
    const result = await requestDisplayMedia();
    streamRef.current = result.stream;
    setScreen(result.snapshot);
    if (result.stream) {
      const track = result.stream.getVideoTracks()[0];
      track?.addEventListener("ended", () => {
        streamRef.current = null;
        setScreen(stopScreenShare());
        setActivity((events) => appendActivity(events, createActivityEvent("screen-share-stopped", "The browser ended the shared screen.")));
      });
      setActivity((events) => appendActivity(events, createActivityEvent("screen-share-started", `Owner shared ${result.snapshot.sourceName || "a window"}.`)));
    }
  }

  function endScreen() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScreen(stopScreenShare());
    setActivity((events) => appendActivity(events, createActivityEvent("screen-share-stopped", "Owner stopped screen sharing.")));
  }

  async function decide(approval: ApprovalRequest, decision: "approved" | "rejected") {
    const response = await fetch("/api/lifeos/agent/approval", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        sessionId: sessionId(),
        approvalId: approval.id,
        decision,
        pendingApprovals: approvals,
        screen: awareness,
      }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      setError(payload.error || "Approval update failed.");
      return;
    }
    setApprovals(payload.approvals);
    setActivity((events) => appendActivity(events, createActivityEvent(decision === "approved" ? "approval-accepted" : "approval-rejected", `${approval.toolId} ${decision}.`)));
    if (payload.result?.summary) appendLine("tool", payload.result.summary);
  }

  const currentProject = vault.priorities[0] ?? vault.projects[0] ?? null;
  const visibleTranscript = voice.transcriptPrivacy === "hidden" ? [] : transcript;
  const voiceLabel = describeConversationVoice(voice);
  const screenLabel = describeScreenShare(screen, nowMs);

  return (
    <div className={styles.workspace}>
      <section className={styles.panel} aria-label="Conversation">
        <h2>Conversation</h2>
        <div className={styles.statusRow} aria-live="polite">
          <span className={styles.badge} data-tone={voice.microphoneOpen ? "ok" : "warn"}>{voiceLabel}</span>
          <span className={styles.badge}>{voice.connection}</span>
          <span className={styles.badge}>Duration {formatDuration(voice.durationMs)}</span>
          <span className={styles.badge}>Audio recording off</span>
        </div>
        <div className={styles.toolbar} role="toolbar" aria-label="Voice controls">
          <button type="button" onClick={() => void beginListening(true)}>Start conversation</button>
          <button type="button" onClick={endVoice}>Stop conversation</button>
          <button type="button" onClick={() => setVoice((current) => muteConversation(current))} disabled={voice.muted}>Mute microphone</button>
          <button type="button" onClick={() => setVoice((current) => unmuteConversation(current))} disabled={!voice.muted}>Unmute microphone</button>
          <button type="button" onClick={() => { transportRef.current.stopSpeaking(); setVoice((current) => interruptSpeech(current)); }}>Interrupt assistant</button>
          <button type="button" onClick={() => { setVoice((current) => resumeConversation(current)); void beginListening(true); }}>Resume conversation</button>
          <button type="button" onClick={() => { setVoice((current) => enablePushToTalk(current)); void beginListening(false); }}>Push to talk</button>
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

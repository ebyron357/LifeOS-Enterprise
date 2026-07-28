"use client";

import { useMachine } from "@xstate/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AgentBrief, ProjectBrief } from "@/lib/lifeos/types";
import { useBrowserStorage } from "@/lib/lifeos/use-browser-storage";
import { parseVoiceCommand } from "@/lib/voice/commands";
import { voiceMachine } from "@/lib/voice/machine";
import { createBrowserVoiceTransport, selectVoiceTransport } from "@/lib/voice/provider";
import {
  appendFinalUserTranscript,
  createTranscriptEntry,
  upsertInterimTranscript,
} from "@/lib/voice/transcript";
import {
  DEFAULT_VOICE_SETTINGS,
  type PendingWriteConfirmation,
  type TranscriptEntry,
  type VoiceProviderId,
  type VoiceSettings,
} from "@/lib/voice/types";
import { executeReadTool, getVoiceTool } from "@/lib/voice/tools";
import { VoiceConfirmation } from "./VoiceConfirmation";
import { VoiceControls } from "./VoiceControls";
import { VoiceError } from "./VoiceError";
import { VoicePresence } from "./VoicePresence";
import { VoiceSettingsPanel } from "./VoiceSettings";
import { VoiceStatus } from "./VoiceStatus";
import { VoiceTranscript } from "./VoiceTranscript";
import { VoiceVisualizer } from "./VoiceVisualizer";
import styles from "./VoiceConsole.module.css";

type VoiceConsoleProps = {
  projects: ProjectBrief[];
  agents: AgentBrief[];
  activeProjects: number;
  waitingOn: number;
  reviewsDue: number;
};

const defaultSettings = DEFAULT_VOICE_SETTINGS;

export function VoiceConsole({
  projects,
  agents,
  activeProjects,
  waitingOn,
  reviewsDue,
}: VoiceConsoleProps) {
  const router = useRouter();
  const [snapshot, send] = useMachine(voiceMachine);
  const state = snapshot.value as string;
  const [settings, setSettings] = useBrowserStorage<VoiceSettings>("lifeos-voice-settings-v1", defaultSettings);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [provider, setProvider] = useState<VoiceProviderId>("browser");
  const [sessionMessage, setSessionMessage] = useState("Voice loads in safe browser-fallback mode until provider credentials are configured.");
  const [pending, setPending] = useState<PendingWriteConfirmation | null>(null);
  const [writeSecret, setWriteSecret] = useState("");
  const transportRef = useRef(createBrowserVoiceTransport());
  const lastSpokenRef = useRef("");
  const inFlightRequestRef = useRef<string | null>(null);

  const context = useMemo(() => ({
    projects,
    agents,
    activeProjects,
    waitingOn,
    reviewsDue,
    locale: settings.locale,
  }), [projects, agents, activeProjects, waitingOn, reviewsDue, settings.locale]);

  const append = useCallback((entry: TranscriptEntry) => {
    setTranscript((current) => [...current, entry].slice(-80));
  }, []);

  const speak = useCallback((text: string) => {
    if (!settings.audioEnabled || settings.muted) {
      append(createTranscriptEntry("lifeos", text, { temporary: true }));
      send({ type: "SPEAK", text });
      send({ type: "SPEECH_END" });
      return;
    }
    lastSpokenRef.current = text;
    append(createTranscriptEntry("lifeos", text, { temporary: true }));
    send({ type: "SPEAK", text });
    transportRef.current.speak(text, {
      rate: settings.speechRate,
      lang: settings.responseLanguage,
      onEnd: () => send({ type: "SPEECH_END" }),
      onError: (message) => send({ type: "FAIL", message }),
    });
  }, [append, send, settings.audioEnabled, settings.muted, settings.responseLanguage, settings.speechRate]);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        const response = await fetch("/api/lifeos/voice/session", { cache: "no-store" });
        const payload = await response.json() as {
          provider?: VoiceProviderId;
          reason?: string;
          configured?: boolean;
        };
        if (cancelled) return;
        if (!payload.configured || payload.provider === "none") {
          setProvider("none");
          setSessionMessage(payload.reason || "Voice is disabled. Written LifeOS interaction remains available.");
          transportRef.current = createBrowserVoiceTransport();
          send({ type: "DISABLE" });
          return;
        }
        send({ type: "ENABLE" });
        const nextProvider = payload.provider || "browser";
        setProvider(nextProvider);
        setSessionMessage(payload.reason || sessionMessage);
        transportRef.current = selectVoiceTransport(nextProvider) || createBrowserVoiceTransport();
        send({ type: "CONNECTED" });
      } catch {
        if (cancelled) return;
        setProvider("none");
        transportRef.current = createBrowserVoiceTransport();
        setSessionMessage("Voice session endpoint unavailable. Written LifeOS interaction remains available.");
        send({ type: "DISABLE" });
      }
    }
    void boot();
    return () => {
      cancelled = true;
      transportRef.current.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.altKey && event.key.toLowerCase() === "v") {
        event.preventDefault();
        if (state === "listening") stopListening();
        else void startListening();
      }
      if (event.key === "Escape") {
        stopSpeaking();
        stopListening();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function startListening() {
    if (settings.muted) {
      send({ type: "FAIL", message: "Unmute before listening." });
      return;
    }
    send({ type: "REQUEST_PERMISSION" });
    const allowed = await transportRef.current.requestPermission();
    if (!allowed) {
      send({ type: "PERMISSION_DENIED", message: "Microphone permission denied. LifeOS remains usable without voice." });
      append(createTranscriptEntry("error", "Microphone permission denied.", { temporary: true }));
      return;
    }
    send({ type: "PERMISSION_GRANTED" });
    send({ type: "START_LISTENING" });
    await transportRef.current.startListening({
      lang: settings.transcriptionLanguage === "fr" ? "fr-FR" : settings.transcriptionLanguage === "ht" ? "ht-HT" : "en-US",
      onInterim: (text) => setTranscript((current) => upsertInterimTranscript(current, text)),
      onFinal: (text) => {
        setTranscript((current) => appendFinalUserTranscript(current, text));
        send({ type: "TRANSCRIPT_FINAL", text });
        void handleUtterance(text);
      },
      onError: (message) => {
        send({ type: "FAIL", message });
        append(createTranscriptEntry("error", message, { temporary: true }));
      },
      onEnd: () => {
        if (snapshot.matches("listening")) send({ type: "STOP_LISTENING" });
      },
    });
  }

  function stopListening() {
    transportRef.current.stopListening();
    send({ type: "STOP_LISTENING" });
  }

  function stopSpeaking() {
    transportRef.current.stopSpeaking();
    send({ type: "INTERRUPT" });
    send({ type: "RESET" });
  }

  function replay() {
    if (!lastSpokenRef.current) return;
    speak(lastSpokenRef.current);
  }

  async function handleUtterance(text: string) {
    send({ type: "THINK" });
    const parsed = parseVoiceCommand(text, context);

    if (parsed.kind === "control") {
      if (parsed.action === "stop") {
        stopSpeaking();
        stopListening();
        speak("Stopped.");
        return;
      }
      if (parsed.action === "repeat") {
        replay();
        return;
      }
      if (parsed.action === "speak_slower") {
        setSettings({ ...settings, speechRate: Math.max(0.7, Number((settings.speechRate - 0.15).toFixed(2))) });
        speak("Speaking slower.");
        return;
      }
      if (parsed.action === "audio_off") {
        setSettings({ ...settings, audioEnabled: false });
        transportRef.current.stopSpeaking();
        append(createTranscriptEntry("system", "Audio responses disabled.", { temporary: true }));
        send({ type: "RESET" });
        return;
      }
      if (parsed.action === "clear") {
        setTranscript([]);
        send({ type: "RESET" });
        return;
      }
    }

    if (parsed.kind === "unknown") {
      speak("I did not recognize that LifeOS command. Try asking for the morning brief, blocked projects, or to open a project by name.");
      return;
    }

    if (parsed.kind === "read") {
      const local = executeReadTool(parsed.tool, context, parsed.args || {});
      append(createTranscriptEntry("tool", `Ran ${parsed.tool}`, { temporary: true }));
      if (local.navigation === "map" || local.navigation === "board") {
        window.dispatchEvent(new CustomEvent("lifeos-operations-view", { detail: { view: local.navigation } }));
      } else if (local.navigation?.startsWith("/")) {
        router.push(local.navigation);
      }
      speak(local.spokenResult);
      return;
    }

    if (parsed.kind !== "write") {
      speak("I did not recognize that LifeOS command. Try asking for the morning brief, blocked projects, or to open a project by name.");
      return;
    }

    // Write path: require explicit confirmation and never auto-execute.
    const tool = getVoiceTool(parsed.tool);
    if (!tool) {
      speak("That write tool is not registered.");
      return;
    }
    const requestId = `voice-write-${Date.now()}`;
    const confirmation: PendingWriteConfirmation = {
      toolName: parsed.tool,
      summary: parsed.summary,
      spokenSummary: `${parsed.summary}. Say confirm to stage it, or cancel to abort. This will not write to main.`,
      payload: parsed.args,
      requestId,
    };
    setPending(confirmation);
    send({ type: "NEED_CONFIRMATION", confirmation });
    append(createTranscriptEntry("confirmation", confirmation.summary, { temporary: true }));
    speak(confirmation.spokenSummary);
  }

  async function confirmWrite() {
    if (!pending) return;
    if (inFlightRequestRef.current === pending.requestId) return;
    inFlightRequestRef.current = pending.requestId;
    send({ type: "EXECUTE_TOOL", requestId: pending.requestId });
    try {
      const response = await fetch("/api/lifeos/voice/tools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(writeSecret ? { Authorization: `Bearer ${writeSecret}` } : {}),
        },
        body: JSON.stringify({
          toolName: pending.toolName,
          args: pending.payload,
          requestId: pending.requestId,
          confirmed: true,
        }),
      });
      const payload = await response.json() as {
        ok?: boolean;
        error?: string;
        result?: { spokenResult?: string; humanResult?: string; stagedChange?: Record<string, unknown> };
      };
      if (!response.ok || !payload.ok) {
        const message = payload.error || "Unable to stage the change.";
        append(createTranscriptEntry("error", message, { temporary: true }));
        send({ type: "FAIL", message });
        speak(message);
        return;
      }
      if (payload.result?.stagedChange) {
        window.dispatchEvent(new CustomEvent("lifeos-voice-staged-change", { detail: payload.result.stagedChange }));
      }
      const spoken = payload.result?.spokenResult || "Change staged in the browser only.";
      append(createTranscriptEntry("tool", payload.result?.humanResult || spoken, { temporary: true }));
      setPending(null);
      setWriteSecret("");
      send({ type: "TOOL_DONE", spoken, human: spoken });
      speak(spoken);
    } catch {
      send({ type: "FAIL", message: "Network failure while staging the voice command." });
      speak("Network failure while staging the voice command.");
    } finally {
      inFlightRequestRef.current = null;
    }
  }

  function cancelWrite() {
    setPending(null);
    send({ type: "CANCEL_CONFIRMATION" });
    speak("Cancelled. No change was staged.");
  }

  const micActive = Boolean(snapshot.context.microphoneActive);
  const speakingActive = Boolean(snapshot.context.speakingActive);

  return (
    <section className={styles.console} aria-label="LifeOS voice console">
      <header className={styles.header}>
        <div>
          <p className="widget-eyebrow">Verbal + Audio V1</p>
          <h2>Voice console</h2>
          <p>Push-to-talk only. No wake word. Transcripts stay temporary in this browser unless you copy them.</p>
        </div>
        <VoicePresence state={String(state)} micActive={micActive} />
      </header>

      <VoiceStatus
        state={String(state)}
        provider={provider}
        message={sessionMessage}
        micActive={micActive}
        speakingActive={speakingActive}
      />

      <VoiceVisualizer
        mode={micActive ? "input" : speakingActive ? "output" : "idle"}
        reducedMotion={typeof document !== "undefined" && document.documentElement.dataset.lifeosReducedMotion === "true"}
      />

      <VoiceControls
        state={String(state)}
        muted={settings.muted}
        audioEnabled={settings.audioEnabled}
        onPushToTalk={() => void startListening()}
        onStopListening={stopListening}
        onStopSpeaking={stopSpeaking}
        onMute={() => {
          setSettings({ ...settings, muted: true });
          stopListening();
          stopSpeaking();
          send({ type: "MUTE" });
        }}
        onUnmute={() => {
          setSettings({ ...settings, muted: false });
          send({ type: "UNMUTE" });
        }}
        onReplay={replay}
        onClear={() => setTranscript([])}
        onToggleTranscript={() => setExpanded((value) => !value)}
        transcriptExpanded={expanded}
      />

      {expanded ? <VoiceTranscript entries={transcript} /> : null}

      {pending ? (
        <VoiceConfirmation
          confirmation={pending}
          writeSecret={writeSecret}
          onWriteSecretChange={setWriteSecret}
          onConfirm={() => void confirmWrite()}
          onCancel={cancelWrite}
        />
      ) : null}

      {snapshot.matches("error") ? (
        <VoiceError
          message={snapshot.context.errorMessage || "Voice error"}
          onRecover={() => send({ type: "RESET" })}
        />
      ) : null}

      <VoiceSettingsPanel settings={settings} onChange={setSettings} />
    </section>
  );
}

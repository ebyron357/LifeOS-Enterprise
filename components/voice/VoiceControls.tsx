"use client";

import styles from "./VoiceConsole.module.css";

type VoiceControlsProps = {
  state: string;
  muted: boolean;
  audioEnabled: boolean;
  transcriptExpanded: boolean;
  voiceEnabled: boolean;
  onPushToTalk: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
  onMute: () => void;
  onUnmute: () => void;
  onReplay: () => void;
  onClear: () => void;
  onToggleTranscript: () => void;
};

export function VoiceControls({
  state,
  muted,
  audioEnabled,
  transcriptExpanded,
  voiceEnabled,
  onPushToTalk,
  onStopListening,
  onStopSpeaking,
  onMute,
  onUnmute,
  onReplay,
  onClear,
  onToggleTranscript,
}: VoiceControlsProps) {
  const listening = state === "listening";
  return (
    <div className={styles.controls} role="group" aria-label="Voice controls">
      <button
        type="button"
        className={styles.primary}
        onClick={listening ? onStopListening : onPushToTalk}
        aria-pressed={listening}
        disabled={!voiceEnabled && !listening}
      >
        {listening ? "Stop listening" : voiceEnabled ? "Push to talk" : "Voice disabled"}
      </button>
      <button type="button" onClick={onStopSpeaking} disabled={!voiceEnabled && !listening}>Stop audio</button>
      <button type="button" onClick={muted ? onUnmute : onMute} aria-pressed={muted} disabled={!voiceEnabled}>
        {muted ? "Unmute" : "Mute"}
      </button>
      <button type="button" onClick={onReplay} disabled={!voiceEnabled || !audioEnabled}>Replay</button>
      <button type="button" onClick={onClear} disabled={!voiceEnabled}>Clear transcript</button>
      <button type="button" onClick={onToggleTranscript} aria-expanded={transcriptExpanded}>
        {transcriptExpanded ? "Collapse transcript" : "Expand transcript"}
      </button>
      <span className={styles.shortcut}>
        {voiceEnabled ? "Alt+V push-to-talk · Esc stop" : "Set LIFEOS_VOICE_ENABLED=true to enable voice"}
      </span>
    </div>
  );
}

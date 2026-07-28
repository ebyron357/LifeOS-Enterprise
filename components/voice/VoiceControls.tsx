"use client";

import styles from "./VoiceConsole.module.css";

type VoiceControlsProps = {
  state: string;
  muted: boolean;
  audioEnabled: boolean;
  transcriptExpanded: boolean;
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
      <button type="button" className={styles.primary} onClick={listening ? onStopListening : onPushToTalk} aria-pressed={listening}>
        {listening ? "Stop listening" : "Push to talk"}
      </button>
      <button type="button" onClick={onStopSpeaking}>Stop audio</button>
      <button type="button" onClick={muted ? onUnmute : onMute} aria-pressed={muted}>
        {muted ? "Unmute" : "Mute"}
      </button>
      <button type="button" onClick={onReplay} disabled={!audioEnabled}>Replay</button>
      <button type="button" onClick={onClear}>Clear transcript</button>
      <button type="button" onClick={onToggleTranscript} aria-expanded={transcriptExpanded}>
        {transcriptExpanded ? "Collapse transcript" : "Expand transcript"}
      </button>
      <span className={styles.shortcut}>Alt+V push-to-talk · Esc stop</span>
    </div>
  );
}

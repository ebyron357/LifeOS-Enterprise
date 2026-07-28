"use client";

import styles from "./VoiceConsole.module.css";

export function VoiceStatus({
  state,
  provider,
  message,
  micActive,
  speakingActive,
}: {
  state: string;
  provider: string;
  message: string;
  micActive: boolean;
  speakingActive: boolean;
}) {
  return (
    <div className={styles.status} aria-live="polite">
      <div><span>State</span><strong>{state}</strong></div>
      <div><span>Provider</span><strong>{provider}</strong></div>
      <div><span>Microphone</span><strong>{micActive ? "active" : "inactive"}</strong></div>
      <div><span>Speaking</span><strong>{speakingActive ? "yes" : "no"}</strong></div>
      <p>{message}</p>
    </div>
  );
}

"use client";

import { transcriptRoleLabels } from "@/lib/voice/transcript";
import type { TranscriptEntry } from "@/lib/voice/types";
import styles from "./VoiceConsole.module.css";

export function VoiceTranscript({ entries }: { entries: TranscriptEntry[] }) {
  return (
    <div className={styles.transcript} aria-label="Voice transcript" aria-live="polite">
      <div className={styles.transcriptMeta}>
        <strong>Transcript</strong>
        <span>Temporary in this browser · not saved to the vault</span>
      </div>
      {!entries.length ? <p className={styles.empty}>No speech yet. Use push-to-talk.</p> : null}
      <ul>
        {entries.map((entry) => (
          <li key={entry.id} data-role={entry.role} data-interim={entry.interim ? "true" : "false"}>
            <span className={styles.role}>{transcriptRoleLabels[entry.role]}</span>
            <p>{entry.text}{entry.interim ? "…" : ""}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

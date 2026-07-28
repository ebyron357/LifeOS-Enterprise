"use client";

import type { PendingWriteConfirmation } from "@/lib/voice/types";
import styles from "./VoiceConsole.module.css";

export function VoiceConfirmation({
  confirmation,
  writeSecret,
  onWriteSecretChange,
  onConfirm,
  onCancel,
}: {
  confirmation: PendingWriteConfirmation;
  writeSecret: string;
  onWriteSecretChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <section className={styles.confirmation} aria-label="Voice write confirmation" role="alertdialog">
      <p className="widget-eyebrow">Confirmation required</p>
      <h3>Stage this change?</h3>
      <p>{confirmation.summary}</p>
      <p className={styles.note}>This stages a browser proposal only. It does not write to main or change canonical vault files.</p>
      <label>
        <span>Write authorization secret</span>
        <input
          type="password"
          autoComplete="off"
          value={writeSecret}
          onChange={(event) => onWriteSecretChange(event.target.value)}
        />
      </label>
      <div className={styles.confirmationActions}>
        <button type="button" className={styles.primary} onClick={onConfirm}>Confirm and stage</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </section>
  );
}

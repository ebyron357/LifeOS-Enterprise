"use client";

import styles from "./VoiceConsole.module.css";

export function VoiceError({ message, onRecover }: { message: string; onRecover: () => void }) {
  return (
    <div className={styles.error} role="alert">
      <strong>Voice error</strong>
      <p>{message}</p>
      <button type="button" onClick={onRecover}>Recover</button>
    </div>
  );
}

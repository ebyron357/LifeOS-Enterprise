"use client";

import styles from "./VoiceConsole.module.css";

/**
 * Abstract command presence with CSS fallback.
 * Optional Rive asset can be layered later without blocking V1.
 */
export function VoicePresence({
  state,
  micActive,
}: {
  state: string;
  micActive: boolean;
}) {
  const presence = micActive
    ? "listening"
    : state === "speaking"
      ? "speaking"
      : state === "thinking" || state === "transcribing" || state === "executing_tool"
        ? "thinking"
        : state === "awaiting_confirmation"
          ? "confirm"
          : state === "error"
            ? "error"
            : "idle";

  return (
    <div
      className={styles.presence}
      data-presence={presence}
      aria-hidden="true"
      title={`Presence: ${presence}`}
    >
      <span />
    </div>
  );
}

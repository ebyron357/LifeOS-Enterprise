"use client";

import styles from "./VoiceConsole.module.css";

export function VoiceVisualizer({
  mode,
  reducedMotion,
}: {
  mode: "idle" | "input" | "output";
  reducedMotion: boolean;
}) {
  return (
    <div
      className={styles.visualizer}
      data-mode={mode}
      data-reduced={reducedMotion ? "true" : "false"}
      aria-hidden="true"
    >
      <span /><span /><span /><span /><span />
    </div>
  );
}

"use client";

import type { VoiceSettings } from "@/lib/voice/types";
import styles from "./VoiceConsole.module.css";

export function VoiceSettingsPanel({
  settings,
  onChange,
}: {
  settings: VoiceSettings;
  onChange: (settings: VoiceSettings) => void;
}) {
  return (
    <details className={styles.settings}>
      <summary>Voice settings</summary>
      <div className={styles.settingsGrid}>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={settings.audioEnabled}
            onChange={(event) => onChange({ ...settings, audioEnabled: event.target.checked })}
          />
          <span>Spoken responses</span>
        </label>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={settings.interfaceSoundsEnabled}
            onChange={(event) => onChange({ ...settings, interfaceSoundsEnabled: event.target.checked })}
          />
          <span>Interface sounds</span>
        </label>
        <label>
          <span>Speech rate</span>
          <input
            type="range"
            min={0.7}
            max={1.3}
            step={0.05}
            value={settings.speechRate}
            onChange={(event) => onChange({ ...settings, speechRate: Number(event.target.value) })}
          />
        </label>
        <label>
          <span>Response language</span>
          <select
            value={settings.responseLanguage}
            onChange={(event) => onChange({
              ...settings,
              responseLanguage: event.target.value as VoiceSettings["responseLanguage"],
              locale: event.target.value as VoiceSettings["locale"],
            })}
          >
            <option value="en">English</option>
            <option value="ht">Haitian Creole (prepared, untested)</option>
            <option value="fr">French (prepared, untested)</option>
          </select>
        </label>
        <label>
          <span>Transcription language</span>
          <select
            value={settings.transcriptionLanguage}
            onChange={(event) => onChange({
              ...settings,
              transcriptionLanguage: event.target.value as VoiceSettings["transcriptionLanguage"],
            })}
          >
            <option value="en">English</option>
            <option value="ht">Haitian Creole (prepared, untested)</option>
            <option value="fr">French (prepared, untested)</option>
          </select>
        </label>
      </div>
      <p className={styles.note}>Haitian Creole and French are architecturally prepared. Do not claim verified support until tested.</p>
    </details>
  );
}

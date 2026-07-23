"use client";

import { useState } from "react";
import type { ProjectBrief } from "@/lib/lifeos/types";
import { buildMorningBriefSpeech } from "@/lib/lifeos/morning-brief-speech";
import { useBrowserStorage } from "@/lib/lifeos/use-browser-storage";

type CaptureItem = { id: number; text: string; done: boolean };
const emptyCapture: CaptureItem[] = [];

type DashboardQuickActionsProps = {
  projects: ProjectBrief[];
  activeProjects: number;
  reviewsDue: number;
};

export function DashboardQuickActions({ projects, activeProjects, reviewsDue }: DashboardQuickActionsProps) {
  const [capture, setCapture] = useState("");
  const [items, setItems] = useBrowserStorage<CaptureItem[]>("lifeos-capture", emptyCapture);
  const [panelOpen, setPanelOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  function addCapture() {
    const text = capture.trim();
    if (!text) return;
    setItems([{ id: Date.now(), text, done: false }, ...items]);
    setCapture("");
  }

  function toggleItem(id: number) {
    setItems(items.map((item) => item.id === id ? { ...item, done: !item.done } : item));
  }

  function readBrief() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const words = buildMorningBriefSpeech({ activeProjects, projects, reviewsDue });
    const utterance = new SpeechSynthesisUtterance(words);
    utterance.rate = 1.08;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  const briefLabel = speaking ? "Reading morning briefing" : "Hear my morning briefing";
  const briefButtonText = speaking ? "Reading brief…" : "Hear my brief";

  return (
    <>
      <button
        className="voice-brief-button"
        onClick={readBrief}
        type="button"
        aria-label={briefLabel}
        aria-pressed={speaking}
      >
        <span className={speaking ? "voice-wave is-speaking" : "voice-wave"} aria-hidden="true">◉</span>
        {briefButtonText}
      </button>
      <button className="capture-open-button" onClick={() => setPanelOpen(true)} type="button">
        <span aria-hidden="true">＋</span> Quick capture
      </button>

      <div className="mobile-command-dock" aria-label="Mobile command actions">
        <button className="mobile-brief-button" onClick={readBrief} type="button" aria-label={briefLabel} aria-pressed={speaking}>
          <span className={speaking ? "voice-wave is-speaking" : "voice-wave"} aria-hidden="true">◉</span>
          {speaking ? "Reading…" : "Hear brief"}
        </button>
        <button className="mobile-command-button" onClick={() => setPanelOpen(true)} type="button" aria-label="Open quick capture">
          ＋ Capture
        </button>
      </div>

      {panelOpen ? (
        <div className="capture-overlay" role="presentation" onMouseDown={() => setPanelOpen(false)}>
          <section className="capture-panel" role="dialog" aria-modal="true" aria-label="Quick capture" onMouseDown={(event) => event.stopPropagation()}>
            <header><div><p className="widget-eyebrow">Thought to trusted list</p><h2>Quick Capture</h2></div><button onClick={() => setPanelOpen(false)} type="button" aria-label="Close capture">×</button></header>
            <div className="capture-entry">
              <input
                value={capture}
                onChange={(event) => setCapture(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") addCapture(); }}
                placeholder="Idea, task, decision, or reminder…"
                autoFocus
              />
              <button onClick={addCapture} type="button">Save</button>
            </div>
            <p className="capture-note">Saved privately in this browser. Vault write sync remains read-only in this release.</p>
            <div className="capture-items">
              {items.map((item) => (
                <button className={item.done ? "is-done" : ""} key={item.id} onClick={() => toggleItem(item.id)} type="button">
                  <span>{item.done ? "✓" : "○"}</span>{item.text}
                </button>
              ))}
              {!items.length ? <p>No captured items yet.</p> : null}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import type { ProjectBrief } from "@/lib/lifeos/types";

type CaptureItem = { id: number; text: string; done: boolean };

const sections = [
  { id: "overview", label: "Overview", code: "01" },
  { id: "projects", label: "Projects", code: "02" },
  { id: "growth", label: "Growth", code: "03" },
  { id: "intelligence", label: "Intelligence", code: "04" },
  { id: "agents", label: "Agents", code: "05" },
];

export function LifeOSNavigation({ projects, reviewsDue }: { projects: ProjectBrief[]; reviewsDue: number }) {
  const [capture, setCapture] = useState("");
  const [items, setItems] = useState<CaptureItem[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("lifeos-capture");
    if (saved) {
      try { setItems(JSON.parse(saved) as CaptureItem[]); } catch { /* keep the capture surface usable */ }
    }
  }, []);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function addCapture() {
    const text = capture.trim();
    if (!text) return;
    const next = [{ id: Date.now(), text, done: false }, ...items];
    setItems(next);
    window.localStorage.setItem("lifeos-capture", JSON.stringify(next));
    setCapture("");
  }

  function toggleItem(id: number) {
    const next = items.map((item) => item.id === id ? { ...item, done: !item.done } : item);
    setItems(next);
    window.localStorage.setItem("lifeos-capture", JSON.stringify(next));
  }

  function readBrief() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const blocked = projects.filter((project) => project.status === "blocked" || project.blocker).length;
    const waiting = projects.filter((project) => project.status === "waiting" || project.waitingOn).length;
    const top = projects.slice(0, 3).map((project) => `${project.name}. Next: ${project.nextAction}`).join(" ");
    const words = `Good day, Bwa. You have ${projects.length} active projects, ${blocked} blocked, ${waiting} waiting, and ${reviewsDue} reviews due. Your top work is: ${top || "No active priorities are recorded."}`;
    const utterance = new SpeechSynthesisUtterance(words);
    utterance.rate = 1.08;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  return (
    <>
      <aside className="lifeos-sidebar" aria-label="LifeOS navigation">
        <div className="sidebar-brand"><span>L</span><div><strong>LIFEOS</strong><small>BWA COMMAND</small></div></div>
        <nav>
          {sections.map((section) => (
            <button key={section.id} onClick={() => scrollTo(section.id)} type="button">
              <span>{section.code}</span>{section.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-actions">
          <button className="voice-brief-button" onClick={readBrief} type="button">
            <span className={speaking ? "voice-wave is-speaking" : "voice-wave"}>◉</span>
            {speaking ? "Reading brief…" : "Hear my brief"}
          </button>
          <button className="capture-open-button" onClick={() => setPanelOpen(true)} type="button">
            <span>＋</span> Quick capture
          </button>
        </div>
        <div className="sidebar-status"><i /><span>System online</span><small>{projects.length} active records</small></div>
      </aside>

      <button className="mobile-command-button" onClick={() => setPanelOpen(true)} type="button">＋ Capture</button>

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
            <p className="capture-note">Saved privately in this browser. Obsidian sync will be added in the connection phase.</p>
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

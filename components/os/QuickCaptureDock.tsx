"use client";

import { useState } from "react";
import { useBrowserStorage } from "@/lib/lifeos/use-browser-storage";

export type CaptureKind = "note" | "task" | "idea" | "reminder";

export type CapturedItem = {
  id: string;
  kind: CaptureKind;
  text: string;
  createdAt: string;
  done: boolean;
};

const EMPTY: CapturedItem[] = [];

export function QuickCaptureDock({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [items, setItems] = useBrowserStorage<CapturedItem[]>("lifeos-inbox-v1", EMPTY);
  const [text, setText] = useState("");
  const [kind, setKind] = useState<CaptureKind>("note");

  if (!open) return null;

  function save() {
    const next = text.trim();
    if (!next) return;
    setItems([{ id: `cap-${Date.now()}`, kind, text: next, createdAt: new Date().toISOString(), done: false }, ...items]);
    setText("");
    onClose();
  }

  return (
    <div className="capture-overlay" role="presentation" onMouseDown={onClose}>
      <section className="capture-panel" role="dialog" aria-modal="true" aria-label="Capture" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div>
            <p className="widget-eyebrow">Park it now</p>
            <h2>Capture</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close capture">×</button>
        </header>
        <div className="os-capture">
          <label>
            <span className="widget-eyebrow">What is this?</span>
            <select value={kind} onChange={(event) => setKind(event.target.value as CaptureKind)} aria-label="Capture type">
              <option value="note">Note</option>
              <option value="task">Task</option>
              <option value="idea">Idea</option>
              <option value="reminder">Reminder</option>
            </select>
          </label>
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") save(); }}
            placeholder="What do you need to remember?"
            autoFocus
          />
          <button type="button" className="os-primary" onClick={save}>Save to inbox</button>
          <p className="os-lede">Saved in this browser only. Vault sync still uses the draft-PR write path.</p>
        </div>
      </section>
    </div>
  );
}

export function InboxList() {
  const [items, setItems] = useBrowserStorage<CapturedItem[]>("lifeos-inbox-v1", EMPTY);

  if (!items.length) {
    return (
      <div className="os-empty">
        <h2>Nothing captured yet</h2>
        <p>Park a note, task, idea, or reminder. LifeOS will keep it here until you file it.</p>
      </div>
    );
  }

  return (
    <ul className="os-grid">
      {items.map((item) => (
        <li key={item.id} className="os-card">
          <p className="widget-eyebrow">{item.kind}</p>
          <p>{item.text}</p>
          <button
            type="button"
            className="os-secondary"
            onClick={() => setItems(items.map((entry) => entry.id === item.id ? { ...entry, done: !entry.done } : entry))}
          >
            {item.done ? "Mark open" : "Mark done"}
          </button>
        </li>
      ))}
    </ul>
  );
}

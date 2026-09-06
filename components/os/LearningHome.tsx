"use client";

import { useState } from "react";
import Link from "next/link";
import { sanitizeTemplatePreview } from "@/lib/os/templates";
import { useBrowserStorage } from "@/lib/lifeos/use-browser-storage";
import { noteHref } from "@/lib/vault/slug";
import type { VaultNote } from "@/lib/vault/types";

type LearningHomeProps = {
  notes: VaultNote[];
};

export function LearningHome({ notes }: LearningHomeProps) {
  const [wanted, setWanted] = useBrowserStorage<string[]>("lifeos-learning-wanted", []);
  const [draft, setDraft] = useState("");
  const current = notes[0] ?? null;

  function addWanted() {
    const text = draft.trim();
    if (!text) return;
    setWanted([text, ...wanted.filter((item) => item !== text)]);
    setDraft("");
  }

  return (
    <div className="os-grid">
      <header className="os-page-header">
        <h1>Learning</h1>
        <p>Continue one thing, or add what you want to learn next.</p>
      </header>

      <section className="os-card" aria-labelledby="continue-learning">
        <h2 id="continue-learning">Continue learning</h2>
        {current ? (
          <>
            <p><strong>{sanitizeTemplatePreview(current.title)}</strong></p>
            <p>{sanitizeTemplatePreview(current.excerpt || current.nextAction || "") || "Open this topic and take the next lesson."}</p>
            <Link className="os-primary" href={noteHref(current.path)}>Resume this topic</Link>
          </>
        ) : (
          <div className="os-empty">
            <h3>Add something you want to learn</h3>
            <p>There is no learning queue in the vault yet. Name one topic. That is enough to start.</p>
          </div>
        )}
      </section>

      <section className="os-card os-learning" aria-labelledby="add-learning">
        <h2 id="add-learning">Next lesson / next action</h2>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") addWanted(); }}
          placeholder="I want to learn…"
          aria-label="Add a learning topic"
        />
        <button type="button" className="os-primary" onClick={addWanted}>Add to my queue</button>
      </section>

      <div className="os-grid os-grid-2">
        <section className="os-card">
          <h2>Current topics</h2>
          {notes.length ? (
            <ul>
              {notes.slice(0, 8).map((note) => (
                <li key={note.path}><Link href={noteHref(note.path)}>{sanitizeTemplatePreview(note.title)}</Link></li>
              ))}
            </ul>
          ) : <p>No vault learning notes yet.</p>}
        </section>
        <section className="os-card">
          <h2>Saved from you</h2>
          {wanted.length ? (
            <ul>{wanted.map((item) => <li key={item}>{item}</li>)}</ul>
          ) : <p>Your added topics will appear here.</p>}
        </section>
      </div>
    </div>
  );
}

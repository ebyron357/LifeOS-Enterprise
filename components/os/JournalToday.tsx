"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { isoDate, readableDate } from "@/lib/os/greeting";
import { containsRawPlaceholder, sanitizeTemplatePreview } from "@/lib/os/templates";
import { useBrowserStorage } from "@/lib/lifeos/use-browser-storage";
import { noteHref } from "@/lib/vault/slug";
import type { VaultNote } from "@/lib/vault/types";

type JournalTodayProps = {
  todayNotes: VaultNote[];
  recent: VaultNote[];
};

export function JournalToday({ todayNotes, recent }: JournalTodayProps) {
  const today = isoDate();
  const [draft, setDraft] = useBrowserStorage(`lifeos-journal-${today}`, "");
  const [prompt, setPrompt] = useState("What mattered today?");
  const vaultToday = todayNotes[0] ?? null;
  const visibleRecent = useMemo(
    () => recent.filter((note) => {
      if (containsRawPlaceholder(note.title) || containsRawPlaceholder(note.excerpt || "")) return false;
      return !/99 templates|\{\{|folder paths|obsidian creates/i.test(`${note.title} ${note.excerpt}`);
    }).slice(0, 8),
    [recent],
  );

  return (
    <div className="os-grid">
      <header className="os-page-header">
        <p className="widget-eyebrow">{readableDate()}</p>
        <h1>{"Today's journal"}</h1>
        <p>Write here. Template internals stay hidden.</p>
      </header>

      <section className="os-card os-journal" aria-labelledby="journal-write">
        <h2 id="journal-write">Quick entry</h2>
        <label>
          <span className="widget-eyebrow">Optional prompt</span>
          <select value={prompt} onChange={(event) => setPrompt(event.target.value)} aria-label="Journal prompt">
            <option>What mattered today?</option>
            <option>What did I finish?</option>
            <option>What is still open?</option>
            <option>What am I grateful for?</option>
          </select>
        </label>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={prompt}
          aria-label="Today's journal entry"
        />
        <p className="os-lede">Saved in this browser for {today}. Canonical vault writes still go through an approved draft PR.</p>
        {vaultToday ? (
          <p>Vault also has <Link href={noteHref(vaultToday.path)}>{sanitizeTemplatePreview(vaultToday.title)}</Link>.</p>
        ) : null}
      </section>

      <section className="os-card" aria-labelledby="recent-journal">
        <h2 id="recent-journal">Recent entries</h2>
        {visibleRecent.length ? (
          <ul>
            {visibleRecent.map((note) => (
              <li key={note.path}>
                <Link href={noteHref(note.path)}>{sanitizeTemplatePreview(note.title)}</Link>
                <span> · {sanitizeTemplatePreview(note.excerpt || "") || "Open to read."}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="os-empty">
            <p>No journal entries yet. Write the first line for today above.</p>
          </div>
        )}
      </section>
    </div>
  );
}

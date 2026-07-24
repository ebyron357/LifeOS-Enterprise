"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { noteHref } from "@/lib/vault/slug";
import type { SearchResult } from "@/lib/vault/types";

type SearchClientProps = {
  initialQuery?: string;
  initialTag?: string;
  initialType?: string;
  initialFolder?: string;
  results: SearchResult[];
  tags: string[];
  types: string[];
};

function highlight(text: string, query: string) {
  if (!query.trim()) return text;
  const pattern = new RegExp(`(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
  const parts = text.split(pattern);
  return parts.map((part, index) => (
    pattern.test(part) ? <mark key={`${part}-${index}`}>{part}</mark> : <span key={`${part}-${index}`}>{part}</span>
  ));
}

export function SearchClient({
  initialQuery = "",
  initialTag = "",
  initialType = "",
  initialFolder = "",
  results,
  tags,
  types,
}: SearchClientProps) {
  const [query, setQuery] = useState(initialQuery);
  const [tag, setTag] = useState(initialTag);
  const [type, setType] = useState(initialType);

  const href = useMemo(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (tag) params.set("tag", tag);
    if (type) params.set("type", type);
    if (initialFolder) params.set("folder", initialFolder);
    const value = params.toString();
    return value ? `/search?${value}` : "/search";
  }, [initialFolder, query, tag, type]);

  return (
    <div className="search-page">
      <form className="search-form" action="/search" method="get">
        <input
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search titles, tags, headings, and note bodies…"
          aria-label="Search vault"
        />
        <select name="tag" value={tag} onChange={(event) => setTag(event.target.value)} aria-label="Filter by tag">
          <option value="">All tags</option>
          {tags.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select name="type" value={type} onChange={(event) => setType(event.target.value)} aria-label="Filter by type">
          <option value="">All types</option>
          {types.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <button type="submit">Search</button>
        <Link className="search-reset" href={href}>Apply</Link>
      </form>

      <p className="search-count">{results.length} result{results.length === 1 ? "" : "s"}</p>

      <div className="search-results">
        {results.map(({ note, score, highlights }) => (
          <article key={note.path} className="search-result">
            <h2><Link href={noteHref(note.path)}>{highlight(note.title, query)}</Link></h2>
            <p>{highlight(note.excerpt || "No preview available.", query)}</p>
            <div className="note-card-meta">
              <span>{note.folder}</span>
              {note.type ? <span>{note.type}</span> : null}
              {note.status ? <span>{note.status}</span> : null}
              <span>score {score}</span>
            </div>
            {highlights.length ? <ul className="search-highlights">{highlights.map((item) => <li key={item}>{item}</li>)}</ul> : null}
          </article>
        ))}
        {!results.length ? <p className="portal-empty">No matching notes. Try a broader query or remove filters.</p> : null}
      </div>
    </div>
  );
}

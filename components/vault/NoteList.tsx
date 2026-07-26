import Link from "next/link";
import { noteHref } from "@/lib/vault/slug";
import type { VaultNote } from "@/lib/vault/types";

type NoteCardProps = {
  note: VaultNote;
  meta?: string[];
};

export function NoteCard({ note, meta }: NoteCardProps) {
  const details = meta ?? [
    note.type,
    note.status,
    note.priority,
    note.business,
    note.reviewDate ? `review ${note.reviewDate}` : null,
  ].filter(Boolean) as string[];

  return (
    <article className="note-card">
      <div className="note-card-head">
        <h3><Link href={noteHref(note.path)}>{note.title}</Link></h3>
        {note.legacy ? <span className="legacy-badge">legacy</span> : null}
      </div>
      <p>{note.excerpt || "No preview available."}</p>
      <div className="note-card-meta">
        <span>{note.folder}</span>
        {details.map((item) => <span key={item}>{item}</span>)}
      </div>
      {note.tags.length ? (
        <div className="note-card-tags">
          {note.tags.map((tag) => <Link key={tag} href={`/search?tag=${encodeURIComponent(tag)}`}>#{tag}</Link>)}
        </div>
      ) : null}
    </article>
  );
}

type NoteListProps = {
  notes: VaultNote[];
  emptyMessage?: string;
};

export function NoteList({ notes, emptyMessage = "No notes match this view." }: NoteListProps) {
  if (!notes.length) return <p className="portal-empty">{emptyMessage}</p>;

  return (
    <div className="note-list">
      {notes.map((note) => <NoteCard key={note.path} note={note} />)}
    </div>
  );
}

"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { noteHref } from "@/lib/vault/slug";
import type { VaultLink, VaultNote } from "@/lib/vault/types";

type NoteMarkdownProps = {
  note: VaultNote;
};

function WikiLink({ href, children }: { href?: string; children: React.ReactNode }) {
  if (!href) return <span>{children}</span>;
  if (href.startsWith("wiki:")) {
    const target = href.replace(/^wiki:/, "").split("#")[0];
    return <Link href={noteHref(`${target}.md`.replace(/\.md\.md$/, ".md"))}>{children}</Link>;
  }
  if (/^https?:\/\//i.test(href)) {
    return <a href={href} rel="noreferrer" target="_blank">{children}</a>;
  }
  return <Link href={noteHref(href.endsWith(".md") ? href : `${href}.md`)}>{children}</Link>;
}

export function NoteMarkdown({ note }: NoteMarkdownProps) {
  const processed = note.body
    .replace(/!\[\[([^\]]+)\]\]/g, (_match, inner: string) => {
      const label = inner.includes("|") ? inner.split("|")[1] : inner.split("#")[0];
      return `> **Embed:** ${label}`;
    })
    .replace(/\[\[([^\]]+)\]\]/g, (_match, inner: string) => {
      const [target, alias] = inner.includes("|") ? inner.split("|") : [inner, inner.split("#")[0]];
      const heading = inner.includes("#") ? `#${inner.split("#")[1]}` : "";
      return `[${alias ?? target}](wiki:${target}${heading})`;
    });

  return (
    <div className="note-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => <WikiLink href={href}>{children}</WikiLink>,
          input: ({ type, checked, disabled }) => {
            if (type === "checkbox") {
              return <input type="checkbox" checked={checked} disabled readOnly aria-readonly="true" />;
            }
            return <input type={type} disabled={disabled} readOnly />;
          },
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}

export function LinkList({ title, links }: { title: string; links: VaultLink[] }) {
  if (!links.length) return null;

  return (
    <section className="note-link-panel">
      <h2>{title}</h2>
      <ul>
        {links.map((link) => (
          <li key={`${link.raw}-${link.target}`}>
            {link.resolvedPath ? (
              <Link href={noteHref(link.resolvedPath)}>{link.alias ?? link.target}</Link>
            ) : link.external ? (
              <a href={link.target} rel="noreferrer" target="_blank">{link.alias ?? link.target}</a>
            ) : (
              <span className="unresolved-link">{link.alias ?? link.target} (unresolved)</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function NoteProperties({ note }: { note: VaultNote }) {
  const entries = Object.entries({
    type: note.type,
    status: note.status,
    priority: note.priority,
    owner: note.owner,
    business: note.business,
    area: note.area,
    goal: note.goal,
    next_action: note.nextAction,
    blocker: note.blocker,
    waiting_on: note.waitingOn,
    review_date: note.reviewDate,
    organization: note.organization,
    role: note.role,
    relationship: note.relationship,
    last_contact: note.lastContact,
    next_contact: note.nextContact,
    created: note.created,
    updated: note.updated,
  }).filter(([, value]) => value);

  if (!entries.length && !note.tags.length) return null;

  return (
    <section className="note-properties">
      <h2>Properties</h2>
      {entries.length ? (
        <dl>
          {entries.map(([key, value]) => (
            <div key={key}>
              <dt>{key.replace(/_/g, " ")}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {note.tags.length ? (
        <div className="note-card-tags">
          {note.tags.map((tag) => <Link key={tag} href={`/search?tag=${encodeURIComponent(tag)}`}>#{tag}</Link>)}
        </div>
      ) : null}
    </section>
  );
}

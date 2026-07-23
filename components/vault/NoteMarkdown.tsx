"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { parseWikiTarget } from "@/lib/vault/parse-note";
import { noteHref } from "@/lib/vault/slug";
import type { VaultLink, VaultNote } from "@/lib/vault/types";

type NoteMarkdownProps = {
  note: VaultNote;
};

const WIKILINK = /(?<!!)\[\[([^\]]+)\]\]/g;
const EMBED = /!\[\[([^\]]+)\]\]/g;

function buildResolvedTargetMap(note: VaultNote): Map<string, string> {
  const resolved = new Map<string, string>();

  for (const link of [...note.links, ...note.embeds]) {
    if (!link.resolvedPath) continue;
    resolved.set(link.target, link.resolvedPath);
    resolved.set(link.target.replace(/\.md$/i, ""), link.resolvedPath);
  }

  return resolved;
}

function preprocessForRender(body: string, resolvedTargets: Map<string, string>): string {
  return body
    .replace(EMBED, (_match, inner: string) => {
      const parsed = parseWikiTarget(inner);
      const label = parsed.alias ?? parsed.target;
      const resolvedPath = resolvedTargets.get(parsed.target)
        ?? resolvedTargets.get(parsed.target.replace(/\.md$/i, ""));
      if (!resolvedPath) {
        return `\n> **Embed:** ${label}\n`;
      }
      return `\n> **Embed:** [${label}](${noteHref(resolvedPath)})\n`;
    })
    .replace(WIKILINK, (_match, inner: string) => {
      const parsed = parseWikiTarget(inner);
      const label = parsed.alias ?? parsed.target;
      const resolvedPath = resolvedTargets.get(parsed.target)
        ?? resolvedTargets.get(parsed.target.replace(/\.md$/i, ""));
      if (!resolvedPath) {
        return `@@unresolved@@${label}@@/unresolved@@`;
      }
      const suffix = parsed.heading ? `#${parsed.heading}` : "";
      return `[${label}](${noteHref(resolvedPath)}${suffix})`;
    });
}

function WikiLink({ href, children }: { href?: string; children: React.ReactNode }) {
  if (!href) return <span>{children}</span>;

  if (/^https?:\/\//i.test(href)) {
    return <a href={href} rel="noreferrer" target="_blank">{children}</a>;
  }

  if (href.startsWith("#") || href.startsWith("/")) {
    return <Link href={href}>{children}</Link>;
  }

  return <span className="unresolved-link">{children}</span>;
}

function renderWithUnresolvedMarkers(text: string): React.ReactNode[] {
  const parts = text.split(/@@unresolved@@(.*?)@@\/unresolved@@/g);
  return parts.map((part, index) => (
    index % 2 === 1
      ? <span className="unresolved-link" key={`unresolved-${part}-${index}`}>{part}</span>
      : <span key={`text-${index}`}>{part}</span>
  ));
}

function restoreUnresolved(node: React.ReactNode): React.ReactNode {
  if (typeof node === "string") {
    if (!node.includes("@@unresolved@@")) return node;
    return <>{renderWithUnresolvedMarkers(node)}</>;
  }

  if (Array.isArray(node)) {
    return node.map((child, index) => <span key={index}>{restoreUnresolved(child)}</span>);
  }

  return node;
}

export function NoteMarkdown({ note }: NoteMarkdownProps) {
  const resolvedTargets = buildResolvedTargetMap(note);
  const processed = preprocessForRender(note.body, resolvedTargets);

  return (
    <div className="note-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          a: ({ href, children }) => <WikiLink href={href}>{restoreUnresolved(children)}</WikiLink>,
          p: ({ children }) => <p>{restoreUnresolved(children)}</p>,
          li: ({ children }) => <li>{restoreUnresolved(children)}</li>,
          td: ({ children }) => <td>{restoreUnresolved(children)}</td>,
          th: ({ children }) => <th>{restoreUnresolved(children)}</th>,
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

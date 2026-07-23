import { notFound } from "next/navigation";
import Link from "next/link";
import { VaultPageLayout } from "@/components/shell/VaultPageLayout";
import { LinkList, NoteMarkdown, NoteProperties } from "@/components/vault/NoteMarkdown";
import { getBacklinks, getNoteBySlug, getSectionCounts, getVaultIndex } from "@/lib/vault/index";
import { noteHref } from "@/lib/vault/slug";

type NotePageProps = {
  params: Promise<{ slug: string[] }>;
};

export const revalidate = 300;

export default async function NotePage({ params }: NotePageProps) {
  const { slug } = await params;
  const noteSlug = slug.map((segment) => decodeURIComponent(segment)).join("/");
  const note = await getNoteBySlug(noteSlug);

  if (!note) notFound();

  const [backlinks, counts, index] = await Promise.all([
    getBacklinks(note.path),
    getSectionCounts(),
    getVaultIndex(),
  ]);

  const related = note.links
    .map((link) => (link.resolvedPath ? index.byPath[link.resolvedPath] : null))
    .filter((item, position, array) => item && array.findIndex((other) => other?.path === item.path) === position) as NonNullable<typeof index.notes[number]>[];

  const crumbs = note.path.split("/");

  return (
    <VaultPageLayout
      title={note.title}
      eyebrow="Note reader"
      description={note.folder}
      counts={counts}
    >
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/resources">Resources</Link>
        {crumbs.map((segment, indexPosition) => {
          const partial = crumbs.slice(0, indexPosition + 1).join("/");
          const isLast = indexPosition === crumbs.length - 1;
          return (
            <span key={partial}>
              <span aria-hidden="true"> / </span>
              {isLast ? <span>{segment.replace(/\.md$/i, "")}</span> : <Link href={noteHref(partial.endsWith(".md") ? partial : `${partial}.md`)}>{segment.replace(/\.md$/i, "")}</Link>}
            </span>
          );
        })}
      </nav>

      <div className="note-reader-grid">
        <div className="note-reader-main">
          <NoteProperties note={note} />
          <NoteMarkdown note={note} />
        </div>
        <aside className="note-reader-side">
          {related.length ? (
            <section className="note-link-panel">
              <h2>Related</h2>
              <ul>
                {related.map((item) => (
                  <li key={item.path}><Link href={noteHref(item.path)}>{item.title}</Link></li>
                ))}
              </ul>
            </section>
          ) : null}
          <section className="note-link-panel">
            <h2>Backlinks</h2>
            {backlinks.length ? (
              <ul>
                {backlinks.map((item) => (
                  <li key={item.path}><Link href={noteHref(item.path)}>{item.title}</Link></li>
                ))}
              </ul>
            ) : <p className="portal-empty">No backlinks indexed.</p>}
          </section>
          <LinkList title="Outgoing links" links={note.links} />
        </aside>
      </div>
    </VaultPageLayout>
  );
}

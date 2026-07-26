import Link from "next/link";
import { NoteList } from "./NoteList";
import type { VaultNote } from "@/lib/vault/types";

type LibraryBrowserProps = {
  notes: VaultNote[];
  folders: string[];
  tags: string[];
  types: string[];
};

export function LibraryBrowser({ notes, folders, tags, types }: LibraryBrowserProps) {
  const recent = [...notes]
    .sort((a, b) => (b.modifiedAt ?? "").localeCompare(a.modifiedAt ?? ""))
    .slice(0, 8);

  const categories = [
    { label: "Projects", href: "/projects", count: notes.filter((note) => note.section === "projects").length },
    { label: "People", href: "/people", count: notes.filter((note) => note.section === "people").length },
    { label: "Resources", href: "/resources", count: notes.filter((note) => note.section === "resources").length },
    { label: "SOPs", href: "/sops", count: notes.filter((note) => note.section === "sops").length },
    { label: "Templates", href: "/templates", count: notes.filter((note) => note.section === "templates").length },
    { label: "Archive", href: "/archive", count: notes.filter((note) => note.section === "archive").length },
  ];

  return (
    <div className="library-browser">
      <section className="library-panel">
        <h2>Categories</h2>
        <div className="category-grid">
          {categories.map((category) => (
            <Link key={category.href} href={category.href} className="category-card">
              <strong>{category.label}</strong>
              <span>{category.count} notes</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="library-columns">
        <section className="library-panel">
          <h2>Folder tree</h2>
          <ul className="folder-tree">
            {folders.map((folder) => (
              <li key={folder}>
                <Link href={`/search?folder=${encodeURIComponent(folder)}`}>{folder}</Link>
                <span>{notes.filter((note) => note.folder === folder).length}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="library-panel">
          <h2>Tags</h2>
          <div className="tag-cloud">
            {tags.slice(0, 24).map((tag) => (
              <Link key={tag} href={`/search?tag=${encodeURIComponent(tag)}`}>#{tag}</Link>
            ))}
          </div>
        </section>

        <section className="library-panel">
          <h2>Note types</h2>
          <ul className="type-list">
            {types.map((type) => (
              <li key={type}>
                <Link href={`/search?type=${encodeURIComponent(type)}`}>{type}</Link>
                <span>{notes.filter((note) => note.type === type).length}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="library-panel">
        <h2>Recently updated</h2>
        <NoteList notes={recent} emptyMessage="No recent notes." />
      </section>
    </div>
  );
}

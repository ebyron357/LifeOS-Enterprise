import Link from "next/link";
import { AppShell } from "@/components/os/AppShell";
import { daypartGreeting } from "@/lib/os/greeting";
import { containsRawPlaceholder, sanitizeTemplatePreview } from "@/lib/os/templates";
import { getVaultIndex, searchVault } from "@/lib/vault/index";
import { noteHref } from "@/lib/vault/slug";

export const revalidate = 300;

type FilesPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function FilesPage({ searchParams }: FilesPageProps) {
  const { q = "" } = await searchParams;
  const index = await getVaultIndex();
  const results = q.trim()
    ? searchVault(index, q.trim()).filter((result) => !containsRawPlaceholder(result.note.title))
    : [];
  const recent = [...index.notes]
    .filter((note) => !containsRawPlaceholder(note.title) && note.section !== "templates")
    .sort((a, b) => (b.modifiedAt ?? "").localeCompare(a.modifiedAt ?? ""))
    .slice(0, 12);

  return (
    <AppShell greeting={daypartGreeting()}>
      <div className="os-grid">
        <header className="os-page-header">
          <h1>Files &amp; knowledge</h1>
          <p>Find a note by what you remember. Folder browsing is advanced.</p>
        </header>
        <form className="os-card os-learning" action="/files" method="get">
          <h2>Find something</h2>
          <input name="q" defaultValue={q} placeholder="Search notes, people, decisions…" aria-label="Search files and knowledge" />
          <button type="submit" className="os-primary">Search</button>
        </form>
        {q.trim() ? (
          <section className="os-card">
            <h2>Results</h2>
            {results.length ? (
              <ul>
                {results.slice(0, 20).map((result) => (
                  <li key={result.note.path}>
                    <Link href={noteHref(result.note.path)}>{sanitizeTemplatePreview(result.note.title)}</Link>
                    <span> · {sanitizeTemplatePreview(result.note.excerpt || "") || "Open to read."}</span>
                  </li>
                ))}
              </ul>
            ) : <p>No matching notes. Try a shorter phrase.</p>}
          </section>
        ) : (
          <section className="os-card">
            <h2>Recently updated</h2>
            <ul>
              {recent.map((note) => (
                <li key={note.path}>
                  <Link href={noteHref(note.path)}>{sanitizeTemplatePreview(note.title)}</Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        <p><Link href="/search">Advanced vault search</Link></p>
      </div>
    </AppShell>
  );
}

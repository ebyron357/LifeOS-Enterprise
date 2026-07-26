import Link from "next/link";
import { noteHref } from "@/lib/vault/slug";
import type { VaultNote } from "@/lib/vault/types";

export function ProjectsView({ notes }: { notes: VaultNote[] }) {
  const projects = notes
    .filter((note) => note.type === "project" || note.section === "projects")
    .filter((note) => note.status !== "archived" && note.status !== "complete")
    .sort((a, b) => (a.priority ?? "P9").localeCompare(b.priority ?? "P9"));

  if (!projects.length) return <p className="portal-empty">No active projects found in the vault.</p>;

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Project</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Business</th>
            <th>Next action</th>
            <th>Blocker</th>
            <th>Waiting on</th>
            <th>Review</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.path}>
              <td><Link href={noteHref(project.path)}>{project.title}</Link></td>
              <td>{project.status ?? "—"}</td>
              <td>{project.priority ?? "—"}</td>
              <td>{project.business ?? project.area ?? "—"}</td>
              <td>{project.nextAction ?? "—"}</td>
              <td>{project.blocker ?? "—"}</td>
              <td>{project.waitingOn ?? "—"}</td>
              <td>{project.reviewDate ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

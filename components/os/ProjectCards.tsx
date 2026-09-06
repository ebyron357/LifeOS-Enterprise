import Link from "next/link";
import { noteHref } from "@/lib/vault/slug";
import type { ProjectBrief } from "@/lib/lifeos/types";

export function ProjectCards({ projects }: { projects: ProjectBrief[] }) {
  if (!projects.length) {
    return (
      <div className="os-empty">
        <h2>No active projects</h2>
        <p>When a project exists in the vault, it will show status, next action, and a Resume Work button here.</p>
      </div>
    );
  }

  return (
    <div className="os-grid os-grid-2">
      {projects.map((project) => (
        <article key={project.path} className="os-card">
          <p className="widget-eyebrow">{project.priority || "unprioritized"} · {project.status}</p>
          <h2>{project.name}</h2>
          <div className="os-project-meta">
            <div>Outcome / next action: {project.nextAction || "Not recorded."}</div>
            <div>Phase / status: {project.status}</div>
            <div>Health: {project.blocker ? "blocked" : project.waitingOn ? "waiting" : project.status}</div>
            <div>Blocker: {project.blocker || "None recorded."}</div>
            <div>Waiting on: {project.waitingOn || "None recorded."}</div>
            <div>Owner action: {project.nextAction || "Open the workspace and choose the next move."}</div>
            <div>Agent action: Ask LifeOS. Do not assume a run happened.</div>
            <div>Review: {project.reviewDate || "Not set."}</div>
            <div>Business: {project.business || "Unassigned."}</div>
            <div>Repository / ClickUp / Slack / deploy: recorded only if present on the project note. Open the workspace to inspect.</div>
          </div>
          <Link className="os-primary" href={noteHref(project.path)}>Resume work</Link>
        </article>
      ))}
    </div>
  );
}

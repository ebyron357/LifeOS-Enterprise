import type { VaultNote } from "@/lib/vault/types";
import { projectRecordedContext } from "@/lib/os/project-context";

export function ProjectWorkspaceHeader({ note }: { note: VaultNote }) {
  const context = projectRecordedContext(note);

  return (
    <section className="os-card" aria-labelledby="project-workspace">
      <p className="widget-eyebrow">Project workspace</p>
      <h2 id="project-workspace">{note.title}</h2>
      <div className="os-project-meta">
        <div>Current outcome / next action: {note.nextAction || "Not recorded."}</div>
        <div>Phase / status: {note.status || "unknown"}</div>
        <div>Priority: {note.priority || "unprioritized"}</div>
        <div>Health: {note.blocker ? "blocked" : note.waitingOn ? "waiting" : note.status || "unknown"}</div>
        <div>Blocker: {note.blocker || "None recorded."}</div>
        <div>Waiting on: {note.waitingOn || "None recorded."}</div>
        <div>Owner action: {note.nextAction || "Choose the next verified move."}</div>
        <div>Agent action: Propose work in conversation. Do not assume a run happened.</div>
        <div>Repository: {context.repository || "Not recorded on this project."}</div>
        <div>Deployment: {context.deployment || "Not recorded on this project."}</div>
        <div>ClickUp: {context.clickup || "Not recorded. See Integrations for live status."}</div>
        <div>Slack: {context.slack || "Not recorded. See Integrations for live status."}</div>
        <div>Last verified: {context.lastVerified || "Not recorded."}</div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ProjectBrief } from "@/lib/lifeos/types";
import { noteHref } from "@/lib/vault/slug";
import styles from "./InteractiveCommandCenter.module.css";

type WorkMode = "explore" | "decide" | "execute" | "teach";
type StatusFilter = "all" | "red" | "yellow" | "green";
type BoardStatus = "active" | "waiting" | "blocked" | "complete";
type Priority = "P0" | "P1" | "P2" | "P3";

type DraftEdit = {
  status?: BoardStatus;
  priority?: Priority;
  nextAction?: string;
};

type FieldChange = {
  field: "status" | "priority" | "next_action";
  from: string;
  to: string;
};

type ProjectChange = {
  project: string;
  path: string;
  fields: FieldChange[];
};

const boardStatuses: BoardStatus[] = ["active", "waiting", "blocked", "complete"];
const priorities: Priority[] = ["P0", "P1", "P2", "P3"];

const modeCopy: Record<WorkMode, string> = {
  explore: "Show possibilities, connections, and opportunities without closing doors.",
  decide: "Compare choices, costs, risks, and likely effects before selecting a path.",
  execute: "Focus on approved work, verified results, blockers, and the next action.",
  teach: "Explain one clear step at a time using simple words and visual guidance.",
};

function health(project: ProjectBrief): Exclude<StatusFilter, "all"> {
  if (project.status === "blocked" || project.blocker) return "red";
  if (project.status === "waiting" || project.waitingOn) return "yellow";
  return "green";
}

function normalizedStatus(project: ProjectBrief): BoardStatus {
  if (project.status === "blocked" || project.blocker) return "blocked";
  if (project.status === "waiting" || project.waitingOn) return "waiting";
  if (project.status === "complete" || project.status === "completed") return "complete";
  return "active";
}

function normalizedPriority(project: ProjectBrief): Priority {
  return priorities.includes(project.priority as Priority) ? project.priority as Priority : "P3";
}

export function InteractiveCommandCenter({ projects }: { projects: ProjectBrief[] }) {
  const [mode, setMode] = useState<WorkMode>("execute");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [drafts, setDrafts] = useState<Record<string, DraftEdit>>({});
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [draggedProject, setDraggedProject] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<BoardStatus | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [packageOpen, setPackageOpen] = useState(false);
  const [message, setMessage] = useState("");

  const visible = useMemo(
    () => projects.filter((project) => filter === "all" || health(project) === filter),
    [filter, projects],
  );

  const grouped = useMemo(() => {
    const result: Record<BoardStatus, ProjectBrief[]> = { active: [], waiting: [], blocked: [], complete: [] };
    visible.forEach((project) => result[drafts[project.name]?.status ?? normalizedStatus(project)].push(project));
    return result;
  }, [drafts, visible]);

  const changes = useMemo<ProjectChange[]>(() => projects.flatMap((project) => {
    const draft = drafts[project.name];
    if (!draft) return [];
    const fields: FieldChange[] = [];
    const currentStatus = normalizedStatus(project);
    const currentPriority = normalizedPriority(project);
    const currentAction = project.nextAction ?? "";

    if (draft.status && draft.status !== currentStatus) fields.push({ field: "status", from: currentStatus, to: draft.status });
    if (draft.priority && draft.priority !== currentPriority) fields.push({ field: "priority", from: currentPriority, to: draft.priority });
    if (draft.nextAction !== undefined && draft.nextAction.trim() !== currentAction.trim()) {
      fields.push({ field: "next_action", from: currentAction, to: draft.nextAction.trim() });
    }
    return fields.length ? [{ project: project.name, path: project.path, fields }] : [];
  }), [drafts, projects]);

  const validationErrors = useMemo(() => changes.flatMap((change) => {
    const project = projects.find((item) => item.name === change.project);
    const errors: string[] = [];
    const nextAction = change.fields.find((field) => field.field === "next_action")?.to ?? project?.nextAction ?? "";
    const status = change.fields.find((field) => field.field === "status")?.to ?? (project ? normalizedStatus(project) : "active");
    if (status !== "complete" && nextAction.trim().length < 8) errors.push(`${change.project}: next action must contain at least 8 characters.`);
    return errors;
  }), [changes, projects]);

  const needsYou = projects.filter(
    (project) => project.status === "blocked" || Boolean(project.blocker) || Boolean(project.waitingOn),
  );

  const approvalPackage = useMemo(() => JSON.stringify({
    schema: "lifeos.change-plan.v1",
    generated_at: new Date().toISOString(),
    source: "Interactive Operations V1",
    write_mode: "proposal-only",
    changes,
  }, null, 2), [changes]);

  function updateDraft(project: ProjectBrief, patch: DraftEdit) {
    setDrafts((previous) => {
      const current = { ...previous[project.name], ...patch };
      const unchanged = (current.status === undefined || current.status === normalizedStatus(project))
        && (current.priority === undefined || current.priority === normalizedPriority(project))
        && (current.nextAction === undefined || current.nextAction.trim() === (project.nextAction ?? "").trim());
      const updated = { ...previous };
      if (unchanged) delete updated[project.name];
      else updated[project.name] = current;
      return updated;
    });
    setMessage(`${project.name} updated in the staged plan. Canonical vault files remain unchanged.`);
  }

  function dropInto(status: BoardStatus) {
    const project = projects.find((item) => item.name === draggedProject);
    if (project) updateDraft(project, { status });
    setDraggedProject(null);
    setOverColumn(null);
  }

  function removeProjectChanges(projectName: string) {
    setDrafts((previous) => {
      const updated = { ...previous };
      delete updated[projectName];
      return updated;
    });
  }

  function clearChanges() {
    setDrafts({});
    setReviewOpen(false);
    setPackageOpen(false);
    setMessage("Staged changes cleared. Canonical vault data remains unchanged.");
  }

  function approvePlan() {
    if (validationErrors.length) {
      setMessage("Approval blocked. Correct the validation issues shown in the review panel.");
      return;
    }
    setPackageOpen(true);
    setMessage("Approval package generated. This is a proposal artifact; no vault files were changed.");
  }

  function downloadPackage() {
    const blob = new Blob([approvalPackage], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `lifeos-change-plan-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Approval package downloaded. Canonical vault data remains unchanged.");
  }

  return (
    <section className="interactive-command" aria-label="Interactive LifeOS controls">
      <div className="mode-console">
        <div><p className="widget-eyebrow">Communication protocol</p><h2>Choose the way we work</h2></div>
        <div className="mode-buttons" role="group" aria-label="Work mode">
          {(Object.keys(modeCopy) as WorkMode[]).map((item) => (
            <button className={mode === item ? "is-active" : ""} key={item} onClick={() => setMode(item)} type="button" aria-pressed={mode === item}>{item}</button>
          ))}
        </div>
        <p className="mode-description"><strong>{mode}</strong> — {modeCopy[mode]}</p>
      </div>

      <div className={styles.boardShell}>
        <header className={styles.boardHeader}>
          <div>
            <p className="widget-eyebrow">Interactive Operations V1</p>
            <h2>Project command board</h2>
            <p>Drag projects, edit priority and next actions, validate the plan, and generate a reviewable approval package before persistence is enabled.</p>
          </div>
          <div className={styles.boardActions}>
            <button type="button" onClick={() => setReviewOpen(true)} disabled={!changes.length}>Review changes ({changes.length})</button>
            <button type="button" onClick={clearChanges} disabled={!changes.length}>Clear staged</button>
          </div>
        </header>

        <div className="health-filters" role="group" aria-label="Filter project health">
          {(["all", "red", "yellow", "green"] as StatusFilter[]).map((item) => (
            <button className={filter === item ? "is-active" : ""} key={item} onClick={() => setFilter(item)} type="button" aria-pressed={filter === item}>{item}</button>
          ))}
        </div>

        <div className={styles.board} aria-label="Project status board">
          {boardStatuses.map((status) => (
            <section className={styles.column} data-over={overColumn === status} key={status}
              onDragEnter={() => setOverColumn(status)} onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setOverColumn((current) => current === status ? null : current)} onDrop={() => dropInto(status)} aria-label={`${status} projects`}>
              <header className={styles.columnHeader}><h3>{status}</h3><span>{grouped[status].length}</span></header>
              <div className={styles.cardList}>
                {grouped[status].map((project) => {
                  const draft = drafts[project.name] ?? {};
                  const expanded = expandedProject === project.name;
                  return (
                    <article className={styles.card} data-staged={Boolean(drafts[project.name])} draggable key={project.name}
                      onDragStart={() => setDraggedProject(project.name)} onDragEnd={() => { setDraggedProject(null); setOverColumn(null); }}>
                      <div className={styles.cardTop}>
                        <strong><Link href={noteHref(project.path)}>{project.name}</Link></strong>
                        <span className={styles.badge}>{draft.priority ?? project.priority}</span>
                      </div>
                      <small>{draft.nextAction ?? project.nextAction}</small>
                      <div className={styles.cardControls}>
                        <label><span className="sr-only">Stage status for {project.name}</span>
                          <select value={draft.status ?? normalizedStatus(project)} onChange={(event) => updateDraft(project, { status: event.target.value as BoardStatus })}>
                            {boardStatuses.map((item) => <option key={item} value={item}>{item}</option>)}
                          </select>
                        </label>
                        <button type="button" onClick={() => setExpandedProject(expanded ? null : project.name)}>{expanded ? "Close" : "Edit"}</button>
                      </div>
                      {expanded ? (
                        <div className={styles.editor} onDragStart={(event) => event.stopPropagation()}>
                          <label>Priority
                            <select value={draft.priority ?? normalizedPriority(project)} onChange={(event) => updateDraft(project, { priority: event.target.value as Priority })}>
                              {priorities.map((item) => <option key={item} value={item}>{item}</option>)}
                            </select>
                          </label>
                          <label>Next action
                            <textarea rows={4} value={draft.nextAction ?? project.nextAction} onChange={(event) => updateDraft(project, { nextAction: event.target.value })} />
                          </label>
                          <button type="button" onClick={() => setReviewOpen(true)}>Review this change</button>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
                {!grouped[status].length ? <p className={styles.empty}>No projects in this lane.</p> : null}
              </div>
            </section>
          ))}
        </div>

        <section className={styles.reviewPanel} hidden={!reviewOpen} aria-label="Review staged project changes">
          <div><p className="widget-eyebrow">Approval gate</p><h3>Review staged changes</h3></div>
          {validationErrors.length ? <div className={styles.validation} role="alert"><strong>Approval requirements</strong>{validationErrors.map((error) => <p key={error}>{error}</p>)}</div> : null}
          <div className={styles.reviewList}>
            {changes.map((change) => (
              <div className={styles.reviewItem} key={change.project}>
                <div><strong>{change.project}</strong>{change.fields.map((field) => <small key={field.field}>{field.field}: {field.from || "empty"} → {field.to || "empty"}</small>)}</div>
                <button type="button" onClick={() => removeProjectChanges(change.project)}>Remove</button>
              </div>
            ))}
            {!changes.length ? <p className={styles.empty}>No changes are staged.</p> : null}
          </div>
          <div className={styles.reviewActions}>
            <button className={styles.primaryAction} type="button" onClick={approvePlan} disabled={!changes.length || Boolean(validationErrors.length)}>Generate approval package</button>
            <button type="button" onClick={() => setReviewOpen(false)}>Continue editing</button>
            <button type="button" onClick={clearChanges}>Discard all</button>
          </div>
        </section>

        <section className={styles.packagePanel} hidden={!packageOpen} aria-label="Generated approval package">
          <div><p className="widget-eyebrow">Controlled handoff</p><h3>Approval package ready</h3><p>This package records the exact project files and frontmatter fields proposed for change.</p></div>
          <textarea readOnly rows={12} value={approvalPackage} aria-label="Approval package JSON" />
          <div className={styles.reviewActions}>
            <button className={styles.primaryAction} type="button" onClick={downloadPackage}>Download package</button>
            <button type="button" onClick={() => setPackageOpen(false)}>Return to review</button>
          </div>
        </section>

        <p className={styles.statusMessage} aria-live="polite">{message}</p>
      </div>

      <div className="command-columns">
        <article className="project-control">
          <header className="control-header"><div><p className="widget-eyebrow">Live portfolio</p><h2>Project health</h2></div></header>
          <div className="project-health-list">
            {visible.length ? visible.map((project) => {
              const state = health(project); const draft = drafts[project.name];
              return <div className="project-health-card" key={project.name}><span className={`health-light health-light--${state}`} aria-label={`${state} status`} /><div><strong><Link href={noteHref(project.path)}>{project.name}</Link></strong><small>{draft?.nextAction ?? project.nextAction}</small></div><div className="project-meta"><b>{draft?.priority ?? project.priority}</b><span>{draft?.status ?? project.status}</span></div></div>;
            }) : <p className="control-empty">No projects match this view.</p>}
          </div>
        </article>
        <article className="needs-you">
          <p className="widget-eyebrow">Decision queue</p><h2>Needs you</h2><strong className="needs-count">{needsYou.length}</strong>
          <p>Items waiting for a decision, missing information, or help removing a blocker.</p>
          <div className="needs-list">{needsYou.slice(0, 4).map((project) => <div key={project.name}><strong><Link href={noteHref(project.path)}>{project.name}</Link></strong><small>{project.blocker || project.waitingOn || "Review required"}</small></div>)}{!needsYou.length ? <div><strong>Queue clear</strong><small>No verified blockers or waits.</small></div> : null}</div>
        </article>
      </div>
    </section>
  );
}

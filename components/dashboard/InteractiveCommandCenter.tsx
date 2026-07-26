"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ProjectBrief } from "@/lib/lifeos/types";
import { noteHref } from "@/lib/vault/slug";
import styles from "./InteractiveCommandCenter.module.css";

type WorkMode = "explore" | "decide" | "execute" | "teach";
type StatusFilter = "all" | "red" | "yellow" | "green";
type BoardStatus = "active" | "waiting" | "blocked" | "complete";

type StagedChange = {
  project: string;
  from: string;
  to: BoardStatus;
};

const boardStatuses: BoardStatus[] = ["active", "waiting", "blocked", "complete"];

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

export function InteractiveCommandCenter({ projects }: { projects: ProjectBrief[] }) {
  const [mode, setMode] = useState<WorkMode>("execute");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [staged, setStaged] = useState<Record<string, BoardStatus>>({});
  const [draggedProject, setDraggedProject] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<BoardStatus | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [message, setMessage] = useState("");

  const visible = useMemo(
    () => projects.filter((project) => filter === "all" || health(project) === filter),
    [filter, projects],
  );

  const grouped = useMemo(() => {
    const result: Record<BoardStatus, ProjectBrief[]> = {
      active: [],
      waiting: [],
      blocked: [],
      complete: [],
    };

    visible.forEach((project) => {
      const status = staged[project.name] ?? normalizedStatus(project);
      result[status].push(project);
    });

    return result;
  }, [staged, visible]);

  const changes = useMemo<StagedChange[]>(
    () => projects.flatMap((project) => {
      const next = staged[project.name];
      const current = normalizedStatus(project);
      return next && next !== current ? [{ project: project.name, from: current, to: next }] : [];
    }),
    [projects, staged],
  );

  const needsYou = projects.filter(
    (project) => project.status === "blocked" || Boolean(project.blocker) || Boolean(project.waitingOn),
  );

  function stageStatus(project: ProjectBrief, next: BoardStatus) {
    const current = normalizedStatus(project);
    setStaged((previous) => {
      const updated = { ...previous };
      if (next === current) delete updated[project.name];
      else updated[project.name] = next;
      return updated;
    });
    setMessage(`${project.name} staged for ${next}. No vault files have been changed.`);
  }

  function dropInto(status: BoardStatus) {
    const project = projects.find((item) => item.name === draggedProject);
    if (project) stageStatus(project, status);
    setDraggedProject(null);
    setOverColumn(null);
  }

  function clearChanges() {
    setStaged({});
    setReviewOpen(false);
    setMessage("Staged changes cleared. Canonical vault data remains unchanged.");
  }

  function confirmPlan() {
    setReviewOpen(false);
    setMessage("Change plan approved in the interface. Vault persistence will be added in the next controlled write phase.");
  }

  return (
    <section className="interactive-command" aria-label="Interactive LifeOS controls">
      <div className="mode-console">
        <div>
          <p className="widget-eyebrow">Communication protocol</p>
          <h2>Choose the way we work</h2>
        </div>
        <div className="mode-buttons" role="group" aria-label="Work mode">
          {(Object.keys(modeCopy) as WorkMode[]).map((item) => (
            <button className={mode === item ? "is-active" : ""} key={item} onClick={() => setMode(item)} type="button" aria-pressed={mode === item}>
              {item}
            </button>
          ))}
        </div>
        <p className="mode-description"><strong>{mode}</strong> — {modeCopy[mode]}</p>
      </div>

      <div className={styles.boardShell}>
        <header className={styles.boardHeader}>
          <div>
            <p className="widget-eyebrow">Interactive Operations V1</p>
            <h2>Project command board</h2>
            <p>Drag projects between lanes or use the status menu. Every change is staged first and shown for review before any future vault write is allowed.</p>
          </div>
          <div className={styles.boardActions}>
            <button type="button" onClick={() => setReviewOpen(true)} disabled={!changes.length}>
              Review changes ({changes.length})
            </button>
            <button type="button" onClick={clearChanges} disabled={!changes.length}>Clear staged</button>
          </div>
        </header>

        <div className="health-filters" role="group" aria-label="Filter project health">
          {(["all", "red", "yellow", "green"] as StatusFilter[]).map((item) => (
            <button className={filter === item ? "is-active" : ""} key={item} onClick={() => setFilter(item)} type="button" aria-pressed={filter === item}>
              {item}
            </button>
          ))}
        </div>

        <div className={styles.board} aria-label="Project status board">
          {boardStatuses.map((status) => (
            <section
              className={styles.column}
              data-over={overColumn === status}
              key={status}
              onDragEnter={() => setOverColumn(status)}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setOverColumn((current) => current === status ? null : current)}
              onDrop={() => dropInto(status)}
              aria-label={`${status} projects`}
            >
              <header className={styles.columnHeader}>
                <h3>{status}</h3>
                <span>{grouped[status].length}</span>
              </header>
              <div className={styles.cardList}>
                {grouped[status].map((project) => (
                  <article
                    className={styles.card}
                    data-staged={Boolean(staged[project.name])}
                    draggable
                    key={project.name}
                    onDragStart={() => setDraggedProject(project.name)}
                    onDragEnd={() => { setDraggedProject(null); setOverColumn(null); }}
                  >
                    <div className={styles.cardTop}>
                      <strong><Link href={noteHref(project.path)}>{project.name}</Link></strong>
                      <span className={styles.badge}>{project.priority}</span>
                    </div>
                    <small>{project.nextAction}</small>
                    <div className={styles.cardControls}>
                      <label>
                        <span className="sr-only">Stage status for {project.name}</span>
                        <select value={staged[project.name] ?? normalizedStatus(project)} onChange={(event) => stageStatus(project, event.target.value as BoardStatus)}>
                          {boardStatuses.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                      </label>
                      <button type="button" onClick={() => setReviewOpen(true)}>Review</button>
                    </div>
                  </article>
                ))}
                {!grouped[status].length ? <p className={styles.empty}>No projects in this lane.</p> : null}
              </div>
            </section>
          ))}
        </div>

        <section className={styles.reviewPanel} hidden={!reviewOpen} aria-label="Review staged project changes">
          <div>
            <p className="widget-eyebrow">Approval gate</p>
            <h3>Review staged changes</h3>
          </div>
          <div className={styles.reviewList}>
            {changes.map((change) => (
              <div className={styles.reviewItem} key={change.project}>
                <div><strong>{change.project}</strong><small>{change.from} → {change.to}</small></div>
                <button type="button" onClick={() => {
                  const project = projects.find((item) => item.name === change.project);
                  if (project) stageStatus(project, normalizedStatus(project));
                }}>Remove</button>
              </div>
            ))}
            {!changes.length ? <p className={styles.empty}>No changes are staged.</p> : null}
          </div>
          <div className={styles.reviewActions}>
            <button className={styles.primaryAction} type="button" onClick={confirmPlan} disabled={!changes.length}>Approve change plan</button>
            <button type="button" onClick={() => setReviewOpen(false)}>Continue editing</button>
            <button type="button" onClick={clearChanges}>Discard all</button>
          </div>
        </section>

        <p className={styles.statusMessage} aria-live="polite">{message}</p>
      </div>

      <div className="command-columns">
        <article className="project-control">
          <header className="control-header"><div><p className="widget-eyebrow">Live portfolio</p><h2>Project health</h2></div></header>
          <div className="project-health-list">
            {visible.length ? visible.map((project) => {
              const state = health(project);
              return <div className="project-health-card" key={project.name}><span className={`health-light health-light--${state}`} aria-label={`${state} status`} /><div><strong><Link href={noteHref(project.path)}>{project.name}</Link></strong><small>{project.nextAction}</small></div><div className="project-meta"><b>{project.priority}</b><span>{staged[project.name] ?? project.status}</span></div></div>;
            }) : <p className="control-empty">No projects match this view.</p>}
          </div>
        </article>

        <article className="needs-you">
          <p className="widget-eyebrow">Decision queue</p><h2>Needs you</h2><strong className="needs-count">{needsYou.length}</strong>
          <p>Items waiting for a decision, missing information, or help removing a blocker.</p>
          <div className="needs-list">
            {needsYou.slice(0, 4).map((project) => <div key={project.name}><strong><Link href={noteHref(project.path)}>{project.name}</Link></strong><small>{project.blocker || project.waitingOn || "Review required"}</small></div>)}
            {!needsYou.length ? <div><strong>Queue clear</strong><small>No verified blockers or waits.</small></div> : null}
          </div>
        </article>
      </div>
    </section>
  );
}

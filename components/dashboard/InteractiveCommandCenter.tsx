"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { MotionListItem, MotionListPresence } from "@/components/motion/MotionList";
import { MotionPanel } from "@/components/motion/MotionPanel";
import { MotionStatus } from "@/components/motion/MotionStatus";
import { useInteractionFeedback } from "@/components/feedback/InteractionFeedback";
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

function laneId(status: BoardStatus) {
  return `lane:${status}`;
}

function ProjectCard({
  project,
  draft,
  expanded,
  staged,
  onExpand,
  onUpdate,
  dragHandleProps,
  style,
  isDragging,
}: {
  project: ProjectBrief;
  draft: DraftEdit;
  expanded: boolean;
  staged: boolean;
  onExpand: () => void;
  onUpdate: (patch: DraftEdit) => void;
  dragHandleProps?: Record<string, unknown>;
  style?: CSSProperties;
  isDragging?: boolean;
}) {
  return (
    <article
      className={styles.card}
      data-staged={staged}
      data-dragging={isDragging ? "true" : "false"}
      style={style}
      aria-roledescription="Draggable project"
      aria-label={`${project.name}, ${draft.status ?? normalizedStatus(project)}`}
    >
      <div className={styles.cardTop}>
        <button type="button" className={styles.dragHandle} {...dragHandleProps} aria-label={`Move ${project.name}`}>
          ⋮⋮
        </button>
        <strong><Link href={noteHref(project.path)}>{project.name}</Link></strong>
        <span className={styles.badge} data-priority={draft.priority ?? project.priority}>
          {draft.priority ?? project.priority}
        </span>
      </div>
      <small>{draft.nextAction ?? project.nextAction}</small>
      <div className={styles.cardControls}>
        <label>
          <span className="sr-only">Stage status for {project.name}</span>
          <select
            value={draft.status ?? normalizedStatus(project)}
            onChange={(event) => onUpdate({ status: event.target.value as BoardStatus })}
          >
            {boardStatuses.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <button type="button" onClick={onExpand}>{expanded ? "Close" : "Edit"}</button>
      </div>
      {expanded ? (
        <div className={styles.editor}>
          <label>Priority
            <select
              value={draft.priority ?? normalizedPriority(project)}
              onChange={(event) => onUpdate({ priority: event.target.value as Priority })}
            >
              {priorities.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>Next action
            <textarea
              rows={4}
              value={draft.nextAction ?? project.nextAction}
              onChange={(event) => onUpdate({ nextAction: event.target.value })}
            />
          </label>
        </div>
      ) : null}
    </article>
  );
}

function DraggableProjectCard(props: {
  project: ProjectBrief;
  draft: DraftEdit;
  expanded: boolean;
  staged: boolean;
  onExpand: () => void;
  onUpdate: (patch: DraftEdit) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: props.project.name,
    data: { type: "project", project: props.project },
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div ref={setNodeRef}>
      <ProjectCard
        {...props}
        style={style}
        isDragging={isDragging}
        dragHandleProps={{ ...listeners, ...attributes }}
      />
    </div>
  );
}

function DroppableLane({
  status,
  count,
  children,
  isOver,
}: {
  status: BoardStatus;
  count: number;
  children: ReactNode;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: laneId(status), data: { type: "lane", status } });
  return (
    <section
      ref={setNodeRef}
      className={styles.column}
      data-over={isOver}
      aria-label={`${status} projects`}
    >
      <header className={styles.columnHeader}>
        <h3>{status}</h3>
        <span aria-label={`${count} projects`}>{count}</span>
      </header>
      <div className={styles.cardList}>{children}</div>
    </section>
  );
}

export function InteractiveCommandCenter({ projects }: { projects: ProjectBrief[] }) {
  const feedback = useInteractionFeedback();
  const [mode, setMode] = useState<WorkMode>("execute");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [drafts, setDrafts] = useState<Record<string, DraftEdit>>({});
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overLane, setOverLane] = useState<BoardStatus | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [packageOpen, setPackageOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [announcement, setAnnouncement] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  useEffect(() => {
    function onVoiceStagedChange(event: Event) {
      const detail = (event as CustomEvent<{
        changes?: Array<{
          project: string;
          path?: string;
          fields: Array<{ field: string; from?: string; to: string }>;
        }>;
      }>).detail;
      const staged = detail?.changes;
      if (!Array.isArray(staged) || staged.length === 0) return;

      const patches: Array<{ name: string; patch: DraftEdit }> = [];
      for (const change of staged) {
        const project = projects.find(
          (item) => item.name === change.project || item.path === change.path,
        );
        if (!project || !Array.isArray(change.fields)) continue;
        const patch: DraftEdit = {};
        for (const field of change.fields) {
          if (field.field === "status" && boardStatuses.includes(field.to as BoardStatus)) {
            patch.status = field.to as BoardStatus;
          }
          if (field.field === "priority" && priorities.includes(field.to as Priority)) {
            patch.priority = field.to as Priority;
          }
          if (field.field === "next_action") {
            patch.nextAction = field.to;
          }
        }
        if (Object.keys(patch).length) patches.push({ name: project.name, patch });
      }
      if (!patches.length) return;

      setDrafts((previous) => {
        const updated = { ...previous };
        for (const { name, patch } of patches) {
          const project = projects.find((item) => item.name === name);
          if (!project) continue;
          const current = { ...updated[name], ...patch };
          const unchanged = (current.status === undefined || current.status === normalizedStatus(project))
            && (current.priority === undefined || current.priority === normalizedPriority(project))
            && (current.nextAction === undefined || current.nextAction.trim() === (project.nextAction ?? "").trim());
          if (unchanged) delete updated[name];
          else updated[name] = current;
        }
        return updated;
      });

      window.dispatchEvent(new CustomEvent("lifeos-operations-view", { detail: { view: "board" } }));
      setReviewOpen(true);
      const text = "Voice staging applied to the Command Board. Canonical vault files remain unchanged.";
      setMessage(text);
      setAnnouncement(text);
      feedback.push({
        kind: "staging",
        title: "Voice change staged on board",
        detail: text,
        persistence: "browser-only",
      });
    }

    window.addEventListener("lifeos-voice-staged-change", onVoiceStagedChange);
    return () => window.removeEventListener("lifeos-voice-staged-change", onVoiceStagedChange);
  }, [feedback, projects]);

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

  const activeProject = activeId ? projects.find((project) => project.name === activeId) ?? null : null;

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
    const text = `${project.name} updated in the staged plan. Canonical vault files remain unchanged.`;
    setMessage(text);
    feedback.push({
      kind: "staging",
      title: `${project.name} staged`,
      detail: text,
      persistence: "browser-only",
    });
  }

  function removeProjectChanges(projectName: string) {
    setDrafts((previous) => {
      const updated = { ...previous };
      delete updated[projectName];
      return updated;
    });
    feedback.push({
      kind: "reverted",
      title: `${projectName} staging removed`,
      detail: "Staged edits for this project were discarded in the browser.",
      persistence: "browser-only",
    });
  }

  function clearChanges() {
    setDrafts({});
    setReviewOpen(false);
    setPackageOpen(false);
    setMessage("Staged changes cleared. Canonical vault data remains unchanged.");
    feedback.push({
      kind: "reverted",
      title: "Staged changes cleared",
      detail: "Canonical vault data remains unchanged.",
      persistence: "browser-only",
    });
  }

  function approvePlan() {
    if (validationErrors.length) {
      setMessage("Approval blocked. Correct the validation issues shown in the review panel.");
      feedback.push({
        kind: "invalid",
        title: "Approval blocked",
        detail: validationErrors.join(" "),
        persistence: "none",
      });
      return;
    }
    setPackageOpen(true);
    setMessage("Approval package generated. This is a proposal artifact; no vault files were changed.");
    feedback.push({
      kind: "approval-required",
      title: "Approval package ready",
      detail: "Create a draft GitHub PR only through authenticated persistence. Main remains unchanged.",
      persistence: "browser-only",
    });
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
    feedback.push({
      kind: "success",
      title: "Package downloaded",
      detail: "Proposal artifact saved locally. Canonical vault unchanged.",
      persistence: "browser-only",
    });
  }

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
    setAnnouncement(`Picked up ${event.active.id}. Use arrow keys to choose a status lane, then drop.`);
  }

  function onDragCancel() {
    setAnnouncement(`Cancelled moving ${activeId ?? "project"}. No staging change applied.`);
    setActiveId(null);
    setOverLane(null);
    feedback.push({
      kind: "reverted",
      title: "Drag cancelled",
      detail: "No staged status change was applied.",
      persistence: "none",
    });
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    setOverLane(null);
    if (!over) {
      setAnnouncement(`Dropped ${active.id} outside a lane. No change.`);
      return;
    }
    const targetStatus = String(over.id).startsWith("lane:")
      ? String(over.id).replace("lane:", "") as BoardStatus
      : null;
    if (!targetStatus || !boardStatuses.includes(targetStatus)) {
      setAnnouncement(`Invalid drop target for ${active.id}.`);
      feedback.push({
        kind: "invalid",
        title: "Invalid drop",
        detail: "Projects can only move into Active, Waiting, Blocked, or Complete.",
        persistence: "none",
      });
      return;
    }
    const project = projects.find((item) => item.name === active.id);
    if (!project) return;
    updateDraft(project, { status: targetStatus });
    setAnnouncement(`${project.name} staged as ${targetStatus}. Canonical vault unchanged.`);
  }

  return (
    <section className="interactive-command" aria-label="Interactive LifeOS controls">
      <div className="sr-only" aria-live="assertive">{announcement}</div>
      <MotionPanel className="mode-console" as="div">
        <div><p className="widget-eyebrow">Communication protocol</p><h2>Choose the way we work</h2></div>
        <div className="mode-buttons" role="group" aria-label="Work mode">
          {(Object.keys(modeCopy) as WorkMode[]).map((item) => (
            <button className={mode === item ? "is-active" : ""} key={item} onClick={() => setMode(item)} type="button" aria-pressed={mode === item}>{item}</button>
          ))}
        </div>
        <p className="mode-description"><strong>{mode}</strong> — {modeCopy[mode]}</p>
      </MotionPanel>

      <div className={styles.boardShell}>
        <header className={styles.boardHeader}>
          <div>
            <p className="widget-eyebrow">Interactive Operations · Visual V1</p>
            <h2>Project command board</h2>
            <p>Move projects with mouse, touch, or keyboard. Edits only stage a browser proposal. Canonical vault and GitHub stay unchanged until an authenticated draft pull request is approved.</p>
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

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragCancel={onDragCancel}
          onDragEnd={onDragEnd}
          onDragOver={(event) => {
            const overId = event.over?.id ? String(event.over.id) : "";
            setOverLane(overId.startsWith("lane:") ? overId.replace("lane:", "") as BoardStatus : null);
          }}
        >
          <div className={styles.board} aria-label="Project status board">
            {boardStatuses.map((status) => (
              <DroppableLane key={status} status={status} count={grouped[status].length} isOver={overLane === status}>
                <MotionListPresence>
                  {grouped[status].map((project) => {
                    const draft = drafts[project.name] ?? {};
                    return (
                      <MotionListItem id={`${status}-${project.name}`} key={project.name} className={styles.cardMotion}>
                        <DraggableProjectCard
                          project={project}
                          draft={draft}
                          expanded={expandedProject === project.name}
                          staged={Boolean(drafts[project.name])}
                          onExpand={() => setExpandedProject(expandedProject === project.name ? null : project.name)}
                          onUpdate={(patch) => updateDraft(project, patch)}
                        />
                      </MotionListItem>
                    );
                  })}
                </MotionListPresence>
                {!grouped[status].length ? <p className={styles.empty}>No projects in this lane.</p> : null}
              </DroppableLane>
            ))}
          </div>
          <DragOverlay>
            {activeProject ? (
              <ProjectCard
                project={activeProject}
                draft={drafts[activeProject.name] ?? {}}
                expanded={false}
                staged={Boolean(drafts[activeProject.name])}
                onExpand={() => undefined}
                onUpdate={() => undefined}
                isDragging
              />
            ) : null}
          </DragOverlay>
        </DndContext>

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

        <MotionStatus className={styles.statusMessage} tone="success">{message}</MotionStatus>
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

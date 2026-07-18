"use client";

import { useMemo, useState } from "react";
import type { ProjectBrief } from "@/lib/lifeos/types";

type WorkMode = "explore" | "decide" | "execute" | "teach";
type StatusFilter = "all" | "red" | "yellow" | "green";

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

export function InteractiveCommandCenter({ projects }: { projects: ProjectBrief[] }) {
  const [mode, setMode] = useState<WorkMode>("execute");
  const [filter, setFilter] = useState<StatusFilter>("all");

  const visible = useMemo(
    () => projects.filter((project) => filter === "all" || health(project) === filter),
    [filter, projects],
  );

  const needsYou = projects.filter(
    (project) => project.status === "blocked" || Boolean(project.blocker) || Boolean(project.waitingOn),
  );

  return (
    <section className="interactive-command" aria-label="Interactive LifeOS controls">
      <div className="mode-console">
        <div>
          <p className="widget-eyebrow">Communication protocol</p>
          <h2>Choose the way we work</h2>
        </div>
        <div className="mode-buttons" role="group" aria-label="Work mode">
          {(Object.keys(modeCopy) as WorkMode[]).map((item) => (
            <button
              className={mode === item ? "is-active" : ""}
              key={item}
              onClick={() => setMode(item)}
              type="button"
              aria-pressed={mode === item}
            >
              {item}
            </button>
          ))}
        </div>
        <p className="mode-description"><strong>{mode}</strong> — {modeCopy[mode]}</p>
      </div>

      <div className="command-columns">
        <article className="project-control">
          <header className="control-header">
            <div>
              <p className="widget-eyebrow">Live portfolio</p>
              <h2>Project health</h2>
            </div>
            <div className="health-filters" role="group" aria-label="Filter project health">
              {(["all", "red", "yellow", "green"] as StatusFilter[]).map((item) => (
                <button
                  className={filter === item ? "is-active" : ""}
                  key={item}
                  onClick={() => setFilter(item)}
                  type="button"
                  aria-pressed={filter === item}
                >
                  {item}
                </button>
              ))}
            </div>
          </header>

          <div className="project-health-list">
            {visible.length ? visible.map((project) => {
              const state = health(project);
              return (
                <div className="project-health-card" key={project.name}>
                  <span className={`health-light health-light--${state}`} aria-label={`${state} status`} />
                  <div>
                    <strong>{project.name}</strong>
                    <small>{project.nextAction}</small>
                  </div>
                  <div className="project-meta">
                    <b>{project.priority}</b>
                    <span>{project.status}</span>
                  </div>
                </div>
              );
            }) : <p className="control-empty">No projects match this view.</p>}
          </div>
        </article>

        <article className="needs-you">
          <p className="widget-eyebrow">Decision queue</p>
          <h2>Needs you</h2>
          <strong className="needs-count">{needsYou.length}</strong>
          <p>Items waiting for a decision, missing information, or help removing a blocker.</p>
          <div className="needs-list">
            {needsYou.slice(0, 4).map((project) => (
              <div key={project.name}>
                <strong>{project.name}</strong>
                <small>{project.blocker || project.waitingOn || "Review required"}</small>
              </div>
            ))}
            {!needsYou.length ? <div><strong>Queue clear</strong><small>No verified blockers or waits.</small></div> : null}
          </div>
        </article>
      </div>
    </section>
  );
}

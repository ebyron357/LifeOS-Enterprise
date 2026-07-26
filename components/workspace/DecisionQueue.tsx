"use client";

import Link from "next/link";
import type { ProjectBrief } from "@/lib/lifeos/types";
import { noteHref } from "@/lib/vault/slug";

type DecisionQueueProps = {
  priorities: ProjectBrief[];
  projects: ProjectBrief[];
};

export function DecisionQueue({ priorities, projects }: DecisionQueueProps) {
  const blocked = projects.filter((project) => project.status === "blocked" || project.blocker);
  const waiting = projects.filter((project) => project.status === "waiting" || project.waitingOn);
  const queue = [
    ...priorities.slice(0, 3),
    ...blocked.filter((project) => !priorities.some((item) => item.path === project.path)).slice(0, 2),
  ].slice(0, 5);

  return (
    <div className="decision-queue">
      <p className="decision-queue-summary">
        Commit to one next action. Blocked and waiting work stay visible without inventing new records.
      </p>
      <ul className="decision-queue-list">
        {queue.map((item, index) => (
          <li key={item.path}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <strong><Link href={noteHref(item.path)}>{item.nextAction}</Link></strong>
              <small>
                {item.name} · {item.priority}
                {item.blocker ? ` · blocker: ${item.blocker}` : ""}
                {item.waitingOn ? ` · waiting: ${item.waitingOn}` : ""}
              </small>
            </div>
          </li>
        ))}
        {!queue.length ? <li className="portal-empty">No active decisions queued from vault projects.</li> : null}
      </ul>
      <div className="decision-queue-meta" aria-label="Decision pressure">
        <span>{blocked.length} blocked</span>
        <span>{waiting.length} waiting</span>
        <span>{priorities.length} priorities</span>
      </div>
    </div>
  );
}

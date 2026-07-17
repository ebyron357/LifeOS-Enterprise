import { WidgetFrame } from "./WidgetFrame";
import type { ProjectBrief } from "@/lib/lifeos/types";

type MorningBriefProps = {
  priorities: ProjectBrief[];
  activeProjects: number;
  waitingOn: number;
  reviewsDue: number;
};

export function MorningBrief({ priorities, activeProjects, waitingOn, reviewsDue }: MorningBriefProps) {
  return (
    <WidgetFrame eyebrow="Morning brief · Live vault data" title="What deserves attention" action={`${priorities.length} priorities`}>
      <ol className="priority-list">
        {priorities.map((priority, index) => (
          <li key={priority.name}>
            <span className="priority-number">0{index + 1}</span>
            <div><strong>{priority.nextAction}</strong><small>{priority.business} · {priority.priority} · review {priority.reviewDate || "not set"}</small></div>
            <span className={`priority-dot priority-dot--${priority.priority === "P0" ? "critical" : priority.priority === "P1" ? "high" : "medium"}`} aria-label={`${priority.priority} priority`} />
          </li>
        ))}
      </ol>
      <div className="brief-footer">
        <div><span>Active projects</span><strong>{activeProjects}</strong></div>
        <div><span>Reviews due</span><strong>{reviewsDue}</strong></div>
        <div><span>Waiting on</span><strong>{waitingOn}</strong></div>
      </div>
    </WidgetFrame>
  );
}

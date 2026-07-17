import { WidgetFrame } from "./WidgetFrame";
import type { AgentBrief } from "@/lib/lifeos/types";

export function AIStatus({ agents }: { agents: AgentBrief[] }) {
  const active = agents.filter((agent) => agent.status === "active").length;
  return (
    <WidgetFrame eyebrow="AI workforce · Live vault data" title={`${agents.length} agents`} action={`${active} active`}>
      <ul className="agent-list">
        {agents.map((agent) => (
          <li key={agent.name}>
            <span className={`agent-status agent-status--${agent.status === "active" ? "active" : "idle"}`} aria-label={agent.status} />
            <div><strong>{agent.name}</strong><small>{agent.purpose || `Review ${agent.reviewDate || "not set"}`}</small></div>
            <span className="agent-state">{agent.status}</span>
          </li>
        ))}
      </ul>
    </WidgetFrame>
  );
}

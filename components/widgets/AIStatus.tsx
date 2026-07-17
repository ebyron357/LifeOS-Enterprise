import { WidgetFrame } from "./WidgetFrame";

const agents = [
  { name: "Chief of Staff", task: "Morning brief ready", status: "active" },
  { name: "Project Manager", task: "Tracking 4 projects", status: "active" },
  { name: "Knowledge Engineer", task: "2 notes queued", status: "queued" },
  { name: "Automation Advisor", task: "Review due Friday", status: "idle" },
];

export function AIStatus() {
  return (
    <WidgetFrame eyebrow="AI workforce" title="4 agents" action="2 active">
      <ul className="agent-list">
        {agents.map((agent) => (
          <li key={agent.name}>
            <span className={`agent-status agent-status--${agent.status}`} aria-label={agent.status} />
            <div><strong>{agent.name}</strong><small>{agent.task}</small></div>
            <span className="agent-state">{agent.status}</span>
          </li>
        ))}
      </ul>
    </WidgetFrame>
  );
}

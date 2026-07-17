import { WidgetFrame } from "./WidgetFrame";
import type { GitHubHealthData } from "@/lib/github/health";

export function GitHubHealth({ data }: { data?: GitHubHealthData }) {
  if (!data?.connected) {
    return (
      <WidgetFrame eyebrow="GitHub health" title="Signal unavailable" action="Retrying">
        <div className="empty-state"><strong>GitHub telemetry is temporarily unavailable.</strong><p>LifeOS will retry the public repository API automatically.</p><span className="connection-tag">Automatic recovery enabled</span></div>
      </WidgetFrame>
    );
  }

  const healthy = data.failedWorkflows === 0 && data.lastWorkflow === "success";
  return (
    <WidgetFrame eyebrow="GitHub health · Live API" title="Repository telemetry" action={healthy ? "Nominal" : "Attention required"}>
      <div className="telemetry-grid">
        <div><span>Open PRs</span><strong>{data.openPullRequests}</strong></div>
        <div><span>Failed runs</span><strong className={data.failedWorkflows ? "metric-alert" : "metric-good"}>{data.failedWorkflows}</strong></div>
        <div><span>Last workflow</span><strong className={healthy ? "metric-good telemetry-word" : "metric-alert telemetry-word"}>{data.lastWorkflow}</strong></div>
      </div>
      <div className="repo-signal"><span className={healthy ? "signal-dot" : "signal-dot signal-dot--alert"} /><div><strong>LifeOS-Enterprise</strong><small>{data.defaultBranch} · API refresh every 5 minutes</small></div><time>{data.updatedAt.slice(0, 10)}</time></div>
    </WidgetFrame>
  );
}

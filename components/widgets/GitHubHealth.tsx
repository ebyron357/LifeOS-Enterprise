import { WidgetFrame } from "./WidgetFrame";

export function GitHubHealth() {
  return (
    <WidgetFrame eyebrow="GitHub health" title="Connect GitHub API" action="Setup required">
      <div className="empty-state">
        <strong>Repository metrics need a server credential.</strong>
        <p>Add a read-only GitHub token to the deployment environment to show pull requests, failed checks, stale branches, and workflow status.</p>
        <span className="connection-tag">Read-only access recommended</span>
      </div>
    </WidgetFrame>
  );
}

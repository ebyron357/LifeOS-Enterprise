import { WidgetFrame } from "./WidgetFrame";

export function GitHubHealth() {
  return (
    <WidgetFrame eyebrow="GitHub health" title="Repositories" action="All systems normal">
      <div className="health-score"><strong>92</strong><span>/ 100<br />health score</span></div>
      <dl className="health-metrics">
        <div><dt>Open PRs</dt><dd>3</dd></div>
        <div><dt>Failed checks</dt><dd className="healthy">0</dd></div>
        <div><dt>Stale branches</dt><dd>2</dd></div>
      </dl>
      <div className="repo-status"><span className="status-mark" /><div><strong>LifeOS-Enterprise</strong><small>main · checks passing</small></div><time>Now</time></div>
    </WidgetFrame>
  );
}

import type { IntegrationStatus } from "@/lib/os/integrations";

export function IntegrationBadge({ item }: { item: IntegrationStatus }) {
  return (
    <article className="os-card">
      <p className="widget-eyebrow">{item.service}</p>
      <span className="os-badge" data-state={item.state}>{item.state}</span>
      <p>{item.reason}</p>
      {item.ownerAction ? <p><strong>Owner action:</strong> {item.ownerAction}</p> : null}
      {item.lastChecked ? <p className="os-lede">Last checked {item.lastChecked}</p> : null}
    </article>
  );
}

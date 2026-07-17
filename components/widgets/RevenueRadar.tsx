import { WidgetFrame } from "./WidgetFrame";

export function RevenueRadar() {
  return (
    <WidgetFrame eyebrow="Revenue radar" title="Connect revenue source" action="Setup required">
      <div className="empty-state">
        <strong>No financial data source is connected.</strong>
        <p>Connect Stripe, Shopify, or an approved reporting sheet before revenue is shown. LifeOS will not display invented financial figures.</p>
        <span className="connection-tag">Credential-gated next step</span>
      </div>
    </WidgetFrame>
  );
}

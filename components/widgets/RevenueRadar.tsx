import { WidgetFrame } from "./WidgetFrame";
import type { RevenueRadarData } from "@/lib/google/revenue";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function RevenueRadar({ data }: { data?: RevenueRadarData }) {
  if (data?.connected) {
    const progress = Math.max(0, Math.min(data.targetProgress * 100, 100));
    return (
      <WidgetFrame eyebrow="Revenue radar · Live Sheet" title="Financial telemetry" action="Synced">
        <div className="revenue-hero"><div><span>Current month net</span><strong>{currency.format(data.currentMonthNet)}</strong></div><div><span>YTD net</span><strong>{currency.format(data.ytdNet)}</strong></div></div>
        <div className="revenue-target"><div><span>Target progress</span><b>{data.monthlyTarget > 0 ? `${Math.round(data.targetProgress * 100)}%` : "Target not set"}</b></div><div className="revenue-track"><i style={{ width: `${progress}%` }} /></div></div>
        <div className="revenue-businesses">{data.businesses.slice(0, 3).map((business) => <div key={business.name}><span>{business.name}</span><strong>{currency.format(business.currentMonthNet)}</strong></div>)}</div>
      </WidgetFrame>
    );
  }
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

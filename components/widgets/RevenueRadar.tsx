import { WidgetFrame } from "./WidgetFrame";

const businesses = [
  { name: "ClientVerse", value: "$8,400", progress: 84, trend: "+12%" },
  { name: "The Alternative", value: "$3,250", progress: 54, trend: "+8%" },
  { name: "TradeIQ", value: "$1,800", progress: 36, trend: "+4%" },
];

export function RevenueRadar() {
  return (
    <WidgetFrame eyebrow="Revenue radar" title="$13,450" action="This month">
      <div className="revenue-summary"><span>Monthly target · $20,000</span><strong>67%</strong></div>
      <div className="progress-track" aria-label="67 percent of monthly revenue target"><span style={{ width: "67%" }} /></div>
      <ul className="revenue-list">
        {businesses.map((business) => (
          <li key={business.name}>
            <div className="revenue-row"><strong>{business.name}</strong><span>{business.value} <em>{business.trend}</em></span></div>
            <div className="mini-track"><span style={{ width: `${business.progress}%` }} /></div>
          </li>
        ))}
      </ul>
    </WidgetFrame>
  );
}

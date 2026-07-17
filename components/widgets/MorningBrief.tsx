import { WidgetFrame } from "./WidgetFrame";

const priorities = [
  { label: "Finish LifeOS executive dashboard", meta: "LifeOS · Today", level: "critical" },
  { label: "Review STAXX Shopify connection", meta: "STAXX · Today", level: "high" },
  { label: "Confirm ClientVerse deployment", meta: "ClientVerse · Tomorrow", level: "medium" },
];

export function MorningBrief() {
  return (
    <WidgetFrame eyebrow="Morning brief" title="What deserves attention" action="3 priorities">
      <ol className="priority-list">
        {priorities.map((priority, index) => (
          <li key={priority.label}>
            <span className="priority-number">0{index + 1}</span>
            <div><strong>{priority.label}</strong><small>{priority.meta}</small></div>
            <span className={`priority-dot priority-dot--${priority.level}`} aria-label={`${priority.level} priority`} />
          </li>
        ))}
      </ol>
      <div className="brief-footer">
        <div><span>Next review</span><strong>9:00 AM</strong></div>
        <div><span>Open loops</span><strong>7</strong></div>
        <div><span>Waiting on</span><strong>3</strong></div>
      </div>
    </WidgetFrame>
  );
}

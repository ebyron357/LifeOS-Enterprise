import { WidgetFrame } from "./WidgetFrame";

export function PrayerWidget() {
  return (
    <WidgetFrame eyebrow="Daily prayer" title="Lead with wisdom" tone="prayer">
      <blockquote>
        “Teach us to number our days, that we may gain a heart of wisdom.”
        <cite>Psalm 90:12</cite>
      </blockquote>
      <p className="reflection">Today, give me clarity to recognize the work that matters and discipline to finish it well.</p>
      <div className="prayer-focus"><span>Today’s focus</span><strong>Clarity · Stewardship · Completion</strong></div>
    </WidgetFrame>
  );
}

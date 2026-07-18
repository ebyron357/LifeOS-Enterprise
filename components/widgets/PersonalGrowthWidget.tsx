import type { GrowthBrief } from "@/lib/lifeos/types";
import { WidgetFrame } from "./WidgetFrame";

const dimensions = ["Purpose", "Health", "Mind", "Learning", "Relationships", "Money", "Work", "Service"];

export function PersonalGrowthWidget({ growth }: { growth: GrowthBrief }) {
  return (
    <WidgetFrame eyebrow="Personal operating system" title="Personal Growth" action="Evidence, not pressure">
      <div className="growth-focus">
        <span>Current focus</span>
        <strong>{growth.focus}</strong>
      </div>
      <div className="growth-dimensions" aria-label="Personal growth areas">
        {dimensions.map((dimension, index) => (
          <div key={dimension}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{dimension}</strong>
          </div>
        ))}
      </div>
      <div className="growth-footer">
        <div><span>Progress measure</span><strong>{growth.currentValue} / {growth.targetValue} check-ins</strong></div>
        <div><span>Next review</span><strong>{growth.reviewDate || "Not scheduled"}</strong></div>
      </div>
    </WidgetFrame>
  );
}

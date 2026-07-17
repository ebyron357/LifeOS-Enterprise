import type { ComponentType } from "react";
import { AIStatus } from "./AIStatus";
import { GitHubHealth } from "./GitHubHealth";
import { MorningBrief } from "./MorningBrief";
import { PrayerWidget } from "./PrayerWidget";
import { RevenueRadar } from "./RevenueRadar";

export type WidgetDefinition = {
  id: "morning-brief" | "prayer" | "revenue-radar" | "ai-workforce" | "github-health";
  title: string;
  size: "wide" | "standard";
  Component: ComponentType;
};

export const widgetRegistry = [
  { id: "morning-brief", title: "Morning Brief", size: "wide", Component: MorningBrief },
  { id: "prayer", title: "Prayer Widget", size: "standard", Component: PrayerWidget },
  { id: "revenue-radar", title: "Revenue Radar", size: "standard", Component: RevenueRadar },
  { id: "ai-workforce", title: "AI Workforce", size: "standard", Component: AIStatus },
  { id: "github-health", title: "GitHub Health", size: "standard", Component: GitHubHealth },
] as const satisfies readonly WidgetDefinition[];

export function getWidget(id: WidgetDefinition["id"]) {
  return widgetRegistry.find((widget) => widget.id === id);
}

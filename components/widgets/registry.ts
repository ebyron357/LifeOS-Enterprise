import { GitHubHealth } from "./GitHubHealth";
import { PrayerWidget } from "./PrayerWidget";
import { RevenueRadar } from "./RevenueRadar";

export type WidgetDefinition = {
  id: "prayer" | "revenue-radar" | "github-health";
  title: string;
  size: "wide" | "standard";
  Component: typeof PrayerWidget | typeof RevenueRadar | typeof GitHubHealth;
};

export const widgetRegistry = [
  { id: "prayer", title: "Prayer Widget", size: "standard", Component: PrayerWidget },
  { id: "revenue-radar", title: "Revenue Radar", size: "standard", Component: RevenueRadar },
  { id: "github-health", title: "GitHub Health", size: "standard", Component: GitHubHealth },
] as const satisfies readonly WidgetDefinition[];

export function getWidget(id: WidgetDefinition["id"]) {
  return widgetRegistry.find((widget) => widget.id === id);
}

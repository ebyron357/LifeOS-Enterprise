import { PrayerWidget } from "./PrayerWidget";
import { RevenueRadar } from "./RevenueRadar";

export type WidgetDefinition = {
  id: "prayer" | "revenue-radar";
  title: string;
  size: "wide" | "standard";
  Component: typeof PrayerWidget | typeof RevenueRadar;
};

export const widgetRegistry = [
  { id: "prayer", title: "Prayer Widget", size: "standard", Component: PrayerWidget },
  { id: "revenue-radar", title: "Revenue Radar", size: "standard", Component: RevenueRadar },
] as const satisfies readonly WidgetDefinition[];

export function getWidget(id: WidgetDefinition["id"]) {
  return widgetRegistry.find((widget) => widget.id === id);
}

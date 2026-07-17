import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { widgetRegistry } from "@/components/widgets/registry";

export default function ExecutiveDashboardPage() {
  return <DashboardLayout widgets={widgetRegistry} />;
}

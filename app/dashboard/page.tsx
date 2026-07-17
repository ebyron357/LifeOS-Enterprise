import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { widgetRegistry } from "@/components/widgets/registry";
import { getVaultDashboardData } from "@/lib/lifeos/vault-data";

export default async function ExecutiveDashboardPage() {
  const data = await getVaultDashboardData();
  return <DashboardLayout widgets={widgetRegistry} data={data} />;
}

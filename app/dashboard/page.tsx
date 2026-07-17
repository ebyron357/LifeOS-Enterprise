import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { widgetRegistry } from "@/components/widgets/registry";
import { getVaultDashboardData } from "@/lib/lifeos/vault-data";
import { getGitHubHealth } from "@/lib/github/health";

export const revalidate = 300;

export default async function ExecutiveDashboardPage() {
  const [data, github] = await Promise.all([getVaultDashboardData(), getGitHubHealth()]);
  return <DashboardLayout widgets={widgetRegistry} data={data} github={github} />;
}

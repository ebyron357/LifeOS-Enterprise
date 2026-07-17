import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { widgetRegistry } from "@/components/widgets/registry";
import { getVaultDashboardData } from "@/lib/lifeos/vault-data";
import { getGitHubHealth } from "@/lib/github/health";
import { getRevenueRadar } from "@/lib/google/revenue";

export const revalidate = 300;

export default async function ExecutiveDashboardPage() {
  const [data, github, revenue] = await Promise.all([getVaultDashboardData(), getGitHubHealth(), getRevenueRadar()]);
  return <DashboardLayout widgets={widgetRegistry} data={data} github={github} revenue={revenue} />;
}

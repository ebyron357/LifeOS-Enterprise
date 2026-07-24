import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { widgetRegistry } from "@/components/widgets/registry";
import { getVaultDashboardData } from "@/lib/lifeos/vault-data";
import { getGitHubHealth } from "@/lib/github/health";
import { getRevenueRadar } from "@/lib/google/revenue";
import { getSectionCounts } from "@/lib/vault/index";

export const revalidate = 300;

export default async function ExecutiveDashboardPage() {
  const [data, github, revenue, counts] = await Promise.all([
    getVaultDashboardData(),
    getGitHubHealth(),
    getRevenueRadar(),
    getSectionCounts(),
  ]);
  return <DashboardLayout widgets={widgetRegistry} data={data} github={github} revenue={revenue} counts={counts} />;
}

import "server-only";

import { getGitHubHealth } from "@/lib/github/health";
import { getVaultDashboardData } from "@/lib/lifeos/vault-data";
import { daypartGreeting, readableDate } from "./greeting";
import { getHermesContract } from "./hermes";
import { listIntegrationStatuses } from "./integrations";

export async function getOsContext() {
  const [vault, github] = await Promise.all([getVaultDashboardData(), getGitHubHealth()]);
  const nowIso = new Date().toISOString();
  return {
    vault,
    github,
    integrations: listIntegrationStatuses({ nowIso, github }),
    hermes: getHermesContract(),
    greeting: daypartGreeting(),
    dateLabel: readableDate(),
  };
}

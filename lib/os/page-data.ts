import "server-only";

import { getContinuityResumePackage } from "@/lib/continuity/sources";
import { getGitHubHealth } from "@/lib/github/health";
import { getVaultDashboardData } from "@/lib/lifeos/vault-data";
import { daypartGreeting, readableDate } from "./greeting";
import { getHermesContract } from "./hermes";
import { listIntegrationStatuses } from "./integrations";

export async function getOsContext() {
  const nowIso = new Date().toISOString();
  const [vault, github, resume] = await Promise.all([
    getVaultDashboardData(),
    getGitHubHealth(),
    getContinuityResumePackage(nowIso),
  ]);
  return {
    vault,
    github,
    resume,
    integrations: listIntegrationStatuses({ nowIso, github }),
    hermes: getHermesContract(),
    greeting: daypartGreeting(),
    dateLabel: readableDate(),
  };
}

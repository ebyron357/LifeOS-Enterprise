export type HermesContract = {
  id: "hermes";
  role: string;
  available: boolean;
  state: "unavailable" | "configured" | "error";
  lastResponse: string | null;
  delegatedTasks: number;
  evidence: string[];
  approvalBoundary: string;
  limitation: string;
};

export function getHermesContract(env: Record<string, string | undefined> = process.env): HermesContract {
  const endpoint = env.HERMES_ENDPOINT?.trim();
  const token = env.HERMES_TOKEN?.trim();
  if (!endpoint || !token) {
    return {
      id: "hermes",
      role: "Delegated agent runtime for work LifeOS proposes and the owner approves.",
      available: false,
      state: "unavailable",
      lastResponse: null,
      delegatedTasks: 0,
      evidence: [],
      approvalBoundary: "LifeOS never sends Hermes work without LIFEOS_WRITE_ENABLED, LIFEOS_WRITE_SECRET, and an approved tool request.",
      limitation: "No Hermes endpoint or token is configured. The adapter is present; nothing is claimed running.",
    };
  }
  return {
    id: "hermes",
    role: "Delegated agent runtime for work LifeOS proposes and the owner approves.",
    available: false,
    state: "configured",
    lastResponse: null,
    delegatedTasks: 0,
    evidence: [],
    approvalBoundary: "LifeOS never sends Hermes work without LIFEOS_WRITE_ENABLED, LIFEOS_WRITE_SECRET, and an approved tool request.",
    limitation: "Credentials are present. Live Hermes reachability is not probed in this release, so the state is configured, not connected.",
  };
}

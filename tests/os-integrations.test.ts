import { describe, expect, it } from "vitest";
import { listIntegrationStatuses } from "@/lib/os/integrations";

const githubDown = {
  connected: false,
  openPullRequests: 0,
  failedWorkflows: 0,
  defaultBranch: "main",
  lastWorkflow: "unavailable",
  updatedAt: "",
};

const githubUp = {
  connected: true,
  openPullRequests: 2,
  failedWorkflows: 0,
  defaultBranch: "main",
  lastWorkflow: "success",
  updatedAt: "2026-09-06T00:00:00Z",
};

describe("integration status truthfulness", () => {
  it("never labels GitHub connected without a live probe", () => {
    const statuses = listIntegrationStatuses({ nowIso: "2026-09-06T12:00:00Z", github: githubDown, env: {} });
    expect(statuses.find((item) => item.id === "github")?.state).toBe("unavailable");
    expect(statuses.find((item) => item.id === "hermes")?.state).toBe("unavailable");
    expect(statuses.find((item) => item.id === "clickup.create_task")?.state).toBe("unavailable");
  });

  it("labels GitHub connected only after health succeeded", () => {
    const statuses = listIntegrationStatuses({ nowIso: "2026-09-06T12:00:00Z", github: githubUp, env: {} });
    expect(statuses.find((item) => item.id === "github")?.state).toBe("connected");
    expect(statuses.find((item) => item.id === "slack.send_message")?.state).not.toBe("connected");
  });
});

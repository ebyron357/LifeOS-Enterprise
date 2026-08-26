import { describe, expect, it } from "vitest";
import { canAutoExecute, classifyToolRisk, decideApproval, requiresApproval } from "@/lib/agent/policy";
import { getRegisteredTool } from "@/lib/agent/tools/registry";

describe("agent approval policy", () => {
  it("classifies read tools as read", () => {
    const tool = getRegisteredTool("lifeos.read_projects")!;
    expect(classifyToolRisk(tool)).toBe("read");
    expect(requiresApproval(tool)).toBe(false);
    expect(canAutoExecute(tool)).toBe(true);
  });

  it("requires approval for reversible writes by default", () => {
    const tool = getRegisteredTool("lifeos.stage_project_change")!;
    expect(classifyToolRisk(tool)).toBe("reversible");
    expect(requiresApproval(tool)).toBe(true);
    expect(canAutoExecute(tool)).toBe(false);
  });

  it("never auto-executes high-risk tools", () => {
    const tool = getRegisteredTool("vercel.deploy_production")!;
    expect(classifyToolRisk(tool)).toBe("high");
    expect(requiresApproval(tool)).toBe(true);
    expect(canAutoExecute(tool, { autoExecuteRead: true, autoExecuteReversible: true })).toBe(false);
  });

  it("records an approval decision without mutating other requests", () => {
    const decided = decideApproval({
      id: "apr-1",
      toolId: "slack.send_message",
      riskLevel: "high",
      summary: "Send Slack",
      args: {},
      createdAt: "2026-08-26T00:00:00.000Z",
      decision: "pending",
      decidedAt: null,
    }, "rejected", "2026-08-26T00:01:00.000Z");
    expect(decided.decision).toBe("rejected");
    expect(decided.decidedAt).toBe("2026-08-26T00:01:00.000Z");
  });
});

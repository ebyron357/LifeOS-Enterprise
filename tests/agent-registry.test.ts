import { describe, expect, it } from "vitest";
import { discoverMcpAdapters, validateMcpAdapterConfig } from "@/lib/agent/mcp";
import { getRegisteredTool, listRegisteredTools } from "@/lib/agent/tools/registry";

describe("tool registry", () => {
  it("lists tools with explicit configuration state and truthful availability", () => {
    const tools = listRegisteredTools({});
    expect(tools.length).toBeGreaterThan(10);
    expect(getRegisteredTool("lifeos.read_projects", {})?.configured).toBe(true);
    expect(getRegisteredTool("lifeos.read_projects", {})?.availability).toBe("available");
    expect(getRegisteredTool("slack.send_message", {})?.configured).toBe(false);
    expect(getRegisteredTool("slack.send_message", {})?.availability).toBe("unavailable");
    expect(getRegisteredTool("slack.send_message", {})?.unavailableReason).toMatch(/SLACK_BOT_TOKEN/);
    expect(getRegisteredTool("slack.send_message", {})?.missingRequirements).toContain("SLACK_BOT_TOKEN");
  });

  it("marks ClickUp configured (not connected) only with required execution config", () => {
    expect(getRegisteredTool("clickup.create_task", { CLICKUP_API_TOKEN: "x", CLICKUP_LIST_ID: "list" })?.configured).toBe(true);
    expect(getRegisteredTool("clickup.create_task", { CLICKUP_API_TOKEN: "x", CLICKUP_LIST_ID: "list" })?.availability).toBe("configured");
    expect(getRegisteredTool("clickup.create_task", {})?.configured).toBe(false);
  });

  it("discovers MCP adapters without inventing credentials", () => {
    const adapters = discoverMcpAdapters({});
    expect(adapters.find((item) => item.id === "slack")?.configured).toBe(false);
    expect(validateMcpAdapterConfig("unknown").configured).toBe(false);
  });

  it("never reports connected or degraded without a live probe", () => {
    const tools = listRegisteredTools({
      SLACK_BOT_TOKEN: "x",
      SLACK_DEFAULT_CHANNEL: "#ops",
      CLICKUP_API_TOKEN: "x",
      CLICKUP_LIST_ID: "list",
    });
    expect(tools.some((tool) => tool.availability === "connected" || tool.availability === "degraded")).toBe(false);
    expect(getRegisteredTool("slack.send_message", {
      SLACK_BOT_TOKEN: "x",
      SLACK_DEFAULT_CHANNEL: "#ops",
    })?.availability).toBe("configured");
  });

  it("marks write tools unavailable when durable approval storage is disabled", () => {
    const slack = getRegisteredTool("slack.send_message", {
      SLACK_BOT_TOKEN: "x",
      SLACK_DEFAULT_CHANNEL: "#ops",
      LIFEOS_APPROVAL_STORE: "none",
    });
    expect(slack?.configured).toBe(false);
    expect(slack?.availability).toBe("unavailable");
    expect(slack?.unavailableReason).toMatch(/approval storage/i);
    expect(getRegisteredTool("lifeos.read_projects", { LIFEOS_APPROVAL_STORE: "none" })?.configured).toBe(true);
  });
});

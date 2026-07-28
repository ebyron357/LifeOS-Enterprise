import { describe, expect, it } from "vitest";
import { buildCommandMap, filterCommandMap } from "@/lib/command-map/build-command-map";

const input = {
  projects: [
    {
      name: "LifeOS Enterprise",
      path: "Projects/LifeOS Enterprise.md",
      status: "active",
      priority: "P0",
      business: "LifeOS",
      nextAction: "Ship interactive visual V1",
      waitingOn: "",
      blocker: "Missing review",
      owner: "Bwa",
    },
    {
      name: "Waiting Ops",
      path: "Projects/Waiting Ops.md",
      status: "waiting",
      priority: "P2",
      business: "LifeOS",
      nextAction: "Follow up with partner",
      waitingOn: "Bwa",
      blocker: "",
    },
  ],
  agents: [{ name: "Chief of Staff", status: "active", purpose: "Choose what deserves attention." }],
  businesses: [{ name: "LifeOS", path: "Businesses/LifeOS.md", status: "active" }],
  people: [{ name: "Bwa", path: "50 People/Bwa.md", organization: "LifeOS", role: "Operator" }],
};

describe("command map data transformation", () => {
  it("builds nodes and evidenced relationships from vault-derived input", () => {
    const graph = buildCommandMap(input);
    expect(graph.nodes.some((node) => node.data.entityType === "project" && node.data.label === "LifeOS Enterprise")).toBe(true);
    expect(graph.nodes.some((node) => node.data.entityType === "business" && node.data.label === "LifeOS")).toBe(true);
    expect(graph.nodes.some((node) => node.data.entityType === "agent")).toBe(true);
    expect(graph.nodes.some((node) => node.data.entityType === "blocker")).toBe(true);
    expect(graph.edges.some((edge) => edge.data.relationship === "belongs-to")).toBe(true);
    expect(graph.edges.some((edge) => edge.data.relationship === "blocks")).toBe(true);
    expect(graph.edges.some((edge) => edge.data.relationship === "waiting-on")).toBe(true);
    expect(graph.edges.some((edge) => edge.data.relationship === "owned-by")).toBe(true);
  });

  it("does not invent unsupported agent-to-project edges", () => {
    const graph = buildCommandMap(input);
    expect(graph.edges.every((edge) => edge.data.relationship !== "assigned-to-agent")).toBe(true);
  });

  it("filters by entity type, status, search, and project focus", () => {
    const graph = buildCommandMap(input);
    const projectsOnly = filterCommandMap(graph, { entityTypes: ["project"] });
    expect(projectsOnly.nodes.every((node) => node.data.entityType === "project")).toBe(true);

    const blocked = filterCommandMap(graph, { statuses: ["active"] });
    expect(blocked.nodes.every((node) => !node.data.status || node.data.status.toLowerCase() === "active")).toBe(true);

    const searched = filterCommandMap(graph, { query: "chief" });
    expect(searched.nodes.some((node) => /chief/i.test(node.data.label))).toBe(true);

    const focused = filterCommandMap(graph, { projectName: "LifeOS Enterprise" });
    expect(focused.nodes.some((node) => node.data.label === "LifeOS Enterprise")).toBe(true);
    expect(focused.edges.length).toBeGreaterThan(0);
  });

  it("reports an empty-project warning when no projects exist", () => {
    const graph = buildCommandMap({ projects: [], agents: [], businesses: [], people: [] });
    expect(graph.warnings.join(" ")).toMatch(/no live projects/i);
  });
});

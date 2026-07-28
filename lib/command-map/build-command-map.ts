import type {
  CommandMapBuildInput,
  CommandMapEdge,
  CommandMapGraph,
  CommandMapNode,
} from "./types";
import { layoutCommandMap } from "./layout";

function slugId(prefix: string, value: string) {
  return `${prefix}:${value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item"}`;
}

function normalizeName(value: string) {
  return value.replace(/\[\[|\]\]/g, "").trim();
}

/**
 * Builds a command-map graph from verified vault-derived inputs only.
 * Does not invent relationships that are not evidenced by fields on those records.
 */
export function buildCommandMap(input: CommandMapBuildInput): CommandMapGraph {
  const warnings: string[] = [];
  const nodes = new Map<string, CommandMapNode>();
  const edges: CommandMapEdge[] = [];
  const now = (input.now ?? new Date()).toISOString();

  function ensureNode(node: CommandMapNode) {
    if (!nodes.has(node.id)) nodes.set(node.id, node);
  }

  function addEdge(source: string, target: string, relationship: string, explanation: string) {
    if (!nodes.has(source) || !nodes.has(target)) {
      warnings.push(`Skipped edge ${relationship}: missing endpoint.`);
      return;
    }
    const id = `edge:${source}->${target}:${relationship}`;
    if (edges.some((edge) => edge.id === id)) return;
    edges.push({
      id,
      source,
      target,
      label: relationship,
      data: { relationship, explanation },
    });
  }

  for (const business of input.businesses) {
    const name = normalizeName(business.name);
    if (!name) continue;
    ensureNode({
      id: slugId("business", name),
      position: { x: 0, y: 0 },
      data: {
        entityType: "business",
        label: name,
        status: business.status,
        path: business.path,
        description: "Business entity from the vault.",
        shape: "hex",
      },
    });
  }

  for (const person of input.people) {
    const name = normalizeName(person.name);
    if (!name) continue;
    ensureNode({
      id: slugId("person", name),
      position: { x: 0, y: 0 },
      data: {
        entityType: "person",
        label: name,
        path: person.path,
        description: [person.role, person.organization].filter(Boolean).join(" · ") || "Person from the vault.",
        shape: "circle",
      },
    });
  }

  for (const agent of input.agents) {
    const name = normalizeName(agent.name);
    if (!name) continue;
    ensureNode({
      id: slugId("agent", name),
      position: { x: 0, y: 0 },
      data: {
        entityType: "agent",
        label: name,
        status: agent.status,
        description: agent.purpose || "AI agent recorded in the vault.",
        shape: "diamond",
      },
    });
  }

  ensureNode({
    id: "system:lifeos",
    position: { x: 0, y: 0 },
    data: {
      entityType: "system",
      label: "LifeOS",
      description: "Canonical vault and GitHub source of truth.",
      shape: "hex",
    },
  });

  for (const project of input.projects) {
    const name = normalizeName(project.name);
    if (!name) continue;
    const projectId = slugId("project", name);
    ensureNode({
      id: projectId,
      position: { x: 0, y: 0 },
      data: {
        entityType: "project",
        label: name,
        status: project.status,
        priority: project.priority,
        path: project.path,
        description: project.nextAction,
        shape: "rect",
      },
    });

    addEdge(projectId, "system:lifeos", "tracked-by", `${name} is tracked in the LifeOS vault.`);

    const businessName = normalizeName(project.business);
    if (businessName) {
      const businessId = slugId("business", businessName);
      if (!nodes.has(businessId)) {
        ensureNode({
          id: businessId,
          position: { x: 0, y: 0 },
          data: {
            entityType: "business",
            label: businessName,
            description: "Referenced by project business metadata.",
            shape: "hex",
          },
        });
      }
      addEdge(projectId, businessId, "belongs-to", `${name} lists business “${businessName}”.`);
    }

    if (project.nextAction?.trim()) {
      const actionId = slugId("next-action", `${name}-${project.nextAction}`);
      ensureNode({
        id: actionId,
        position: { x: 0, y: 0 },
        data: {
          entityType: "next-action",
          label: project.nextAction.trim().slice(0, 72),
          description: `Next action for ${name}.`,
          shape: "rect",
        },
      });
      addEdge(projectId, actionId, "next-action", `Verified next_action on ${name}.`);
    }

    if (project.blocker?.trim()) {
      const blockerLabel = normalizeName(project.blocker);
      const blockerId = slugId("blocker", `${name}-${blockerLabel}`);
      ensureNode({
        id: blockerId,
        position: { x: 0, y: 0 },
        data: {
          entityType: "blocker",
          label: blockerLabel.slice(0, 72),
          description: `Blocker recorded on ${name}.`,
          shape: "diamond",
        },
      });
      addEdge(blockerId, projectId, "blocks", `Blocker field on ${name}.`);
    }

    if (project.waitingOn?.trim()) {
      const waitingLabel = normalizeName(project.waitingOn);
      const personMatch = input.people.find(
        (person) => normalizeName(person.name).toLowerCase() === waitingLabel.toLowerCase(),
      );
      if (personMatch) {
        const personId = slugId("person", personMatch.name);
        addEdge(projectId, personId, "waiting-on", `${name} waiting_on matches person “${personMatch.name}”.`);
      } else {
        const waitId = slugId("blocker", `waiting-${name}-${waitingLabel}`);
        ensureNode({
          id: waitId,
          position: { x: 0, y: 0 },
          data: {
            entityType: "blocker",
            label: `Waiting: ${waitingLabel.slice(0, 64)}`,
            description: `waiting_on field on ${name}.`,
            shape: "diamond",
          },
        });
        addEdge(projectId, waitId, "waiting-on", `waiting_on field on ${name}.`);
      }
    }

    if (project.owner?.trim()) {
      const ownerLabel = normalizeName(project.owner);
      const personMatch = input.people.find(
        (person) => normalizeName(person.name).toLowerCase() === ownerLabel.toLowerCase(),
      );
      if (personMatch) {
        addEdge(projectId, slugId("person", personMatch.name), "owned-by", `Owner metadata matches person “${personMatch.name}”.`);
      }
    }
  }

  if (!input.projects.length) {
    warnings.push("No live projects were available for the command map.");
  }

  const positioned = layoutCommandMap([...nodes.values()]);
  return {
    nodes: positioned,
    edges,
    generatedAt: now,
    warnings,
  };
}

export function filterCommandMap(
  graph: CommandMapGraph,
  options: {
    query?: string;
    entityTypes?: string[];
    statuses?: string[];
    projectName?: string;
  },
): CommandMapGraph {
  const query = options.query?.trim().toLowerCase() ?? "";
  const entityTypes = options.entityTypes?.filter(Boolean) ?? [];
  const statuses = options.statuses?.filter(Boolean).map((item) => item.toLowerCase()) ?? [];
  const projectName = options.projectName?.trim().toLowerCase() ?? "";

  let nodes = graph.nodes;

  if (entityTypes.length) {
    nodes = nodes.filter((node) => entityTypes.includes(node.data.entityType));
  }
  if (statuses.length) {
    nodes = nodes.filter((node) => !node.data.status || statuses.includes(node.data.status.toLowerCase()));
  }
  if (query) {
    nodes = nodes.filter((node) => {
      const haystack = [node.data.label, node.data.description, node.data.status, node.data.priority]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }
  if (projectName) {
    const projectIds = new Set(
      graph.nodes
        .filter((node) => node.data.entityType === "project" && node.data.label.toLowerCase().includes(projectName))
        .map((node) => node.id),
    );
    const related = new Set<string>(projectIds);
    for (const edge of graph.edges) {
      if (projectIds.has(edge.source) || projectIds.has(edge.target)) {
        related.add(edge.source);
        related.add(edge.target);
      }
    }
    // Intersect with filters already applied above — do not reset to the full graph.
    nodes = nodes.filter((node) => related.has(node.id));
  }

  const ids = new Set(nodes.map((node) => node.id));
  const edges = graph.edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target));
  return { ...graph, nodes, edges };
}

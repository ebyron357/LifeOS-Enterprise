import type { CommandMapEntityType, CommandMapNode } from "./types";

const COLUMN_X: Record<CommandMapEntityType, number> = {
  system: 40,
  business: 280,
  project: 560,
  "next-action": 860,
  agent: 280,
  person: 860,
  blocker: 860,
};

const ROW_GAP = 110;

/**
 * Deterministic layered layout — no physics, stable across renders.
 */
export function layoutCommandMap(nodes: CommandMapNode[]): CommandMapNode[] {
  const counters: Partial<Record<CommandMapEntityType, number>> = {};
  return nodes.map((node) => {
    const type = node.data.entityType;
    const row = counters[type] ?? 0;
    counters[type] = row + 1;
    const x = COLUMN_X[type] ?? 560;
    const y = 40 + row * ROW_GAP + (type === "agent" ? 40 : 0);
    return {
      ...node,
      position: { x, y },
    };
  });
}

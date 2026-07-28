"use client";

import type { Node, NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import type { CommandMapNodeData } from "@/lib/command-map/types";
import styles from "./CommandMap.module.css";

export type CommandMapFlowNode = Node<CommandMapNodeData, "lifeos">;

const shapeLabel: Record<CommandMapNodeData["shape"], string> = {
  rect: "rectangle",
  diamond: "diamond",
  circle: "circle",
  hex: "hexagon",
};

export function CommandMapNode({ data, selected }: NodeProps<CommandMapFlowNode>) {
  return (
    <div
      className={styles.node}
      data-entity={data.entityType}
      data-shape={data.shape}
      data-selected={selected ? "true" : "false"}
      aria-label={`${data.entityType}: ${data.label}${data.status ? `, status ${data.status}` : ""}`}
    >
      <Handle type="target" position={Position.Left} className={styles.handle} />
      <span className={styles.shapeHint} aria-hidden="true">{shapeLabel[data.shape].slice(0, 1).toUpperCase()}</span>
      <div className={styles.nodeBody}>
        <span className={styles.entityType}>{data.entityType}</span>
        <strong>{data.label}</strong>
        {data.status ? <span className={styles.status} data-status={data.status}>{data.status}</span> : null}
        {data.priority ? <span className={styles.priority}>{data.priority}</span> : null}
      </div>
      <Handle type="source" position={Position.Right} className={styles.handle} />
    </div>
  );
}

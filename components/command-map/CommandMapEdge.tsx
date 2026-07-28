"use client";

import type { EdgeProps } from "@xyflow/react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "@xyflow/react";
import type { CommandMapEdgeData } from "@/lib/command-map/types";
import styles from "./CommandMap.module.css";

export function CommandMapEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  data,
  markerEnd,
}: EdgeProps & { data?: CommandMapEdgeData }) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} className={styles.edge} />
      <EdgeLabelRenderer>
        <div
          className={styles.edgeLabel}
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
        >
          <span>{label || data?.relationship}</span>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

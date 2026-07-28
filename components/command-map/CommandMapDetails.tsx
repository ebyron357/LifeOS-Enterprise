"use client";

import Link from "next/link";
import type { CommandMapEdge, CommandMapNode } from "@/lib/command-map/types";
import { noteHref } from "@/lib/vault/slug";
import styles from "./CommandMap.module.css";

type CommandMapDetailsProps = {
  node: CommandMapNode | null;
  edges: CommandMapEdge[];
  onClear: () => void;
};

export function CommandMapDetails({ node, edges, onClear }: CommandMapDetailsProps) {
  if (!node) {
    return (
      <aside className={styles.details} aria-label="Node details">
        <p className="widget-eyebrow">Selection</p>
        <h3>No node selected</h3>
        <p>Select a node from the map or the keyboard list to inspect relationships.</p>
      </aside>
    );
  }

  const related = edges.filter((edge) => edge.source === node.id || edge.target === node.id);

  return (
    <aside className={styles.details} aria-label="Node details">
      <div className={styles.detailsHeader}>
        <div>
          <p className="widget-eyebrow">{node.data.entityType}</p>
          <h3>{node.data.label}</h3>
        </div>
        <button type="button" onClick={onClear}>Clear</button>
      </div>
      {node.data.status ? <p><strong>Status:</strong> {node.data.status}</p> : null}
      {node.data.priority ? <p><strong>Priority:</strong> {node.data.priority}</p> : null}
      {node.data.description ? <p>{node.data.description}</p> : null}
      {node.data.path ? (
        <p>
          <Link href={noteHref(node.data.path)}>Open vault note</Link>
        </p>
      ) : null}
      <div className={styles.relationshipList}>
        <h4>Relationships</h4>
        {related.length ? related.map((edge) => (
          <div key={edge.id}>
            <strong>{edge.data.relationship}</strong>
            <small>{edge.data.explanation}</small>
          </div>
        )) : <p>No evidenced relationships for this node.</p>}
      </div>
    </aside>
  );
}

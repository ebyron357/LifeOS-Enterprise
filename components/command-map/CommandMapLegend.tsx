"use client";

import styles from "./CommandMap.module.css";

const legend = [
  { type: "project", shape: "Rectangle", meaning: "Live project" },
  { type: "business", shape: "Hexagon", meaning: "Business or area" },
  { type: "agent", shape: "Diamond", meaning: "AI agent" },
  { type: "blocker", shape: "Diamond", meaning: "Blocker or wait" },
  { type: "person", shape: "Circle", meaning: "Person / owner" },
  { type: "next-action", shape: "Rectangle", meaning: "Next action" },
  { type: "system", shape: "Hexagon", meaning: "LifeOS system" },
];

export function CommandMapLegend() {
  return (
    <section className={styles.legend} aria-label="Command map legend">
      <h3>Legend</h3>
      <ul>
        {legend.map((item) => (
          <li key={item.type}>
            <span data-entity={item.type}>{item.shape}</span>
            <strong>{item.type}</strong>
            <small>{item.meaning}</small>
          </li>
        ))}
      </ul>
      <p>Status is shown as text on nodes. Color is supportive, never the only signal.</p>
    </section>
  );
}

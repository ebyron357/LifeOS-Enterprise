"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { buildCommandMap, filterCommandMap } from "@/lib/command-map/build-command-map";
import type {
  CommandMapBuildInput,
  CommandMapNode,
} from "@/lib/command-map/types";
import { useLifeosMotion } from "@/components/motion/MotionProvider";
import { CommandMapDetails } from "./CommandMapDetails";
import { CommandMapEdge } from "./CommandMapEdge";
import { CommandMapLegend } from "./CommandMapLegend";
import { CommandMapNode as CommandMapNodeView, type CommandMapFlowNode } from "./CommandMapNode";
import { CommandMapToolbar } from "./CommandMapToolbar";
import styles from "./CommandMap.module.css";

const nodeTypes = { lifeos: CommandMapNodeView } satisfies NodeTypes;
const edgeTypes = { lifeos: CommandMapEdge } satisfies EdgeTypes;

type CommandMapProps = {
  input: CommandMapBuildInput;
  reducedMotionForced?: boolean;
};

function CommandMapCanvas({ input }: CommandMapProps) {
  const { fitView, setViewport } = useReactFlow();
  const { allowMotion } = useLifeosMotion();
  const [query, setQuery] = useState("");
  const [entityType, setEntityType] = useState("");
  const [status, setStatus] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [focusMode, setFocusMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const buildResult = useMemo(() => {
    try {
      return { graph: buildCommandMap(input), error: null as string | null };
    } catch (caught) {
      return {
        graph: { nodes: [], edges: [], generatedAt: new Date().toISOString(), warnings: ["Build failed."] },
        error: caught instanceof Error ? caught.message : "Unable to build command map.",
      };
    }
  }, [input]);

  const baseGraph = buildResult.graph;
  const error = buildResult.error;

  const filtered = useMemo(() => filterCommandMap(baseGraph, {
    query,
    entityTypes: entityType ? [entityType] : [],
    statuses: status ? [status] : [],
    projectName: projectFilter || (focusMode && selectedId
      ? baseGraph.nodes.find((node) => node.id === selectedId && node.data.entityType === "project")?.data.label
      : undefined),
  }), [baseGraph, query, entityType, status, projectFilter, focusMode, selectedId]);

  const flowNodes: CommandMapFlowNode[] = useMemo(
    () => filtered.nodes.map((node) => ({
      id: node.id,
      type: "lifeos",
      position: node.position,
      data: node.data,
      selected: node.id === selectedId,
    })),
    [filtered.nodes, selectedId],
  );

  const flowEdges = useMemo(
    () => filtered.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      type: "lifeos" as const,
      data: edge.data,
    })),
    [filtered.edges],
  );

  const selectedNode: CommandMapNode | null = filtered.nodes.find((node) => node.id === selectedId)
    ?? baseGraph.nodes.find((node) => node.id === selectedId)
    ?? null;

  const projectOptions = useMemo(
    () => input.projects.map((project) => project.name).sort((a, b) => a.localeCompare(b)),
    [input.projects],
  );

  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const onFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: allowMotion ? 200 : 0 });
  }, [allowMotion, fitView]);

  const onResetView = useCallback(() => {
    setQuery("");
    setEntityType("");
    setStatus("");
    setProjectFilter("");
    setFocusMode(false);
    setSelectedId(null);
    setViewport({ x: 0, y: 0, zoom: 1 }, { duration: allowMotion ? 160 : 0 });
  }, [allowMotion, setViewport]);

  if (error) {
    return (
      <div className={styles.state} role="alert">
        <h3>Command map unavailable</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!baseGraph.nodes.length) {
    return (
      <div className={styles.state} role="status">
        <h3>No map entities</h3>
        <p>Live vault projects, businesses, people, and agents will appear here when available.</p>
      </div>
    );
  }

  return (
    <div className={styles.shell} data-focus={focusMode ? "true" : "false"}>
      <CommandMapToolbar
        query={query}
        entityType={entityType}
        status={status}
        projectFilter={projectFilter}
        focusMode={focusMode}
        projectOptions={projectOptions}
        onQueryChange={setQuery}
        onEntityTypeChange={setEntityType}
        onStatusChange={setStatus}
        onProjectFilterChange={setProjectFilter}
        onFocusModeChange={setFocusMode}
        onFitView={onFitView}
        onResetView={onResetView}
      />

      {baseGraph.warnings.length ? (
        <p className={styles.warning} role="status">{baseGraph.warnings.join(" ")}</p>
      ) : null}

      {isMobile ? (
        <div className={styles.mobileFallback} aria-label="Command map list fallback">
          <p>Mobile list view — canvas pan/zoom is simplified on narrow screens.</p>
          <ul>
            {filtered.nodes.map((node) => (
              <li key={node.id}>
                <button type="button" onClick={() => setSelectedId(node.id)} aria-pressed={selectedId === node.id}>
                  <span>{node.data.entityType}</span>
                  <strong>{node.data.label}</strong>
                  <small>{node.data.status || node.data.description || "No extra detail"}</small>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className={styles.canvas} aria-label="Interactive command map canvas">
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable
            panOnScroll
            zoomOnScroll
            minZoom={0.35}
            maxZoom={1.6}
            proOptions={{ hideAttribution: true }}
            onNodeClick={(_, node) => setSelectedId(node.id)}
            onPaneClick={() => setSelectedId(null)}
            defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
          >
            <Background gap={24} size={1} color="rgba(148,163,184,0.18)" />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable ariaLabel="Command map overview" />
          </ReactFlow>
        </div>
      )}

      <div className={styles.side}>
        <label className={styles.listLabel} htmlFor="command-map-node-list">Keyboard node list</label>
        <select
          id="command-map-node-list"
          className={styles.nodeSelect}
          value={selectedId ?? ""}
          onChange={(event) => setSelectedId(event.target.value || null)}
        >
          <option value="">Select a node</option>
          {filtered.nodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.data.entityType}: {node.data.label}
            </option>
          ))}
        </select>
        <CommandMapDetails
          node={selectedNode}
          edges={baseGraph.edges}
          onClear={() => setSelectedId(null)}
        />
        <CommandMapLegend />
      </div>
    </div>
  );
}

export function CommandMap(props: CommandMapProps) {
  return (
    <ReactFlowProvider>
      <CommandMapCanvas {...props} />
    </ReactFlowProvider>
  );
}

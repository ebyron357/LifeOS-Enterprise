"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { COMMAND_CENTER_WIDGET_META } from "@/lib/workspace/default-layout";
import type { CommandCenterWidgetId, WidgetStatus } from "@/lib/workspace/types";
import { useWorkspace } from "./WorkspaceProvider";

type WorkspaceWidgetProps = {
  id: CommandCenterWidgetId;
  status?: WidgetStatus;
  children: ReactNode;
  onOpenDetails?: () => void;
  detailsLabel?: string;
};

const STATUS_LABEL: Record<WidgetStatus, string> = {
  active: "Active",
  loading: "Loading",
  success: "Healthy",
  warning: "Needs attention",
  error: "Error",
  idle: "Idle",
};

export function WorkspaceWidget({
  id,
  status = "active",
  children,
  onOpenDetails,
  detailsLabel = "Open details",
}: WorkspaceWidgetProps) {
  const { state, setFocusedWidget, toggleMinimized } = useWorkspace();
  const prefersReducedMotion = useReducedMotion();
  const meta = COMMAND_CENTER_WIDGET_META[id];
  const chrome = state.widgets[id] ?? { minimized: false, hidden: false };
  const focused = state.focusedWidgetId === id;
  const reduceMotion = state.reducedMotion || Boolean(prefersReducedMotion);

  if (chrome.hidden) return null;

  return (
    <motion.section
      layout={reduceMotion ? undefined : true}
      className={[
        "workspace-widget",
        focused ? "is-focused" : "",
        chrome.minimized ? "is-minimized" : "",
        `status-${status}`,
      ].filter(Boolean).join(" ")}
      data-widget-id={id}
      aria-label={meta.title}
      tabIndex={-1}
      animate={reduceMotion ? undefined : { opacity: 1, scale: focused ? 1.01 : 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.18 }}
    >
      <header className="workspace-widget-header">
        <div className="workspace-widget-heading">
          <button
            type="button"
            className="workspace-drag-handle"
            aria-label={`Drag ${meta.title}`}
            title="Drag to rearrange"
          >
            <span aria-hidden="true">⋮⋮</span>
          </button>
          <div>
            <p className="widget-eyebrow">{meta.eyebrow}</p>
            <h2>{meta.title}</h2>
          </div>
        </div>
        <div className="workspace-widget-controls" role="toolbar" aria-label={`${meta.title} controls`}>
          <span className={`workspace-status-pill status-${status}`} aria-live="polite">
            {STATUS_LABEL[status]}
          </span>
          <button type="button" onClick={() => setFocusedWidget(focused ? null : id)} aria-pressed={focused}>
            {focused ? "Clear focus" : "Focus"}
          </button>
          <button type="button" onClick={() => toggleMinimized(id)} aria-pressed={chrome.minimized}>
            {chrome.minimized ? "Restore" : "Minimize"}
          </button>
          {onOpenDetails ? (
            <button type="button" onClick={onOpenDetails}>{detailsLabel}</button>
          ) : null}
        </div>
      </header>
      {!chrome.minimized ? <div className="workspace-widget-body">{children}</div> : (
        <p className="workspace-widget-minimized-note">{meta.primaryAction}. Restore to continue.</p>
      )}
    </motion.section>
  );
}

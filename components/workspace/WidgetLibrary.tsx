"use client";

import { COMMAND_CENTER_WIDGET_META } from "@/lib/workspace/default-layout";
import { COMMAND_CENTER_WIDGET_IDS } from "@/lib/workspace/default-layout";
import { useWorkspace } from "./WorkspaceProvider";

type WidgetLibraryProps = {
  open: boolean;
  onClose: () => void;
};

export function WidgetLibrary({ open, onClose }: WidgetLibraryProps) {
  const { state, setWidgetHidden, moveWidget } = useWorkspace();
  if (!open) return null;

  return (
    <div className="widget-library-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="widget-library"
        aria-label="Widget Library"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <h2>Widget Library / Customize</h2>
          <button type="button" onClick={onClose}>Close</button>
        </header>
        <p>Add, remove, show, hide, and reorder widgets. Changes persist in this browser.</p>
        <ul>
          {state.widgetOrder.map((id, index) => {
            const meta = COMMAND_CENTER_WIDGET_META[id];
            const hidden = Boolean(state.widgets[id]?.hidden);
            return (
              <li key={id}>
                <div>
                  <strong>{meta.title}</strong>
                  <small>{meta.eyebrow}</small>
                </div>
                <div className="widget-library-actions">
                  <button
                    type="button"
                    onClick={() => setWidgetHidden(id, !hidden)}
                  >
                    {hidden ? "Add widget" : "Remove widget"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setWidgetHidden(id, hidden ? false : true)}
                  >
                    {hidden ? "Show" : "Hide"}
                  </button>
                  <button
                    type="button"
                    onClick={() => moveWidget(id, "up")}
                    disabled={index === 0}
                  >
                    Move up
                  </button>
                  <button
                    type="button"
                    onClick={() => moveWidget(id, "down")}
                    disabled={index === state.widgetOrder.length - 1}
                  >
                    Move down
                  </button>
                </div>
              </li>
            );
          })}
          {COMMAND_CENTER_WIDGET_IDS.filter((id) => !state.widgetOrder.includes(id)).map((id) => {
            const meta = COMMAND_CENTER_WIDGET_META[id];
            return (
              <li key={id}>
                <div>
                  <strong>{meta.title}</strong>
                  <small>{meta.eyebrow}</small>
                </div>
                <div className="widget-library-actions">
                  <button type="button" onClick={() => setWidgetHidden(id, false)}>Add widget</button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

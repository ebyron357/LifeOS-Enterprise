"use client";

import {
  ResponsiveGridLayout,
  useContainerWidth,
  verticalCompactor,
  type Layout,
  type ResponsiveLayouts,
} from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { BreakpointLayouts, CommandCenterWidgetId } from "@/lib/workspace/types";
import { useWorkspace } from "./WorkspaceProvider";

type WorkspaceGridProps = {
  widgets: Array<{ id: CommandCenterWidgetId; node: ReactNode }>;
};

// lg starts below typical sidebar-adjusted desktop widths so the multi-column
// board is active around 1100px content width, not only at full 1200px+.
const BREAKPOINTS = { lg: 1100, md: 901, sm: 600, xs: 0 };
const COLS = { lg: 12, md: 10, sm: 6, xs: 4 };

export function WorkspaceGrid({ widgets }: WorkspaceGridProps) {
  const { state, hydrated, setLayouts, moveWidget, setWidgetHidden, toggleMinimized } = useWorkspace();
  const { width, containerRef, mounted } = useContainerWidth({ measureBeforeMount: true });
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(max-width: 900px)");
    const sync = () => setIsNarrow(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const layouts = useMemo(() => state.layouts as ResponsiveLayouts, [state.layouts]);

  function handleLayoutChange(current: Layout, allLayouts: ResponsiveLayouts) {
    if (!hydrated || isNarrow) return;

    const next = {
      lg: allLayouts.lg ?? state.layouts.lg,
      md: allLayouts.md ?? state.layouts.md,
      sm: allLayouts.sm ?? state.layouts.sm,
      xs: allLayouts.xs ?? state.layouts.xs,
    } as BreakpointLayouts;

    // Ensure the active breakpoint always receives the latest committed layout,
    // even if react-grid-layout omits a sparse key in `allLayouts`.
    const committed = current.map((item) => ({ ...item }));
    if (width >= BREAKPOINTS.lg) next.lg = committed;
    else if (width >= BREAKPOINTS.md) next.md = committed;
    else if (width >= BREAKPOINTS.sm) next.sm = committed;
    else next.xs = committed;

    setLayouts(next);
  }

  const useStacked = isNarrow || !mounted || width <= 0;

  const orderedWidgets = state.widgetOrder
    .map((id) => widgets.find((widget) => widget.id === id))
    .filter((widget): widget is { id: CommandCenterWidgetId; node: ReactNode } => Boolean(widget));
  const visibleWidgets = orderedWidgets.filter((widget) => !state.widgets[widget.id]?.hidden);
  const hiddenAll = visibleWidgets.length === 0;

  if (hiddenAll) {
    return (
      <div className="workspace-grid-skeleton" role="status">
        All widgets are hidden. Open Widget Library / Customize to add one back.
      </div>
    );
  }

  if (useStacked) {
    return (
      <div
        className="workspace-grid workspace-grid--stacked"
        ref={containerRef}
        data-workspace-layout={isNarrow ? "stacked" : "pending"}
        data-mobile-interactive="true"
      >
        <p className="workspace-mobile-hint">
          Mobile customization: reorder, minimize, or hide widgets below. Open Widget Library for full show/hide control.
        </p>
        {visibleWidgets.map(({ id, node }, index) => (
          <div key={id} className="workspace-grid-item workspace-grid-item--mobile" data-grid-id={id}>
            <div className="workspace-mobile-chrome" role="toolbar" aria-label={`${id} mobile controls`}>
              <button type="button" onClick={() => moveWidget(id, "up")} disabled={index === 0}>
                Move up
              </button>
              <button
                type="button"
                onClick={() => moveWidget(id, "down")}
                disabled={index === visibleWidgets.length - 1}
              >
                Move down
              </button>
              <button type="button" onClick={() => toggleMinimized(id)}>
                {state.widgets[id]?.minimized ? "Restore" : "Minimize"}
              </button>
              <button type="button" onClick={() => setWidgetHidden(id, true)}>
                Hide
              </button>
            </div>
            {node}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="workspace-grid" ref={containerRef} data-workspace-layout="grid">
      <ResponsiveGridLayout
        className="workspace-rgl"
        width={width}
        layouts={layouts}
        breakpoints={BREAKPOINTS}
        cols={COLS}
        rowHeight={28}
        margin={[14, 14]}
        containerPadding={[0, 0]}
        compactor={verticalCompactor}
        dragConfig={{
          enabled: true,
          handle: ".workspace-drag-handle",
          bounded: false,
          threshold: 3,
        }}
        resizeConfig={{
          enabled: true,
          handles: ["se"],
        }}
        onLayoutChange={handleLayoutChange}
      >
        {visibleWidgets.map(({ id, node }) => (
          <div key={id} className="workspace-grid-item" data-grid-id={id}>
            {node}
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}

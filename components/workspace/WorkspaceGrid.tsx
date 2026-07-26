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

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 0 };
const COLS = { lg: 12, md: 10, sm: 6, xs: 4 };

export function WorkspaceGrid({ widgets }: WorkspaceGridProps) {
  const { state, hydrated, setLayouts } = useWorkspace();
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

  function handleLayoutChange(_current: Layout, allLayouts: ResponsiveLayouts) {
    if (!hydrated || isNarrow) return;
    setLayouts({
      lg: allLayouts.lg ?? state.layouts.lg,
      md: allLayouts.md ?? state.layouts.md,
      sm: allLayouts.sm ?? state.layouts.sm,
      xs: allLayouts.xs ?? state.layouts.xs,
    } as BreakpointLayouts);
  }

  const useStacked = isNarrow || !mounted || width <= 0;

  if (useStacked) {
    return (
      <div className="workspace-grid workspace-grid--stacked" ref={containerRef} data-workspace-layout={isNarrow ? "stacked" : "pending"}>
        {widgets.map(({ id, node }) => (
          <div key={id} className="workspace-grid-item" data-grid-id={id}>
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
        {widgets.map(({ id, node }) => (
          <div key={id} className="workspace-grid-item" data-grid-id={id}>
            {node}
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}

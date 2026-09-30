import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RouteError from "@/app/error";
import { WidgetErrorBoundary } from "@/components/workspace/WidgetErrorBoundary";
import { WorkspaceProvider } from "@/components/workspace/WorkspaceProvider";
import { WorkspaceWidget } from "@/components/workspace/WorkspaceWidget";
import { createDefaultWorkspaceLayout, LAYOUT_STORAGE_KEY } from "@/lib/workspace/default-layout";
import { parseWorkspaceLayout } from "@/lib/workspace/layout-storage";

const failure = { enabled: true };

function Boom() {
  if (failure.enabled) throw new Error("Quest data exploded");
  return <p>Widget recovered</p>;
}

describe("widget error boundaries", () => {
  beforeEach(() => {
    failure.enabled = true;
    window.localStorage.clear();
    // React reports caught render errors to the console; keep test output readable.
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("shows a visible diagnostic instead of crashing, then retries the widget", () => {
    const onRepairLayout = vi.fn();
    render(
      <div>
        <WidgetErrorBoundary widgetName="Game loop" onRepairLayout={onRepairLayout}>
          <Boom />
        </WidgetErrorBoundary>
        <p>Sibling still rendered</p>
      </div>,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Game loop could not load.");
    expect(alert).toHaveTextContent("Quest data exploded");
    expect(screen.getByText("Sibling still rendered")).toBeInTheDocument();

    // Still broken: retry shows the diagnostic again rather than a blank widget.
    fireEvent.click(within(alert).getByRole("button", { name: "Retry widget" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Quest data exploded");

    failure.enabled = false;
    fireEvent.click(within(screen.getByRole("alert")).getByRole("button", { name: "Retry widget" }));
    expect(screen.getByText("Widget recovered")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(onRepairLayout).not.toHaveBeenCalled();
  });

  it("offers layout repair from inside a failing workspace widget without taking down its neighbors", () => {
    const corrupted = { ...createDefaultWorkspaceLayout(), focusedWidgetId: "ghost-widget" };
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(corrupted));
    const statuses: unknown[] = [];
    const onStatus = (event: Event) => statuses.push((event as CustomEvent).detail);
    window.addEventListener("lifeos-workspace-status", onStatus);

    render(
      <WorkspaceProvider>
        <WorkspaceWidget id="game-loop">
          <Boom />
        </WorkspaceWidget>
        <WorkspaceWidget id="prayer">
          <p>Prayer widget is fine</p>
        </WorkspaceWidget>
      </WorkspaceProvider>,
    );

    const gameWidget = screen.getByLabelText("Game loop");
    const alert = within(gameWidget).getByRole("alert");
    expect(alert).toHaveTextContent("Game loop could not load.");
    expect(alert).toHaveTextContent("Quest data exploded");
    // Widget chrome stays usable around the diagnostic.
    expect(within(gameWidget).getByRole("button", { name: "Minimize" })).toBeInTheDocument();
    expect(screen.getByText("Prayer widget is fine")).toBeInTheDocument();

    failure.enabled = false;
    fireEvent.click(within(alert).getByRole("button", { name: "Repair layout" }));
    expect(within(gameWidget).getByText("Widget recovered")).toBeInTheDocument();
    expect(parseWorkspaceLayout(window.localStorage.getItem(LAYOUT_STORAGE_KEY)).focusedWidgetId).toBeNull();
    expect(statuses).toEqual([
      { message: "Layout state repaired (1 fix).", repairs: ['Cleared stale focus on "ghost-widget".'] },
    ]);
    window.removeEventListener("lifeos-workspace-status", onStatus);
  });

  it("renders a route-level fallback with a working Try again button", () => {
    const reset = vi.fn();
    render(<RouteError error={new Error("Vault index unavailable")} reset={reset} />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("This page hit an error.");
    expect(alert).toHaveTextContent("Vault index unavailable");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledTimes(1);

    cleanup();
    const retry = vi.fn();
    render(<RouteError error={new Error("Transient")} retry={retry} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledTimes(1);
  });
});

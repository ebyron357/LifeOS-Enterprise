"use client";

import { Component, Fragment, type ErrorInfo, type ReactNode } from "react";

type WidgetErrorBoundaryProps = {
  widgetName: string;
  children: ReactNode;
  /** Normalizes the stored layout. Offered because a corrupt layout is a common cause. */
  onRepairLayout?: () => void;
};

type WidgetErrorBoundaryState = {
  error: Error | null;
  attempt: number;
};

/**
 * Contains a render failure inside one widget so the rest of the workspace keeps working.
 * Shows a visible diagnostic with retry and layout-repair options instead of a blank page.
 */
export class WidgetErrorBoundary extends Component<WidgetErrorBoundaryProps, WidgetErrorBoundaryState> {
  state: WidgetErrorBoundaryState = { error: null, attempt: 0 };

  static getDerivedStateFromError(error: unknown): Partial<WidgetErrorBoundaryState> {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Keep a trace for debugging; the visible diagnostic is the primary signal.
    console.warn(`[LifeOS] ${this.props.widgetName} widget failed to render.`, error, info.componentStack);
  }

  private retry = () => {
    this.setState((current) => ({ error: null, attempt: current.attempt + 1 }));
  };

  private repair = () => {
    this.props.onRepairLayout?.();
    this.retry();
  };

  render() {
    const { error, attempt } = this.state;
    if (!error) {
      // Keyed so "Retry widget" remounts the subtree from scratch.
      return <Fragment key={attempt}>{this.props.children}</Fragment>;
    }

    return (
      <div className="widget-error" role="alert">
        <strong>{this.props.widgetName} could not load.</strong>
        <p className="widget-error-message">{error.message || "Unknown widget error."}</p>
        <p className="widget-error-hint">
          Other widgets keep working. Retry this widget, or repair the saved layout if the problem continues.
        </p>
        <div className="widget-error-actions">
          <button type="button" onClick={this.retry}>Retry widget</button>
          {this.props.onRepairLayout ? (
            <button type="button" onClick={this.repair}>Repair layout</button>
          ) : null}
        </div>
      </div>
    );
  }
}

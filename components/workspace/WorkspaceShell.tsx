"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { RESET_LAYOUT_CONFIRMATION, WORKSPACE_STATUS_EVENT, type WorkspaceStatusDetail } from "@/lib/workspace/commands";
import { describeLayoutRepairs, LAYOUT_SAVE_FAILED_MESSAGE } from "@/lib/workspace/layout-storage";
import { WORKSPACES, workspaceFromPath } from "@/lib/workspace/workspaces";
import { CommandPalette } from "./CommandPalette";
import { useWorkspace } from "./WorkspaceProvider";
import { WidgetLibrary } from "./WidgetLibrary";

type WorkspaceShellProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  children: ReactNode;
  toolbarExtra?: ReactNode;
};

export function WorkspaceShell({
  title,
  eyebrow = "Workspace OS",
  description,
  children,
  toolbarExtra,
}: WorkspaceShellProps) {
  const pathname = usePathname() ?? "/dashboard";
  const activeWorkspace = workspaceFromPath(pathname);
  const { resetLayout, repairLayout, focusNextWidget, toggleReducedMotion, diagnostics, state } = useWorkspace();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Workspace ready.");
  const [repairReport, setRepairReport] = useState<string[]>([]);

  function restoreDefaultLayout() {
    if (!window.confirm(RESET_LAYOUT_CONFIRMATION)) {
      setStatusMessage("Default layout restore cancelled. Nothing changed.");
      return;
    }
    const saved = resetLayout();
    setRepairReport([]);
    setStatusMessage(saved ? "Default layout restored." : `Default layout could not be saved. ${LAYOUT_SAVE_FAILED_MESSAGE}`);
  }

  function runLayoutRepair() {
    const { repairs, saved } = repairLayout();
    setRepairReport(saved ? repairs : []);
    setStatusMessage(describeLayoutRepairs(repairs, saved));
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const typing = tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((value) => !value);
        return;
      }

      if (typing) return;

      if (event.key.toLowerCase() === "q" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        window.dispatchEvent(new CustomEvent("lifeos-open-quick-capture"));
      }
    }

    function onStatus(event: Event) {
      const detail = (event as CustomEvent<WorkspaceStatusDetail>).detail;
      if (!detail) return;
      if (typeof detail === "string") {
        setStatusMessage(detail);
        return;
      }
      setStatusMessage(detail.message);
      if (detail.repairs) setRepairReport(detail.repairs);
    }

    document.addEventListener("keydown", onKeyDown);
    window.addEventListener(WORKSPACE_STATUS_EVENT, onStatus);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(WORKSPACE_STATUS_EVENT, onStatus);
    };
  }, []);

  return (
    <div className="workspace-shell">
      <header className="workspace-shell-header">
        <div>
          <p className="widget-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          {description ? <p className="workspace-shell-description">{description}</p> : null}
        </div>
        <div className="workspace-shell-actions">
          <button type="button" className="workspace-action" onClick={() => setPaletteOpen(true)} aria-keyshortcuts="Control+K Meta+K">
            Command palette
            <kbd>⌘K</kbd>
          </button>
          <button
            type="button"
            className="workspace-action workspace-action--primary"
            onClick={restoreDefaultLayout}
          >
            Restore default layout
          </button>
          <button
            type="button"
            className="workspace-action"
            onClick={runLayoutRepair}
          >
            Repair layout
          </button>
          <button
            type="button"
            className="workspace-action"
            onClick={() => setLibraryOpen(true)}
          >
            Widget library / Customize
          </button>
          <button
            type="button"
            className="workspace-action"
            onClick={() => {
              focusNextWidget();
              setStatusMessage("Focused next widget.");
            }}
          >
            Focus next
          </button>
          <button
            type="button"
            className="workspace-action"
            aria-pressed={state.reducedMotion}
            onClick={() => {
              toggleReducedMotion();
              setStatusMessage(state.reducedMotion ? "Motion restored." : "Reduced motion enabled.");
            }}
          >
            {state.reducedMotion ? "Motion: reduced" : "Motion: full"}
          </button>
          {toolbarExtra}
        </div>
      </header>

      <nav className="workspace-switcher" aria-label="Workspace OS navigation">
        {WORKSPACES.map((workspace) => (
          <Link
            key={workspace.id}
            href={workspace.href}
            className={activeWorkspace === workspace.id ? "is-active" : ""}
            aria-current={activeWorkspace === workspace.id ? "page" : undefined}
            title={workspace.description}
          >
            <span>{workspace.label}</span>
            {!workspace.implemented ? <em>Later</em> : null}
          </Link>
        ))}
      </nav>

      <p className="workspace-live-region" aria-live="polite">{statusMessage}</p>
      {repairReport.length ? (
        <section className="workspace-diagnostics workspace-repair-report" aria-label="Layout repair report">
          <p>What was repaired:</p>
          <ul>
            {repairReport.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <button type="button" className="workspace-action" onClick={() => setRepairReport([])}>
            Dismiss repair report
          </button>
        </section>
      ) : null}
      {diagnostics.length ? (
        <p className="workspace-diagnostics" role="status">{diagnostics.join(" ")}</p>
      ) : null}

      {children}

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <WidgetLibrary open={libraryOpen} onClose={() => setLibraryOpen(false)} />
    </div>
  );
}

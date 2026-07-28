"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { WORKSPACES, workspaceFromPath } from "@/lib/workspace/workspaces";
import { CommandPalette } from "./CommandPalette";
import { useWorkspace } from "./WorkspaceProvider";

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
  const { resetLayout, focusNextWidget, toggleReducedMotion, state } = useWorkspace();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Workspace ready.");

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
      const detail = (event as CustomEvent<string>).detail;
      if (detail) setStatusMessage(detail);
    }

    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("lifeos-workspace-status", onStatus);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("lifeos-workspace-status", onStatus);
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
            onClick={() => {
              resetLayout();
              setStatusMessage("Default layout restored.");
            }}
          >
            Restore default layout
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

      {children}

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}

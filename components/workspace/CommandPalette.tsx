"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { filterCommands, type WorkspaceCommandId } from "@/lib/workspace/commands";
import { getWorkspace } from "@/lib/workspace/workspaces";
import { useWorkspace } from "./WorkspaceProvider";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { resetLayout, focusNextWidget, toggleReducedMotion } = useWorkspace();
  const [query, setQuery] = useState("");

  function closePalette() {
    setQuery("");
    onOpenChange(false);
  }

  function runCommand(id: WorkspaceCommandId) {
    closePalette();

    if (id.startsWith("open-") && id !== "open-quick-capture") {
      const workspaceId = id.replace("open-", "") as Parameters<typeof getWorkspace>[0];
      router.push(getWorkspace(workspaceId).href);
      return;
    }

    switch (id) {
      case "open-quick-capture":
        window.dispatchEvent(new CustomEvent("lifeos-open-quick-capture"));
        break;
      case "reset-layout":
        resetLayout();
        window.dispatchEvent(new CustomEvent("lifeos-workspace-status", { detail: "Default layout restored." }));
        break;
      case "focus-next-widget":
        focusNextWidget();
        window.dispatchEvent(new CustomEvent("lifeos-workspace-status", { detail: "Focused next widget." }));
        break;
      case "toggle-reduced-motion":
        toggleReducedMotion();
        window.dispatchEvent(new CustomEvent("lifeos-workspace-status", { detail: "Reduced motion toggled." }));
        break;
      default:
        break;
    }
  }

  if (!open) return null;

  const commands = filterCommands(query);

  return (
    <div className="command-palette-overlay" role="presentation" onMouseDown={closePalette}>
      <Command
        className="command-palette"
        label="LifeOS command palette"
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") closePalette();
        }}
      >
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder="Search commands…"
          autoFocus
          aria-label="Search commands"
        />
        <Command.List>
          <Command.Empty>No matching commands.</Command.Empty>
          {commands.map((command) => (
            <Command.Item
              key={command.id}
              value={`${command.label} ${command.keywords.join(" ")}`}
              onSelect={() => runCommand(command.id)}
            >
              <span>{command.label}</span>
              {command.shortcutHint ? <kbd>{command.shortcutHint}</kbd> : null}
            </Command.Item>
          ))}
        </Command.List>
        <p className="command-palette-hint">Tip: Ctrl/⌘ K opens this palette. Esc closes it.</p>
      </Command>
    </div>
  );
}

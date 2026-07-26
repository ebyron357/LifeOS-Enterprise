import type { WorkspaceId } from "./types";
import { WORKSPACES } from "./workspaces";

export type WorkspaceCommandId =
  | `open-${WorkspaceId}`
  | "open-quick-capture"
  | "reset-layout"
  | "focus-next-widget"
  | "toggle-reduced-motion";

export type WorkspaceCommand = {
  id: WorkspaceCommandId;
  label: string;
  keywords: string[];
  shortcutHint?: string;
};

export const WORKSPACE_COMMANDS: WorkspaceCommand[] = [
  ...WORKSPACES.map((workspace) => ({
    id: `open-${workspace.id}` as WorkspaceCommandId,
    label: `Open ${workspace.label}`,
    keywords: [workspace.label, workspace.id, "workspace", "open"],
  })),
  {
    id: "open-quick-capture",
    label: "Open Quick Capture",
    keywords: ["capture", "inbox", "note", "quick"],
    shortcutHint: "Q",
  },
  {
    id: "reset-layout",
    label: "Reset dashboard layout",
    keywords: ["reset", "layout", "default", "restore"],
  },
  {
    id: "focus-next-widget",
    label: "Focus next widget",
    keywords: ["focus", "widget", "next", "keyboard"],
  },
  {
    id: "toggle-reduced-motion",
    label: "Toggle reduced motion",
    keywords: ["motion", "accessibility", "reduce", "animation"],
  },
];

export function filterCommands(query: string): WorkspaceCommand[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return WORKSPACE_COMMANDS;
  return WORKSPACE_COMMANDS.filter((command) => {
    const haystack = `${command.label} ${command.keywords.join(" ")}`.toLowerCase();
    return haystack.includes(normalized);
  });
}

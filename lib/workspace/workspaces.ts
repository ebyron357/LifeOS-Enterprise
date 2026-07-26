import type { WorkspaceDefinition, WorkspaceId } from "./types";

export const WORKSPACES: readonly WorkspaceDefinition[] = [
  {
    id: "command-center",
    label: "Command Center",
    href: "/dashboard",
    description: "Interactive mission control and live vault widgets.",
    implemented: true,
  },
  {
    id: "projects",
    label: "Projects",
    href: "/projects",
    description: "Project portfolio and execution records.",
    implemented: true,
  },
  {
    id: "ai-workforce",
    label: "AI Workforce",
    href: "/agents",
    description: "Agent roles and operating notes.",
    implemented: true,
  },
  {
    id: "knowledge-vault",
    label: "Knowledge Vault",
    href: "/resources",
    description: "Library browser over approved vault notes.",
    implemented: true,
  },
  {
    id: "automation-hub",
    label: "Automation Hub",
    href: "/workspace/automation",
    description: "Automation operations surface (prepared for a later sprint).",
    implemented: false,
  },
  {
    id: "developer-center",
    label: "Developer Center",
    href: "/workspace/developer",
    description: "Repository and delivery operations (prepared for a later sprint).",
    implemented: false,
  },
  {
    id: "analytics",
    label: "Analytics",
    href: "/workspace/analytics",
    description: "Signal analytics surface (prepared for a later sprint).",
    implemented: false,
  },
] as const;

export function getWorkspace(id: WorkspaceId): WorkspaceDefinition {
  const workspace = WORKSPACES.find((item) => item.id === id);
  if (!workspace) throw new Error(`Unknown workspace: ${id}`);
  return workspace;
}

export function workspaceFromPath(pathname: string): WorkspaceId {
  if (pathname.startsWith("/projects")) return "projects";
  if (pathname.startsWith("/agents")) return "ai-workforce";
  if (pathname.startsWith("/resources") || pathname.startsWith("/search") || pathname.startsWith("/note")) {
    return "knowledge-vault";
  }
  if (pathname.startsWith("/workspace/automation")) return "automation-hub";
  if (pathname.startsWith("/workspace/developer")) return "developer-center";
  if (pathname.startsWith("/workspace/analytics")) return "analytics";
  return "command-center";
}

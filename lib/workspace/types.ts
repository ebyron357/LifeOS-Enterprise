export type WorkspaceId =
  | "command-center"
  | "projects"
  | "ai-workforce"
  | "knowledge-vault"
  | "automation-hub"
  | "developer-center"
  | "analytics";

export type CommandCenterWidgetId =
  | "mission-status"
  | "cognitive-support"
  | "project-command-board"
  | "decision-queue"
  | "morning-brief"
  | "personal-growth"
  | "github-health"
  | "revenue-radar"
  | "prayer"
  | "ai-workforce";

export type WidgetStatus = "active" | "loading" | "success" | "warning" | "error" | "idle";

export type LayoutItem = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
};

export type BreakpointLayouts = Record<"lg" | "md" | "sm" | "xs", LayoutItem[]>;

export type WidgetChromeState = {
  minimized: boolean;
  hidden: boolean;
};

export type WorkspaceLayoutState = {
  version: 1 | 2;
  workspaceId: WorkspaceId;
  layouts: BreakpointLayouts;
  widgets: Record<string, WidgetChromeState>;
  focusedWidgetId: string | null;
  reducedMotion: boolean;
};

export type WorkspaceDefinition = {
  id: WorkspaceId;
  label: string;
  href: string;
  description: string;
  implemented: boolean;
};

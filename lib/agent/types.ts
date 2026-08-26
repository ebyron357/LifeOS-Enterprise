import type { ProjectBrief, VaultDashboardData } from "@/lib/lifeos/types";

export type PersistenceClass =
  | "ephemeral"
  | "browser-local"
  | "server-session"
  | "persisted"
  | "canonical";

export type AgentState =
  | "idle"
  | "listening"
  | "thinking"
  | "invoking_tool"
  | "awaiting_approval"
  | "paused"
  | "speaking"
  | "error"
  | "stopped";

export type RiskLevel = "read" | "reversible" | "high";

export type ToolCategory =
  | "lifeos-read"
  | "lifeos-write-proposal"
  | "github"
  | "clickup"
  | "slack"
  | "vercel"
  | "supabase"
  | "n8n"
  | "browser-screen"
  | "calendar"
  | "email"
  | "documentation"
  | "knowledge"
  | "learning"
  | "mcp-adapter";

export type ToolDefinition = {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  riskLevel: RiskLevel;
  requiresApproval: boolean;
  configured: boolean;
  capabilities: string[];
  unavailableReason?: string;
};

export type ToolInvocation = {
  id: string;
  toolId: string;
  args: Record<string, unknown>;
  requestedAt: string;
};

export type ToolResult = {
  invocationId: string;
  toolId: string;
  ok: boolean;
  status: "completed" | "blocked-approval" | "rejected" | "unavailable" | "failed";
  summary: string;
  evidence: string[];
  stagedChange?: Record<string, unknown>;
  error?: string;
};

export type ApprovalDecision = "pending" | "approved" | "rejected";

export type ApprovalRequest = {
  id: string;
  toolId: string;
  riskLevel: RiskLevel;
  summary: string;
  args: Record<string, unknown>;
  createdAt: string;
  decision: ApprovalDecision;
  decidedAt: string | null;
};

export type ActivityEventKind =
  | "session-started"
  | "session-stopped"
  | "screen-share-started"
  | "screen-share-stopped"
  | "screen-analysis-paused"
  | "screen-analysis-resumed"
  | "mission-started"
  | "mission-completed"
  | "tool-invoked"
  | "tool-result"
  | "approval-requested"
  | "approval-accepted"
  | "approval-rejected"
  | "agent-paused"
  | "agent-resumed"
  | "agent-stopped"
  | "recoverable-error"
  | "terminal-failure";

export type ActivityEvent = {
  id: string;
  kind: ActivityEventKind;
  at: string;
  message: string;
  toolId?: string;
  evidence?: string[];
};

export type TeachingMode =
  | "Explain"
  | "Walk Me Through It"
  | "Teach Me"
  | "Show Me What To Click"
  | "Quiz Me"
  | "Practice"
  | "Review"
  | "Troubleshoot";

export type TeachingStep = {
  index: number;
  title: string;
  instruction: string;
  lookFor: string;
  expectedResult: string;
  nextHint: string;
};

export type TeachingPlan = {
  mode: TeachingMode;
  goal: string;
  currentStepIndex: number;
  steps: TeachingStep[];
  source: "lifeos-knowledge" | "screen-context" | "user-question";
};

export type ScreenAwarenessSnapshot = {
  sharing: boolean;
  paused: boolean;
  sourceName: string | null;
  width: number | null;
  height: number | null;
  capturedAt: string | null;
  stale: boolean;
  permission: "granted" | "denied" | "prompt" | "unsupported" | "ended";
  analysisAllowed: boolean;
};

export type ConversationChannel = "text" | "voice";

export type AgentTurnInput = {
  sessionId: string;
  channel: ConversationChannel;
  text: string;
  nowIso: string;
  vault: Pick<VaultDashboardData, "projects" | "agents" | "activeProjects" | "waitingOn" | "reviewsDue" | "priorities">;
  screen: ScreenAwarenessSnapshot | null;
  pendingApprovals: ApprovalRequest[];
  paused: boolean;
  transcriptPrivacy: "ephemeral" | "hidden";
  teachingMode?: TeachingMode | null;
};

export type AgentTurnResult = {
  reply: string;
  spokenReply: string;
  state: AgentState;
  mission: string | null;
  currentTask: string | null;
  nextStep: string | null;
  lastCompletedStep: string | null;
  waitingForOwner: boolean;
  invocations: ToolInvocation[];
  results: ToolResult[];
  approvals: ApprovalRequest[];
  activity: ActivityEvent[];
  teaching: TeachingPlan | null;
  evidence: string[];
};

export type AgentSessionContext = {
  sessionId: string;
  createdAt: string;
  workspace: "conversation";
  currentProject: ProjectBrief | null;
  conversationId: string;
  currentTask: string | null;
  screen: ScreenAwarenessSnapshot | null;
  activeToolIds: string[];
  permissions: {
    microphone: boolean;
    screenShare: boolean;
    autoExecuteReversible: boolean;
  };
  approvals: ApprovalRequest[];
  pendingWork: string[];
  completedActions: string[];
  evidence: string[];
  persistence: Record<string, PersistenceClass>;
};

export type LlmProviderId = "none" | "openai-compatible";

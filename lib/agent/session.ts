import type { AgentSessionContext, ApprovalRequest, PersistenceClass, ScreenAwarenessSnapshot } from "./types";

export const SESSION_PERSISTENCE: Record<string, PersistenceClass> = {
  conversationTranscript: "ephemeral",
  voiceAudio: "ephemeral",
  screenFrames: "ephemeral",
  screenShareState: "browser-local",
  agentActivity: "browser-local",
  pendingApprovals: "browser-local",
  teachingProgress: "browser-local",
  hmacSessionToken: "server-session",
  dailyBriefRecords: "browser-local",
  workspaceLayout: "browser-local",
  changePlanDrafts: "browser-local",
  vaultNotes: "canonical",
  githubMain: "canonical",
};

export function createAgentSession(nowIso: string, sessionId: string): AgentSessionContext {
  return {
    sessionId,
    createdAt: nowIso,
    workspace: "conversation",
    currentProject: null,
    conversationId: `conv-${sessionId}`,
    currentTask: null,
    screen: null,
    activeToolIds: [],
    permissions: {
      microphone: false,
      screenShare: false,
      autoExecuteReversible: false,
    },
    approvals: [],
    pendingWork: [],
    completedActions: [],
    evidence: [],
    persistence: SESSION_PERSISTENCE,
  };
}

export function attachScreen(session: AgentSessionContext, screen: ScreenAwarenessSnapshot | null): AgentSessionContext {
  return {
    ...session,
    screen,
    permissions: { ...session.permissions, screenShare: Boolean(screen?.sharing) },
  };
}

export function upsertApproval(session: AgentSessionContext, approval: ApprovalRequest): AgentSessionContext {
  const others = session.approvals.filter((item) => item.id !== approval.id);
  return { ...session, approvals: [...others, approval] };
}

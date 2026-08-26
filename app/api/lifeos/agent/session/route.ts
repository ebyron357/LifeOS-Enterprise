import { NextResponse } from "next/server";
import { discoverMcpAdapters } from "@/lib/agent/mcp";
import { resolveLlmProvider } from "@/lib/agent/providers/llm";
import { SESSION_PERSISTENCE } from "@/lib/agent/session";
import { listRegisteredTools } from "@/lib/agent/tools/registry";
import { withinAgentRateLimit, validOrigin } from "@/lib/agent/http";
import { createEphemeralVoiceSessionToken, voiceFeatureEnabled } from "@/lib/voice/security";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!validOrigin(request)) {
    return NextResponse.json({ ok: false, error: "Origin not allowed." }, { status: 403 });
  }
  if (!withinAgentRateLimit(request)) {
    return NextResponse.json({ ok: false, error: "Rate limit exceeded." }, { status: 429 });
  }

  return NextResponse.json({
    ok: true,
    voiceEnabled: voiceFeatureEnabled(),
    llmProvider: resolveLlmProvider(),
    sessionToken: createEphemeralVoiceSessionToken(),
    tools: listRegisteredTools(),
    mcpAdapters: discoverMcpAdapters(),
    persistence: SESSION_PERSISTENCE,
    calendarWrites: false,
    agentLaunch: false,
    livekitRoomTokens: false,
  });
}

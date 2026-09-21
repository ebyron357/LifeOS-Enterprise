import { NextResponse } from "next/server";
import { validOrigin, withinAgentRateLimit } from "@/lib/agent/http";
import { recommendPrompts, searchPrompts } from "@/lib/prompt-intelligence/catalog";
import { toAgentPromptView } from "@/lib/prompt-intelligence/security";
import { collectPromptRecords } from "@/lib/prompt-intelligence/sources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!validOrigin(request)) {
    return NextResponse.json({ ok: false, error: "origin_not_allowed" }, { status: 403 });
  }
  if (!withinAgentRateLimit(request)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const project = url.searchParams.get("project") ?? "";
  const task = url.searchParams.get("task") ?? "";
  const includeBody = url.searchParams.get("includeBody") === "1" || url.searchParams.get("includeBody") === "true";
  const publicSafeOnly = url.searchParams.get("publicSafeOnly") === "1";

  const prompts = await collectPromptRecords();
  const searched = searchPrompts(prompts, query, {
    project: url.searchParams.get("projectFilter") ?? undefined,
    client: url.searchParams.get("client") ?? undefined,
    agent: url.searchParams.get("agent") ?? undefined,
    model: url.searchParams.get("model") ?? undefined,
    taskType: url.searchParams.get("taskType") ?? undefined,
    tag: url.searchParams.get("tag") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
  });
  const recommended = recommendPrompts(prompts, { project, task, query })
    .map((item) => {
      const record = prompts.find((prompt) => prompt.id === item.prompt.id);
      if (!record) return null;
      return {
        ...toAgentPromptView(record, { includeBody, publicSafeOnly }),
        score: item.score,
        reason: item.reason,
        warning: item.warning,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return NextResponse.json({
    ok: true,
    mode: "prompt-intelligence",
    write: false,
    count: searched.length,
    prompts: searched.map((prompt) => toAgentPromptView(prompt, { includeBody, publicSafeOnly })),
    recommended,
    limitations: {
      semanticIndex: false,
      durableUsageWrite: false,
      publicPrivateBodies: false,
    },
  });
}

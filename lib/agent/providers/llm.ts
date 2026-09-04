import type { LlmProviderId } from "../types";

export function resolveLlmProvider(env: NodeJS.ProcessEnv = process.env): LlmProviderId {
  if (env.LIFEOS_AGENT_LLM_API_KEY || env.OPENAI_API_KEY || env.OPENROUTER_API_KEY) {
    return "openai-compatible";
  }
  return "none";
}

export function llmEndpoint(env: NodeJS.ProcessEnv = process.env): string | null {
  if (env.OPENROUTER_API_KEY) return "https://openrouter.ai/api/v1/chat/completions";
  if (env.LIFEOS_AGENT_LLM_API_KEY || env.OPENAI_API_KEY) return env.LIFEOS_AGENT_LLM_BASE_URL || "https://api.openai.com/v1/chat/completions";
  return null;
}

/**
 * Optional generative rewrite. The runtime never lets this function invoke tools
 * or bypass the policy engine. If no key is present, callers must use the
 * deterministic reply already produced by processAgentTurn.
 */
export async function maybeRewriteReply(deterministicReply: string, env: NodeJS.ProcessEnv = process.env): Promise<{ reply: string; usedLlm: boolean }> {
  const endpoint = llmEndpoint(env);
  const key = env.LIFEOS_AGENT_LLM_API_KEY || env.OPENAI_API_KEY || env.OPENROUTER_API_KEY;
  if (!endpoint || !key) return { reply: deterministicReply, usedLlm: false };
  return { reply: deterministicReply, usedLlm: false };
}

import { loadEnv } from './env.js';
import { describeApiError, exitWithError } from './errors.js';

export const TASKS = ['executive', 'coding', 'research', 'summary', 'tagging'];

const DEFAULT_MODELS = {
  executive: 'anthropic/claude-sonnet-4',
  coding: 'z-ai/glm-5.2',
  research: 'deepseek/deepseek-chat',
  summary: 'openai/gpt-4o-mini',
  tagging: 'openai/gpt-4o-mini',
};

const MODEL_ENV_KEYS = {
  executive: 'OPENROUTER_MODEL_EXECUTIVE',
  coding: 'OPENROUTER_MODEL_CODING',
  research: 'OPENROUTER_MODEL_RESEARCH',
  summary: 'OPENROUTER_MODEL_SUMMARY',
  tagging: 'OPENROUTER_MODEL_TAGGING',
};

const SYSTEM_PROMPTS = {
  executive:
    'You are the LifeOS Enterprise executive assistant. Prioritize decisions, tradeoffs, sequencing, and clear next actions for an Obsidian-centered operating system.',
  coding:
    'You are the LifeOS Enterprise coding assistant. Produce practical implementation plans, file-level guidance, and execution steps for software and automation work.',
  research:
    'You are the LifeOS Enterprise research assistant. Gather structured findings, compare options, cite assumptions, and end with recommended next steps.',
  summary:
    'You are the LifeOS Enterprise summarization assistant. Condense inputs into crisp bullets, decisions, risks, and next actions without losing key facts.',
  tagging:
    'You are the LifeOS Enterprise metadata assistant. Propose concise tags, categories, entities, and Obsidian-friendly frontmatter fields for knowledge capture.',
};

export function resolveModel(task) {
  const { fallbackModel } = loadEnv();
  const envKey = MODEL_ENV_KEYS[task];
  const configured = process.env[envKey];
  const defaultModel = DEFAULT_MODELS[task] ?? fallbackModel;

  return configured?.trim() || defaultModel;
}

export function resolveSystemPrompt(task) {
  return SYSTEM_PROMPTS[task];
}

export function isValidTask(task) {
  return TASKS.includes(task);
}

export async function routeTask({ client, task, prompt }) {
  const model = resolveModel(task);
  const systemPrompt = resolveSystemPrompt(task);

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt.trim() },
      ],
    });

    const output = completion.choices?.[0]?.message?.content;

    if (!output) {
      throw new Error('OpenRouter returned no message content.');
    }

    return { model, task, output };
  } catch (error) {
    const details = describeApiError(error, model);
    exitWithError('LifeOS OpenRouter request failed.', details);
  }
}

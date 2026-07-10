import OpenAI from 'openai';
import { loadEnv } from './env.js';
import { describeApiKeyIssue, exitWithError } from './errors.js';

export function createOpenRouterClient() {
  const { apiKey, appName, siteUrl, envPath } = loadEnv();
  const keyIssue = describeApiKeyIssue(apiKey, envPath);

  if (keyIssue) {
    exitWithError('OpenRouter API key is not ready.', keyIssue);
  }

  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
    defaultHeaders: {
      'HTTP-Referer': siteUrl,
      'X-Title': appName,
    },
  });
}

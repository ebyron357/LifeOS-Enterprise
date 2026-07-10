export function describeApiKeyIssue(key, envPath) {
  if (!key) {
    return {
      reason: 'OPENROUTER_API_KEY is not set.',
      action: `Create ${envPath} from .env.example and set OPENROUTER_API_KEY.`,
    };
  }

  if (key.includes('your-key-here')) {
    return {
      reason: 'OPENROUTER_API_KEY still contains the .env.example placeholder.',
      action: 'Replace the placeholder with your real key from https://openrouter.ai/keys',
    };
  }

  if (!key.startsWith('sk-or-v1-')) {
    return {
      reason: 'OPENROUTER_API_KEY does not match the expected OpenRouter format (sk-or-v1-...).',
      action: 'Copy the full key from https://openrouter.ai/keys without extra spaces or quotes.',
    };
  }

  return null;
}

export function describeApiError(error, model) {
  const status = error?.status ?? error?.response?.status;
  const code = error?.code ?? error?.error?.code;
  const message = error?.message ?? String(error);

  if (status === 401) {
    return {
      reason: 'OpenRouter rejected the API key (HTTP 401 Unauthorized).',
      action: 'Verify the key is active at https://openrouter.ai/keys and has not been revoked or rotated.',
    };
  }

  if (status === 402) {
    return {
      reason: 'OpenRouter account has insufficient credits (HTTP 402 Payment Required).',
      action: 'Add credits at https://openrouter.ai/credits before running the command again.',
    };
  }

  if (status === 403) {
    return {
      reason: 'OpenRouter denied access for this request (HTTP 403 Forbidden).',
      action: 'Check key permissions and whether the selected model is enabled for your account.',
    };
  }

  if (status === 404 || message.includes('No endpoints found')) {
    return {
      reason: `Model "${model}" is not available on OpenRouter.`,
      action: 'Set the task model variable in .env to a valid slug from https://openrouter.ai/models',
    };
  }

  if (status === 429) {
    return {
      reason: 'OpenRouter rate limit reached (HTTP 429 Too Many Requests).',
      action: 'Wait briefly and retry, or reduce request frequency.',
    };
  }

  return {
    reason: message,
    action: code ? `Provider error code: ${code}` : 'Check https://openrouter.ai/docs for troubleshooting.',
  };
}

export function exitWithError(title, details) {
  console.error(`\n${title}`);
  console.error(`Reason: ${details.reason}`);
  console.error(`Fix: ${details.action}\n`);
  process.exit(1);
}

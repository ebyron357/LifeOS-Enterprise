import { loadEnv } from './lib/env.js';
import { createOpenRouterClient } from './lib/client.js';
import { routeTask, TASKS, isValidTask } from './lib/router.js';
import { exitWithError } from './lib/errors.js';

function printHelp() {
  console.log(`
LifeOS OpenRouter CLI

Usage:
  npm run lifeos -- --task <task> --prompt "<text>"

Tasks:
  ${TASKS.join(', ')}

Examples (PowerShell):
  npm run lifeos -- --task coding --prompt "Create a plan to connect Obsidian to OpenRouter"
  npm run lifeos -- --task executive --prompt "What should I prioritize this week?"
  npm run lifeos -- --task research --prompt "Compare Obsidian sync options"
  npm run lifeos -- --task summary --prompt "Summarize this meeting note"
  npm run lifeos -- --task tagging --prompt "Tag this project note about TradeIQ"

Model routing:
  Set OPENROUTER_MODEL_<TASK> in .env (e.g. OPENROUTER_MODEL_CODING=z-ai/glm-5.2).
`);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const parsed = { help: false, task: null, prompt: null };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      parsed.help = true;
      continue;
    }

    if (arg === '--task') {
      parsed.task = args[i + 1];
      i += 1;
      continue;
    }

    if (arg === '--prompt') {
      parsed.prompt = args.slice(i + 1).join(' ');
      break;
    }
  }

  return parsed;
}

async function main() {
  const { help, task, prompt } = parseArgs(process.argv);

  if (help) {
    printHelp();
    return;
  }

  if (!task || !prompt) {
    printHelp();
    process.exit(1);
  }

  if (!isValidTask(task)) {
    exitWithError('Invalid LifeOS task.', {
      reason: `Unknown task "${task}".`,
      action: `Use one of: ${TASKS.join(', ')}`,
    });
  }

  if (!prompt.trim()) {
    exitWithError('Missing prompt.', {
      reason: 'A --prompt value is required.',
      action: 'Example: npm run lifeos -- --task coding --prompt "Test LifeOS routing"',
    });
  }

  loadEnv();
  const client = createOpenRouterClient();
  const result = await routeTask({ client, task, prompt });

  console.log(`Task: ${result.task}`);
  console.log(`Model: ${result.model}\n`);
  console.log(result.output);
  console.log('\nLifeOS command complete.');
}

main();

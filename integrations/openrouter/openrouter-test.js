import 'dotenv/config';
import OpenAI from 'openai';

const apiKey = process.env.OPENROUTER_API_KEY;
const model = process.env.OPENROUTER_MODEL || 'z-ai/glm-5.2';
const appName = process.env.OPENROUTER_APP_NAME || 'LifeOS Enterprise';
const siteUrl = process.env.OPENROUTER_SITE_URL || 'https://github.com/ebyron357/LifeOS-Enterprise';

if (!apiKey || apiKey.includes('your-key-here')) {
  console.error('\nMissing OpenRouter API key.');
  console.error('Create integrations/openrouter/.env from .env.example and set OPENROUTER_API_KEY.\n');
  process.exit(1);
}

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey,
  defaultHeaders: {
    'HTTP-Referer': siteUrl,
    'X-Title': appName,
  },
});

const prompt = `
You are the LifeOS Enterprise execution assistant.

Return a concise status report with exactly these sections:
1. Connection Status
2. What OpenRouter enables for LifeOS
3. Next 3 integration steps

Keep it practical and execution-focused.
`;

try {
  console.log(`Testing OpenRouter connection with model: ${model}\n`);

  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: 'You are a precise execution partner for a private Obsidian-centered LifeOS project.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const output = completion.choices?.[0]?.message?.content;

  if (!output) {
    throw new Error('OpenRouter returned no message content.');
  }

  console.log('OpenRouter connected.\n');
  console.log(output);
  console.log('\nLifeOS OpenRouter test complete.');
} catch (error) {
  console.error('\nOpenRouter test failed.');
  console.error(error?.message || error);
  process.exit(1);
}

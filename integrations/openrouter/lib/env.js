import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const integrationRoot = path.resolve(__dirname, '..');
const envPath = path.join(integrationRoot, '.env');

let loaded = false;

export function loadEnv() {
  if (!loaded) {
    dotenv.config({ path: envPath });
    loaded = true;
  }

  return {
    envPath,
    integrationRoot,
    apiKey: process.env.OPENROUTER_API_KEY,
    appName: process.env.OPENROUTER_APP_NAME || 'LifeOS Enterprise',
    siteUrl: process.env.OPENROUTER_SITE_URL || 'https://github.com/ebyron357/LifeOS-Enterprise',
    fallbackModel: process.env.OPENROUTER_MODEL || 'z-ai/glm-5.2',
  };
}

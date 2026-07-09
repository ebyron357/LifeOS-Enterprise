# OpenRouter Integration

This folder is the first safe OpenRouter bridge for the LifeOS Enterprise project.

## Purpose

Use OpenRouter as a single AI gateway so LifeOS can call different models without hardcoding one provider.

Example model roles:

- `z-ai/glm-5.2` — coding / project execution testing
- Claude or GPT models — strategy, planning, and complex reasoning
- DeepSeek / Qwen models — research and coding experiments

## Files

| File | Purpose |
| --- | --- |
| `.env.example` | Shows the required environment variables without exposing secrets |
| `package.json` | Minimal Node.js setup for the OpenRouter test script |
| `openrouter-test.js` | Sends a test LifeOS prompt to OpenRouter |

## Setup

From the repository root:

```bash
cd integrations/openrouter
npm install
cp .env.example .env
```

Then open `.env` and add your real OpenRouter API key:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_MODEL=z-ai/glm-5.2
```

## Run test

```bash
npm test
```

Success means OpenRouter returned a model response and your LifeOS project can now talk to OpenRouter.

## Security rules

- Never commit `.env`
- Never paste API keys into GitHub issues, README files, screenshots, or chat logs
- Start with low OpenRouter spending limits until usage is understood

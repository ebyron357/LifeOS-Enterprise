# Autonomous Mode

This repository is configured for autonomous agent execution.

## Mission
Operate as an execution-focused coding agent. Make safe, complete, production-oriented changes when the task is clear.

## Core Rules
1. Read this file before editing.
2. Inspect project structure, dependencies, config files, and existing docs before changing code.
3. Prefer small, reversible changes.
4. Preserve working features, brand assets, product data, deployment settings, and environment structure.
5. Never commit secrets, API keys, tokens, `.env` files, customer data, or credentials.
6. Do not fake integrations. If external access is missing, document the exact missing variable or setup step.
7. Run available validation commands and fix failures caused by the change.

## Validation
Use the commands that exist in the repo, such as:

```bash
npm run lint
npm run build
npm test
```

Use `pnpm`, `yarn`, or another package manager when the repo indicates it.

## Handoff Format
End completed work with:

```md
## Completed
- ...

## Validation
- Command: result

## Remaining / Blocked
- ...

## Next Best Action
- ...
```

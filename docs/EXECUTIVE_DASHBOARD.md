# Executive Dashboard

The LifeOS web dashboard provides a one-screen executive view at `/dashboard` while preserving Obsidian as the canonical operating system and GitHub as the source of truth.

## Included widgets

- Morning Brief: top priorities, open loops, waiting items, and next review.
- Prayer Widget: scripture, daily reflection, and spiritual focus.
- Revenue Radar: monthly target progress and business-level revenue signals.
- AI Workforce: agent availability and current work.
- GitHub Health: repository checks, pull requests, stale branches, and overall health.

Morning Brief and AI Workforce are loaded server-side from the canonical `Projects/` and `AI/` Markdown metadata. Revenue Radar and GitHub Health intentionally display connection-required states until approved sources are configured; the dashboard never invents operational or financial results. GitHub API and financial integrations remain credential-gated server-side adapters. Do not expose service credentials to client components.

## Widget registry

`components/widgets/registry.ts` is the single registration point. Each widget has a stable ID, title, layout size, and React component. Add or remove dashboard widgets in the registry instead of editing the dashboard page.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000/dashboard`.

## Validation

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The existing Obsidian audit remains a separate acceptance check:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\audit-vault.ps1
```

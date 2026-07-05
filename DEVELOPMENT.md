# Development Guide

## Prerequisites

- Node.js 22+
- pnpm 9+

## Quick Start

1. Copy `.env.example` to `.env`
2. `pnpm install`
3. `pnpm dev`

## Validation Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e`

## Local Infrastructure

Start local dependencies:

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

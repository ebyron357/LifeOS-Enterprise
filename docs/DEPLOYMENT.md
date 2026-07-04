# LifeOS — Deployment Architecture

> **Version:** 1.0  
> **Status:** Official  
> **Owner:** Chief Software Architect / DevOps Engineer  
> **Last Updated:** 2026-07-04

---

## Overview

LifeOS is deployed as a cloud-native application on Vercel (frontend + API) and Supabase (database + storage + auth). The deployment architecture prioritizes zero-downtime releases, automated CI/CD, environment parity, and rapid rollback.

---

## Environments

| Environment | Purpose | URL Pattern | Deploy Trigger |
|------------|---------|-------------|---------------|
| Development | Local developer machines | `localhost:3000` | Manual (`npm run dev`) |
| Preview | Per-PR review environments | `lifeos-pr-{number}.vercel.app` | Automatic on PR open/push |
| Staging | Pre-production validation | `staging.lifeos.app` | Merge to `main` branch |
| Production | Live users | `app.lifeos.app` | Manual promotion from staging |

### Environment Parity
All environments use the same Docker-based services (PostgreSQL, Redis) locally, and the same Supabase / Upstash Redis setup in the cloud. Configuration differences are limited to environment-specific secrets and feature flags.

---

## Infrastructure Components

### Vercel (Compute)
- **Next.js application** deployed as serverless functions (API routes) + edge-rendered pages
- Zero cold-start for critical API routes via Vercel Fluid (always-warm)
- Static assets served from Vercel CDN (global edge network)
- Preview deployments auto-created for every PR

### Supabase (Database + Auth + Storage)
- **PostgreSQL 16** with pgvector extension
- **Supabase Auth** for user identity
- **Supabase Storage** for file attachments and document uploads
- **Supabase Realtime** for live dashboard updates
- Point-in-time recovery enabled; continuous WAL archiving

### Upstash Redis (Queue + Cache)
- **BullMQ job queues** for background AI agent tasks
- **API response caching** for health scores and dashboard aggregates
- Serverless Redis — no persistent connections needed

### Vercel Cron (Scheduled Jobs)
- Daily review aggregations
- Scheduled health score recalculation
- Knowledge review reminders
- Automation heartbeat checks

---

## Vercel Project Configuration

```
apps/web (Vercel Project)
  ├── Build Command:    npm run build
  ├── Output Directory: .next
  ├── Node Version:     20.x
  ├── Root Directory:   apps/web
  └── Environment Variables: (per environment, see Secrets section)
```

### Vercel Edge Config
Feature flags are stored in Vercel Edge Config for instant, zero-deploy flag changes:
```
FEATURE_AI_AGENT_DISPATCH=true
FEATURE_SEMANTIC_SEARCH=true
FEATURE_REVIEW_ENGINE=false
```

---

## Supabase Project Configuration

```
Supabase Project (per environment)
  ├── Region: us-east-1 (production), us-east-1 (staging)
  ├── Plan: Pro (production), Free (staging/dev)
  ├── Extensions: uuid-ossp, pgvector, pg_trgm, pg_stat_statements
  ├── RLS: Enabled on all tables
  ├── Point-in-Time Recovery: Enabled (production)
  └── Database Branches: production, staging (Supabase branching)
```

---

## CI/CD Pipeline

### GitHub Actions Workflows

#### `ci.yml` — Runs on every PR
```
Trigger: pull_request (open, push, reopen)

Jobs:
  1. lint
     - ESLint + TypeScript type check
     - Prettier format check
     - Secret scanning (gitleaks)
     - npm audit (no Critical/High CVEs)

  2. unit-tests
     - Vitest unit test suite
     - Coverage report uploaded to Codecov

  3. integration-tests
     - Docker Compose starts PostgreSQL
     - Drizzle migrations applied
     - Vitest integration suite
     - Docker Compose torn down

  4. build
     - npm run build (Next.js production build)
     - Ensures no TypeScript errors in build
```

#### `deploy-staging.yml` — Runs on merge to `main`
```
Trigger: push to main

Jobs:
  1. run-ci (calls ci.yml)
  2. deploy-staging
     - Vercel deploy to staging environment
     - Supabase migration applied to staging DB (additive only)
  3. e2e-tests
     - Playwright E2E suite against staging URL
  4. security-scan
     - OWASP ZAP baseline scan against staging
  5. performance-smoke
     - k6 baseline scenario (5 min, 10 VUs)
  6. notify
     - Slack notification: staging deploy success/failure
```

#### `deploy-production.yml` — Manual promotion
```
Trigger: workflow_dispatch (manual trigger with confirmation input)
Required input: "CONFIRM_PRODUCTION_DEPLOY" text string

Jobs:
  1. validate (ensure staging tests passed)
  2. deploy-production
     - Vercel promote staging → production
     - Supabase migration applied to production DB
  3. smoke-test
     - 5 critical E2E tests against production
  4. notify
     - Slack notification + email to team
```

---

## Environment Variables Management

| Variable | Development | Staging | Production |
|---------|-------------|---------|------------|
| `DATABASE_URL` | Docker local | Supabase staging | Supabase prod |
| `NEXTAUTH_SECRET` | Random local | Vercel secret | Vercel secret |
| `OPENAI_API_KEY` | Dev key | Dev key | Production key |
| `ANTHROPIC_API_KEY` | Dev key | Dev key | Production key |
| `GITHUB_CLIENT_ID` | Dev OAuth app | Staging OAuth app | Prod OAuth app |
| `REDIS_URL` | Docker local | Upstash staging | Upstash prod |
| `SUPABASE_SERVICE_ROLE_KEY` | Local | Vercel secret | Vercel secret |

All production secrets are stored in **Vercel Environment Variables** (encrypted). No secrets in `.env` files committed to git.

---

## Database Migrations

### Migration Strategy
All migrations are **additive only** — no columns removed, no tables dropped, no constraints tightened in a single step.

### Migration Workflow
```
1. Developer writes new Drizzle migration:
   npx drizzle-kit generate:pg

2. Migration reviewed in PR:
   - Only additive changes allowed
   - Reviewed by at least one other engineer

3. CI validates migration applies cleanly:
   - Applied to fresh test database in CI

4. Staging deploy:
   - Migration applied to staging database
   - E2E tests verify no regressions

5. Production deploy:
   - Migration applied to production database
   - Applied BEFORE new application code is active
   - New code is backward-compatible with old schema (zero-downtime)
```

### Migration Rollback
If a migration must be reverted:
1. Write a compensating additive migration (e.g., restore a dropped default)
2. Never use `DROP COLUMN` to roll back — mark column as deprecated first
3. Full column/table removal only after 2+ releases confirm it is safe

---

## Monitoring

### Error Tracking — Sentry
- Client-side and server-side errors captured
- Alerts on new error types and error rate spikes
- Source maps uploaded on every production deploy for readable stack traces

### Logging — Axiom
- Structured JSON logs from all API routes and background jobs
- Log retention: 90 days
- Alerts on error rate > threshold and p95 latency spikes

### Uptime / Synthetic Monitoring — Checkly
- Critical user flows run every 5 minutes from multiple regions:
  - Homepage loads
  - Login succeeds
  - Project list API returns < 2s
  - Search API returns < 3s
- PagerDuty alert on consecutive failures

### Database — Supabase Dashboard
- Query performance monitoring
- Connection pool saturation alerts
- Storage usage alerts at 75% and 90%

---

## Rollback Strategy

### Application Rollback (Vercel)
Vercel maintains a deployment history. Rollback is a single click (or CLI command):
```bash
vercel rollback [deployment-url]
```
Rollback is instant — DNS is re-pointed to a previous deployment.

### Database Rollback
Database state cannot be rolled back by re-pointing a deployment. For database issues:
1. **Schema issue:** Deploy compensating migration (see above)
2. **Data corruption:** Restore from point-in-time backup (Supabase PITR)
3. **Mass data loss:** Restore from daily snapshot

### Rollback Decision Matrix
| Incident Type | Primary Action | Escalation |
|--------------|---------------|-----------|
| UI regression | Vercel rollback (instant) | DevOps alert |
| API regression | Vercel rollback (instant) | DevOps alert |
| Data mutation bug | Rollback + PITR restore | Engineering Lead + Owner |
| Security breach | Vercel rollback + lock down | Security Advisor + Owner |
| Database migration failure | Compensating migration | Engineering Lead |

---

## Feature Flags

Feature flags allow shipping code to production that is not yet active for users:

| Flag | Default | Purpose |
|------|---------|--------|
| `FEATURE_SEMANTIC_SEARCH` | false (staging) / true (prod) | pgvector semantic search |
| `FEATURE_AI_DISPATCH` | false | AI agent task dispatch |
| `FEATURE_REVIEW_ENGINE` | false | Automated review aggregation |
| `FEATURE_SAAS_BILLING` | false | Stripe billing integration |

Flags are stored in Vercel Edge Config and read at runtime — no redeploy required to toggle.

---

## Scalability Path

| Component | Current Plan | Scale-Up Path |
|-----------|------------|--------------|
| Vercel Functions | Serverless (auto-scales) | No action required |
| PostgreSQL | Supabase Pro | Read replicas → Dedicated server |
| Redis | Upstash serverless | Upstash pay-per-use scales automatically |
| File storage | Supabase Storage | S3 direct for large orgs |
| Search | PostgreSQL FTS + pgvector | Dedicated search cluster (Typesense / Elastic) |
| AI inference | Vercel AI SDK (direct) | Dedicated proxy layer for rate management |

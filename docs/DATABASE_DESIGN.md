# LifeOS — Database Design

> **Version:** 1.0  
> **Status:** Official  
> **Owner:** Chief Software Architect  
> **Last Updated:** 2026-07-04

---

## Overview

LifeOS uses **PostgreSQL 16** (hosted on Supabase) as its primary database. The schema is designed for multi-tenancy from day one: every user-owned table has an `org_id` foreign key, and Supabase Row-Level Security (RLS) enforces data isolation at the database layer.

All schemas are managed with **Drizzle ORM** and versioned migrations. No manual SQL changes are ever applied to production — every change goes through a migration file.

---

## Design Principles

| Principle | Implementation |
|-----------|---------------|
| **Multi-tenant by default** | Every table has `org_id`; RLS enforces isolation |
| **Soft deletes** | `deleted_at TIMESTAMP` instead of hard DELETE |
| **Versioning** | Append-only `_history` tables for auditable objects |
| **Timestamps everywhere** | `created_at`, `updated_at` on every table |
| **UUID primary keys** | `gen_random_uuid()` — no sequential IDs exposed to clients |
| **Immutable records** | Decisions, audit log, notifications — never updated, only superseded |
| **Normalized relationships** | Junction tables for many-to-many; no JSON arrays for relational data |
| **Search-ready** | `tsvector` columns for full-text; `vector(1536)` for semantic search |

---

## Table Definitions

### Core Identity Tables

#### `organizations`
```sql
CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  plan        TEXT NOT NULL DEFAULT 'free',   -- free | pro | enterprise
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);
```

#### `users`
```sql
CREATE TABLE users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ
);
```

#### `org_members`
```sql
CREATE TABLE org_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'member',  -- owner | admin | member | viewer
  invited_by  UUID REFERENCES users(id),
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);
```

---

### Business Domain Tables

#### `businesses`
```sql
CREATE TABLE businesses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'active',  -- pre-launch | active | scaling | mature | paused | closed
  model         TEXT,     -- B2B SaaS | B2C SaaS | E-commerce | Services | Marketplace | Agency | Product | Other
  industry      TEXT,
  description   TEXT,
  website       TEXT,
  github_org    TEXT,
  owner_id      UUID REFERENCES users(id),
  ai_owner_id   UUID REFERENCES agents(id),
  archived      BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ,
  UNIQUE(org_id, slug)
);
CREATE INDEX idx_businesses_org ON businesses(org_id) WHERE deleted_at IS NULL;
```

#### `kpis`
```sql
CREATE TABLE kpis (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id),
  business_id   UUID NOT NULL REFERENCES businesses(id),
  name          TEXT NOT NULL,
  unit          TEXT NOT NULL,   -- $, %, count, etc.
  target        NUMERIC,
  actual        NUMERIC,
  period        TEXT NOT NULL,   -- daily | weekly | monthly | quarterly | annual
  period_start  DATE,
  period_end    DATE,
  on_track      BOOLEAN GENERATED ALWAYS AS (actual >= target) STORED,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_kpis_business ON kpis(business_id);
```

---

### Project Domain Tables

#### `projects`
```sql
CREATE TABLE projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id),
  business_id   UUID NOT NULL REFERENCES businesses(id),
  title         TEXT NOT NULL,
  summary       TEXT,
  status        TEXT NOT NULL DEFAULT 'draft',  -- draft | active | on_hold | in_review | completed | cancelled
  priority      TEXT NOT NULL DEFAULT 'medium', -- critical | high | medium | low
  owner_id      UUID REFERENCES users(id),
  ai_owner_id   UUID REFERENCES agents(id),
  github_repo   TEXT,
  next_action   TEXT,
  review_date   DATE,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ,
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(next_action, ''))
  ) STORED
);
CREATE INDEX idx_projects_business ON projects(business_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_status ON projects(org_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_search ON projects USING GIN(search_vector);
```

#### `deliverables`
```sql
CREATE TABLE deliverables (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  org_id      UUID NOT NULL REFERENCES organizations(id),
  title       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'not_started', -- not_started | in_progress | in_review | done | blocked
  owner_id    UUID REFERENCES users(id),
  due_date    DATE,
  completed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_deliverables_project ON deliverables(project_id);
CREATE INDEX idx_deliverables_due ON deliverables(due_date) WHERE status != 'done';
```

#### `risks`
```sql
CREATE TABLE risks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id),
  project_id  UUID REFERENCES projects(id),
  business_id UUID REFERENCES businesses(id),
  description TEXT NOT NULL,
  likelihood  TEXT NOT NULL DEFAULT 'medium',  -- high | medium | low
  impact      TEXT NOT NULL DEFAULT 'medium',
  mitigation  TEXT,
  status      TEXT NOT NULL DEFAULT 'open',   -- open | mitigated | closed
  owner_id    UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### Knowledge Domain Tables

#### `knowledge_objects`
```sql
CREATE TABLE knowledge_objects (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID NOT NULL REFERENCES organizations(id),
  title            TEXT NOT NULL,
  summary          TEXT NOT NULL,
  body             TEXT,
  domain           TEXT NOT NULL,  -- business | technology | marketing | finance | legal | operations | other
  confidence       NUMERIC(3,2) NOT NULL DEFAULT 0.8 CHECK (confidence BETWEEN 0 AND 1),
  status           TEXT NOT NULL DEFAULT 'active',  -- active | needs_review | deprecated
  author_id        UUID REFERENCES users(id),
  agent_author_id  UUID REFERENCES agents(id),
  review_due_at    DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ,
  embedding        VECTOR(1536),   -- OpenAI text-embedding-3-small
  search_vector    TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', title || ' ' || summary || ' ' || coalesce(body, ''))
  ) STORED
);
CREATE INDEX idx_knowledge_org ON knowledge_objects(org_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_knowledge_search ON knowledge_objects USING GIN(search_vector);
CREATE INDEX idx_knowledge_embedding ON knowledge_objects USING ivfflat(embedding vector_cosine_ops);
```

#### `knowledge_sources`
```sql
CREATE TABLE knowledge_sources (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_object_id UUID NOT NULL REFERENCES knowledge_objects(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  url                 TEXT,
  source_type         TEXT,  -- primary | secondary | tertiary
  accessed_at         DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `knowledge_links` (many-to-many: knowledge ↔ projects/businesses)
```sql
CREATE TABLE knowledge_links (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_object_id UUID NOT NULL REFERENCES knowledge_objects(id) ON DELETE CASCADE,
  entity_type         TEXT NOT NULL,  -- project | business
  entity_id           UUID NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(knowledge_object_id, entity_type, entity_id)
);
```

---

### Decision Domain Tables

#### `decisions`
```sql
CREATE TABLE decisions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID NOT NULL REFERENCES organizations(id),
  title               TEXT NOT NULL,
  decision_type       TEXT NOT NULL DEFAULT 'operational',  -- strategic | architectural | operational | product | agent
  context             TEXT,
  problem             TEXT,
  chosen_option       TEXT,
  rationale           TEXT,
  status              TEXT NOT NULL DEFAULT 'proposed',  -- proposed | final | reversed | superseded
  impact              TEXT NOT NULL DEFAULT 'medium',     -- high | medium | low
  reversible          BOOLEAN NOT NULL DEFAULT true,
  reversal_conditions TEXT,
  made_by_user_id     UUID REFERENCES users(id),
  made_by_agent_id    UUID REFERENCES agents(id),
  business_id         UUID REFERENCES businesses(id),
  project_id          UUID REFERENCES projects(id),
  supersedes_id       UUID REFERENCES decisions(id),
  decided_at          DATE,
  review_date         DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_decisions_project ON decisions(project_id);
CREATE INDEX idx_decisions_status ON decisions(org_id, status);
```

#### `decision_options`
```sql
CREATE TABLE decision_options (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  pros        TEXT[],
  cons        TEXT[],
  selected    BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### Agent and AI Tables

#### `agents`
```sql
CREATE TABLE agents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id),
  slug            TEXT NOT NULL,
  name            TEXT NOT NULL,
  agent_type      TEXT NOT NULL,   -- orchestrator | specialist | analyst | builder | reviewer
  status          TEXT NOT NULL DEFAULT 'draft',  -- draft | active | testing | paused | deprecated
  model           TEXT NOT NULL,
  autonomy_level  INTEGER NOT NULL DEFAULT 2 CHECK (autonomy_level BETWEEN 1 AND 4),
  system_prompt   TEXT,
  version         TEXT NOT NULL DEFAULT '1.0.0',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, slug)
);
```

#### `agent_tasks`
```sql
CREATE TABLE agent_tasks (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               UUID NOT NULL REFERENCES organizations(id),
  agent_id             UUID NOT NULL REFERENCES agents(id),
  task_type            TEXT NOT NULL,
  state                TEXT NOT NULL DEFAULT 'queued',  -- queued | dispatched | in_progress | awaiting_approval | awaiting_dependency | completed | failed | cancelled | retrying
  priority             TEXT NOT NULL DEFAULT 'normal',
  input                JSONB,
  output               JSONB,
  context_snapshot     JSONB,
  confidence_score     NUMERIC(3,2),
  retry_count          INTEGER NOT NULL DEFAULT 0,
  max_retries          INTEGER NOT NULL DEFAULT 2,
  error_message        TEXT,
  approval_required    BOOLEAN NOT NULL DEFAULT false,
  approval_id          UUID,
  queued_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  dispatched_at        TIMESTAMPTZ,
  completed_at         TIMESTAMPTZ,
  duration_ms          INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (completed_at - dispatched_at)) * 1000
  ) STORED
);
CREATE INDEX idx_agent_tasks_agent ON agent_tasks(agent_id, state);
CREATE INDEX idx_agent_tasks_org ON agent_tasks(org_id, queued_at DESC);
```

#### `approval_requests`
```sql
CREATE TABLE approval_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id),
  task_id         UUID NOT NULL REFERENCES agent_tasks(id),
  agent_id        UUID NOT NULL REFERENCES agents(id),
  action_type     TEXT NOT NULL,
  urgency         TEXT NOT NULL DEFAULT 'normal',  -- critical | normal | low
  summary         TEXT NOT NULL,
  details         JSONB,
  expected_outcome TEXT,
  risks           TEXT[],
  options         TEXT[] NOT NULL DEFAULT ARRAY['Approve', 'Reject'],
  status          TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | rejected | revised | delegated | expired
  reviewed_by     UUID REFERENCES users(id),
  review_note     TEXT,
  reviewed_at     TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_approvals_pending ON approval_requests(org_id, status) WHERE status = 'pending';
```

---

### Automation Tables

#### `automations`
```sql
CREATE TABLE automations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                UUID NOT NULL REFERENCES organizations(id),
  name                  TEXT NOT NULL,
  description           TEXT,
  trigger_type          TEXT NOT NULL,  -- schedule | event | webhook | manual
  trigger_config        JSONB,
  target_type           TEXT NOT NULL,  -- workflow | agent | project | notification
  target_id             TEXT,
  platform              TEXT NOT NULL,  -- n8n | github_actions | zapier | internal
  status                TEXT NOT NULL DEFAULT 'active',  -- active | paused | failed | disabled
  last_run_at           TIMESTAMPTZ,
  last_run_status       TEXT,   -- success | failed | skipped
  consecutive_failures  INTEGER NOT NULL DEFAULT 0,
  total_runs            INTEGER NOT NULL DEFAULT 0,
  success_rate          NUMERIC(5,2),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### Document and Meeting Tables

#### `documents`
```sql
CREATE TABLE documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id),
  title         TEXT NOT NULL,
  body          TEXT,
  doc_type      TEXT NOT NULL,  -- sop | spec | guide | meeting_notes | report | other
  status        TEXT NOT NULL DEFAULT 'draft',
  entity_type   TEXT,   -- project | business | knowledge | decision
  entity_id     UUID,
  author_id     UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ,
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', title || ' ' || coalesce(body, ''))
  ) STORED
);
CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_search ON documents USING GIN(search_vector);
```

#### `meetings`
```sql
CREATE TABLE meetings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id),
  title         TEXT NOT NULL,
  meeting_date  TIMESTAMPTZ NOT NULL,
  summary       TEXT,
  business_id   UUID REFERENCES businesses(id),
  project_id    UUID REFERENCES projects(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE meeting_attendees (
  meeting_id  UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id),
  PRIMARY KEY (meeting_id, user_id)
);

CREATE TABLE meeting_action_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id  UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  owner_id    UUID REFERENCES users(id),
  due_date    DATE,
  completed   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### Repository Tables

#### `repositories`
```sql
CREATE TABLE repositories (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID NOT NULL REFERENCES organizations(id),
  business_id         UUID REFERENCES businesses(id),
  project_id          UUID REFERENCES projects(id),
  github_owner        TEXT NOT NULL,
  github_name         TEXT NOT NULL,
  default_branch      TEXT NOT NULL DEFAULT 'main',
  open_prs            INTEGER NOT NULL DEFAULT 0,
  open_issues         INTEGER NOT NULL DEFAULT 0,
  last_commit_at      TIMESTAMPTZ,
  ci_status           TEXT,    -- passing | failing | pending | unknown
  health_score        INTEGER,
  last_synced_at      TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, github_owner, github_name)
);
```

---

### System Tables

#### `notifications`
```sql
CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id),
  user_id       UUID REFERENCES users(id),   -- NULL = org-wide
  type          TEXT NOT NULL,  -- escalation | automation_failure | kpi_alert | review_due | agent_escalation | system
  severity      TEXT NOT NULL DEFAULT 'info',  -- critical | warning | info
  title         TEXT NOT NULL,
  body          TEXT,
  source_type   TEXT,
  source_id     UUID,
  read_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
```

#### `audit_log` (append-only — never updated)
```sql
CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id),
  user_id     UUID REFERENCES users(id),
  agent_id    UUID REFERENCES agents(id),
  action      TEXT NOT NULL,      -- e.g. 'project.create', 'decision.finalize'
  entity_type TEXT,
  entity_id   UUID,
  old_value   JSONB,
  new_value   JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_org ON audit_log(org_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
```

#### `settings`
```sql
CREATE TABLE settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id),
  user_id     UUID REFERENCES users(id),  -- NULL = org-level setting
  key         TEXT NOT NULL,
  value       JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id, key)
);
```

---

## Indexes Summary

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| businesses | `org_id` WHERE not deleted | B-tree | Org-scoped list queries |
| projects | `business_id` WHERE not deleted | B-tree | Business drill-down |
| projects | `org_id, status` WHERE not deleted | B-tree | Status filters |
| projects | `search_vector` | GIN | Full-text search |
| knowledge_objects | `org_id` WHERE not deleted | B-tree | Org-scoped list |
| knowledge_objects | `search_vector` | GIN | Full-text search |
| knowledge_objects | `embedding` (ivfflat) | IVFFlat | Semantic search |
| decisions | `project_id` | B-tree | Project decision list |
| decisions | `org_id, status` | B-tree | Decision queue |
| agent_tasks | `agent_id, state` | B-tree | Active task monitoring |
| notifications | `user_id, read_at` WHERE unread | B-tree | Unread count |
| audit_log | `org_id, created_at DESC` | B-tree | Recent activity |
| deliverables | `due_date` WHERE not done | B-tree | Upcoming deadlines |

---

## Row-Level Security (RLS)

Supabase RLS policies enforce multi-tenant isolation at the database layer. Every table that contains `org_id` has:

```sql
-- Example: businesses table
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON businesses
  USING (org_id = current_setting('app.org_id')::uuid);
```

The application sets `app.org_id` on every database connection from the authenticated session context. This ensures no query can access another organization's data, even if application-level filtering is bypassed.

---

## Versioning Strategy

| Object Type | Versioning Approach |
|-------------|-------------------|
| Decisions | Immutable + `supersedes_id` chain |
| Knowledge objects | `updated_at` + soft delete + deprecation status |
| Projects | `updated_at` only (no full history in Phase 1) |
| Settings | `updated_at` only |
| Audit log | Append-only (no updates ever) |
| Agent tasks | Append-only (status transitions logged) |

Full `_history` tables for decisions and knowledge objects will be added in Phase 2 when compliance requirements dictate.

---

## Migration Strategy

| Rule | Implementation |
|------|---------------|
| All migrations in version control | `packages/db/migrations/` — numbered, sequential |
| No manual SQL on production | All changes through Drizzle migrations |
| Migrations are additive | Never drop columns or tables; use soft delete and deprecation |
| Backward compatibility | Migrations must not break running application code |
| Zero-downtime migrations | No table locks on large tables; use `CONCURRENTLY` for indexes |
| Staging-first | Every migration runs on staging and passes CI before production |
| Rollback plan | Every migration has a documented rollback migration |

Migration naming: `NNNN_description.sql` (e.g., `0001_initial_schema.sql`, `0042_add_knowledge_embeddings.sql`)

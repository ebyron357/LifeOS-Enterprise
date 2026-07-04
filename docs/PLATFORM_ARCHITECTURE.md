# LifeOS — Platform Architecture

> **Version:** 1.0  
> **Status:** Official  
> **Owner:** Chief Software Architect  
> **Last Updated:** 2026-07-04

---

## Overview

This document defines the complete platform architecture for LifeOS — encompassing the frontend component architecture, backend service design, and the interfaces between them. This is a living specification. Implementation follows this document; this document does not follow implementation.

---

## Part 1 — Frontend Architecture

### Technology Foundation

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 15 (App Router) | SSR, RSC, file-based routing, API colocation |
| Language | TypeScript 5 (strict) | Full type safety from schema to UI |
| Styling | Tailwind CSS + shadcn/ui | Rapid composition, accessible components |
| State | Zustand (client) + TanStack Query (server) | Clean separation of UI state vs. server state |
| Forms | React Hook Form + Zod | Type-safe, performant form handling |
| Charts | Recharts | Composable data visualization |
| Editor | Tiptap (rich text) + Monaco (code) | Rich editing for knowledge and code |
| Animation | Framer Motion | Purposeful, performance-conscious animation |

---

### Responsive Surface Targets

| Surface | Breakpoint | Key Adaptations |
|---------|-----------|----------------|
| Mobile | < 768px | Single-column, bottom nav, drawer panels |
| Tablet | 768–1280px | Two-column, collapsible sidebar, modal panels |
| Desktop | > 1280px | Three-column, persistent sidebar, split views |
| Future Desktop App | Electron wrapper | Offline mode, system tray, file system access |
| Future Native iOS/Android | React Native (shared logic) | Optimized touch interactions |
| Future Browser Extension | Manifest V3 | Capture, quick-add, context overlay |

---

### Component Architecture

Components follow a four-tier hierarchy:

```
Primitives  →  Atoms  →  Molecules  →  Organisms  →  Pages
```

#### Tier 1 — Primitives
Raw, headless building blocks from Radix UI via shadcn:
- Button, Input, Select, Checkbox, RadioGroup
- Dialog, Sheet, Popover, Tooltip, DropdownMenu
- Avatar, Badge, Separator, Skeleton, Spinner

#### Tier 2 — Atoms
LifeOS-branded, single-purpose components:
- `StatusBadge` — renders any entity status with appropriate color
- `PriorityIndicator` — renders Critical/High/Medium/Low visually
- `HealthScore` — renders a 0–100 score with label and color
- `AgentAvatar` — agent identity chip with status dot
- `EntityLink` — clickable link to any LifeOS entity by type + ID
- `DateDisplay` — relative and absolute date rendering
- `ConfidenceBar` — knowledge object confidence visualization

#### Tier 3 — Molecules
Composed components with business logic:
- `ProjectCard` — compact project summary with status, priority, next action
- `KPIWidget` — single KPI with target, actual, and trend sparkline
- `DecisionCard` — decision with status, age, and blocking indicator
- `AgentTaskRow` — agent task with state, agent, duration, and action
- `NotificationItem` — notification with type, source, and dismiss
- `SearchResult` — universal search result with entity type and relationships
- `HealthScorePanel` — multi-dimensional health score grid
- `AutomationRow` — automation with status, last run, and failure count

#### Tier 4 — Organisms
Full feature sections:
- `CommandCenterLayout` — primary dashboard layout with all panels
- `ProjectDetailView` — full project view with all sub-sections
- `BusinessOverview` — business card with KPIs, projects, agents
- `AgentChatPanel` — agent interaction interface
- `UniversalSearch` — full search UI with filters and results
- `ReviewPanel` — daily/weekly/monthly review interface
- `DecisionQueue` — decision list with quick-resolve actions
- `KnowledgeViewer` — knowledge object display with relationships

---

### Page Architecture

```
apps/web/app/
├── (auth)/
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── sso/page.tsx
│
└── (dashboard)/
    ├── layout.tsx                  # Root dashboard layout (sidebar, topbar)
    ├── command-center/
    │   └── page.tsx                # Homepage — Command Center
    ├── businesses/
    │   ├── page.tsx                # Business portfolio
    │   └── [businessId]/
    │       ├── page.tsx            # Business overview
    │       ├── projects/page.tsx
    │       ├── kpis/page.tsx
    │       ├── finance/page.tsx
    │       └── settings/page.tsx
    ├── projects/
    │   ├── page.tsx                # All projects (across businesses)
    │   └── [projectId]/
    │       ├── page.tsx            # Project detail
    │       ├── deliverables/
    │       ├── risks/
    │       ├── decisions/
    │       └── knowledge/
    ├── knowledge/
    │   ├── page.tsx                # Knowledge browser
    │   └── [objectId]/page.tsx     # Knowledge object detail
    ├── agents/
    │   ├── page.tsx                # Agent catalog and status
    │   ├── [agentId]/page.tsx      # Agent detail + task history
    │   └── activity/page.tsx       # Agent activity log
    ├── decisions/
    │   ├── page.tsx                # Decision registry
    │   └── [decisionId]/page.tsx   # Decision detail
    ├── automations/
    │   ├── page.tsx                # Automation registry
    │   └── [automationId]/page.tsx
    ├── repositories/
    │   ├── page.tsx                # Repository health dashboard
    │   └── [repoId]/page.tsx
    ├── search/
    │   └── page.tsx                # Universal search
    ├── reviews/
    │   ├── daily/page.tsx
    │   ├── weekly/page.tsx
    │   ├── monthly/page.tsx
    │   └── [reviewId]/page.tsx
    └── settings/
        ├── page.tsx
        ├── profile/page.tsx
        ├── organization/page.tsx
        ├── integrations/page.tsx
        └── billing/page.tsx
```

---

### State Management Architecture

```
Server State (TanStack Query)
├── All entity data (projects, businesses, knowledge, etc.)
├── Real-time agent task status (polling / WebSocket)
└── Search results

Client State (Zustand)
├── UI state (sidebar open/closed, panel active)
├── Active filters (search, project list)
├── Draft form data (unsaved edits)
└── User preferences (theme, layout density)

URL State (Next.js search params)
├── Search query and filters
├── Selected entity IDs
└── Active tab
```

---

### Navigation Architecture

```
Primary Navigation (sidebar — persistent on desktop, drawer on mobile)
├── Command Center          (home)
├── Businesses
├── Projects
├── Knowledge
├── Agents
├── Decisions
├── Automations
├── Repositories
└── Settings

Secondary Navigation (in-page tabs — for detail views)
├── Overview
├── Sub-entities (deliverables, risks, etc.)
├── Activity
└── Settings

Quick Actions (command palette — Cmd+K)
├── Search any entity
├── Create new (project, decision, knowledge)
├── Start agent task
└── Jump to any page
```

---

## Part 2 — Backend Service Architecture

### Service Decomposition

All backend logic is organized as **domain services** within the tRPC router layer. In Phase 1, all services run within the Next.js server runtime. In future SaaS phases, services may be extracted into independent microservices.

```
packages/api/routers/
├── auth.router.ts          # Auth: register, login, logout, session
├── business.router.ts      # Business CRUD + health aggregation
├── project.router.ts       # Project CRUD + execution signals
├── knowledge.router.ts     # Knowledge CRUD + review scheduling
├── decision.router.ts      # Decision CRUD + blocking analysis
├── agent.router.ts         # Agent registry + task dispatch
├── automation.router.ts    # Automation registry + health
├── repository.router.ts    # GitHub data + health scoring
├── search.router.ts        # Universal search
├── notification.router.ts  # Notification delivery
├── review.router.ts        # Review packet assembly
├── analytics.router.ts     # Health scores + metrics
├── settings.router.ts      # User + org settings
├── audit.router.ts         # Audit log access
└── mcp.router.ts           # MCP connector management
```

---

### Service Contracts

#### Authentication Service
**Responsibilities:** User registration, login, OAuth, JWT issuance, session management, token refresh, logout, SSO  
**External dependencies:** Clerk (or NextAuth.js), Supabase Auth  
**Key operations:** `signUp`, `signIn`, `signOut`, `getSession`, `refreshToken`, `inviteUser`, `acceptInvitation`

#### Business Service
**Responsibilities:** Business CRUD, KPI aggregation, business health score computation, business-scoped data isolation  
**External dependencies:** Database, Execution Engine  
**Key operations:** `create`, `update`, `archive`, `getHealth`, `listProjects`, `getKPIs`, `updateKPI`

#### Project Service
**Responsibilities:** Project CRUD, deliverable management, blocker detection, priority scoring, next-action enforcement  
**External dependencies:** Database, Execution Engine  
**Key operations:** `create`, `update`, `complete`, `getPriorities`, `getBlockers`, `listDeliverables`, `updateDeliverable`

#### Knowledge Service
**Responsibilities:** Knowledge object CRUD, review scheduling, confidence scoring, embedding generation, knowledge graph  
**External dependencies:** Database, pgvector, OpenAI Embeddings API  
**Key operations:** `create`, `update`, `deprecate`, `search`, `getRelated`, `scheduleReview`, `generateEmbedding`

#### AI Agent Service
**Responsibilities:** Agent task dispatch, context assembly, memory read/write, approval workflow management, activity logging  
**External dependencies:** Orchestrator, Context Engine, AI model APIs, BullMQ  
**Key operations:** `dispatch`, `getTaskStatus`, `approve`, `reject`, `revise`, `getActivity`, `getAgentHealth`

#### Automation Service
**Responsibilities:** Automation registry, execution trigger, failure detection, health monitoring, time-savings tracking  
**External dependencies:** n8n API, GitHub Actions API, BullMQ  
**Key operations:** `create`, `trigger`, `getStatus`, `getHealth`, `diagnose`, `listFailures`

#### Notification Service
**Responsibilities:** Alert delivery, escalation routing, notification preferences, read/unread tracking  
**External dependencies:** Slack MCP, Resend (email), database  
**Key operations:** `send`, `markRead`, `getUnread`, `updatePreferences`, `escalate`

#### Repository Service
**Responsibilities:** GitHub repository sync, health score computation, PR/issue aggregation, commit activity  
**External dependencies:** GitHub MCP connector  
**Key operations:** `sync`, `getHealth`, `listPRs`, `listIssues`, `getActivity`, `linkToProject`

#### Search Service
**Responsibilities:** Full-text search, semantic search, faceted filtering, relationship enrichment, index maintenance  
**External dependencies:** PostgreSQL tsvector, pgvector, database  
**Key operations:** `search`, `searchSemantic`, `reindex`, `getRelationships`, `getSuggestions`

#### Analytics Service
**Responsibilities:** Health score computation across all dimensions, metric aggregation, trend calculation, threshold alerting  
**External dependencies:** Database (all entities)  
**Key operations:** `computeHealthScores`, `getSystemHealth`, `getEntityHealth`, `getTrends`, `checkThresholds`

#### Settings Service
**Responsibilities:** User preferences, organization settings, integration configuration, billing management  
**External dependencies:** Database, Stripe  
**Key operations:** `getSettings`, `updateSettings`, `configureIntegration`, `getSubscription`, `updateSubscription`

#### Audit Service
**Responsibilities:** Immutable audit log, compliance reports, data access logging, change tracking  
**External dependencies:** Database (append-only audit table)  
**Key operations:** `log`, `getLog`, `exportLog`, `generateComplianceReport`

---

### Background Job Architecture

Long-running tasks are offloaded to BullMQ queues:

| Queue | Jobs | Workers |
|-------|------|---------|
| `agent-tasks` | Agent task execution | 3 concurrent |
| `embeddings` | Knowledge object embedding generation | 2 concurrent |
| `integrations` | MCP connector sync jobs | 2 concurrent |
| `notifications` | Async notification delivery | 5 concurrent |
| `health-scoring` | Scheduled health score computation | 1 concurrent |
| `review-assembly` | Review packet assembly | 1 concurrent |

---

### Middleware Stack

Every API request passes through:

```
Request
  → Rate Limiting (Redis token bucket)
  → Authentication (JWT verification)
  → Organization Scoping (inject org context)
  → Authorization (RBAC permission check)
  → Input Validation (Zod)
  → Handler
  → Audit Log (append-only)
  → Response
```

---

### Real-Time Architecture

| Feature | Implementation |
|---------|---------------|
| Agent task progress | Server-Sent Events (SSE) from API route |
| Automation status | Polling (30s interval) |
| Notifications | SSE or WebSocket (Supabase Realtime) |
| Command Center refresh | Background polling (5 min) |

Future: full WebSocket upgrade via Supabase Realtime channels.

---

## Integration Layer

### MCP Connector Interface

Every MCP connector implements a common interface:

```typescript
interface MCPConnector {
  id: string
  name: string
  status: 'active' | 'inactive' | 'error'
  authenticate(credentials: Credentials): Promise<void>
  healthCheck(): Promise<HealthStatus>
  execute(action: string, params: Record<string, unknown>): Promise<unknown>
  listCapabilities(): Capability[]
}
```

Connectors are registered at startup and routed by the Tool Router.

---

## Future Architecture Extensions

| Extension | Trigger | Notes |
|-----------|---------|-------|
| Service extraction | > 50k MAU or service-specific scaling need | Split AI and Search first |
| GraphQL API | Mobile app or third-party developer demand | Wrap tRPC in GraphQL layer |
| Edge runtime | Latency optimization for global users | Move read-heavy routes to Vercel Edge |
| Streaming AI responses | User experience improvement | Stream via Vercel AI SDK (already supported) |
| Plugin system | Phase 6 Marketplace | Sandboxed WASM plugins or iframe-based integration |

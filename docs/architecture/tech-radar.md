# Technology Radar

## Purpose

This radar captures the technologies, patterns, and tools that LifeOS Enterprise implementation repositories should consider. It is guidance for implementors, not a mandate. Each quadrant uses the standard radar classifications: **Adopt**, **Trial**, **Assess**, **Hold**.

---

## Quadrant 1: Languages & Frameworks

| Item | Ring | Notes |
|------|------|-------|
| TypeScript | Adopt | Primary language for all application layers |
| Python | Adopt | AI/ML tooling, data pipelines, scripting |
| Go | Trial | High-performance services (event bus, sync workers) |
| Rust | Assess | Performance-critical components (local-first sync) |

## Quadrant 2: Platforms & Infrastructure

| Item | Ring | Notes |
|------|------|-------|
| PostgreSQL | Adopt | Primary relational store |
| Redis | Adopt | Cache, pub/sub, job queues |
| S3-compatible object storage | Adopt | Documents, attachments, exports |
| Kubernetes | Trial | Container orchestration for cloud deployment |
| SQLite | Trial | Local-first database (offline-capable clients) |
| Vector database (pgvector / Qdrant) | Trial | Semantic search and embeddings |
| CockroachDB | Assess | Distributed PostgreSQL for multi-region |

## Quadrant 3: Tools & Techniques

| Item | Ring | Notes |
|------|------|-------|
| Event Sourcing + CQRS | Adopt | Core platform architecture pattern |
| Model Context Protocol (MCP) | Adopt | Standard for AI agent tool integration |
| OpenAPI 3.1 | Adopt | API specification format |
| GraphQL | Trial | Knowledge graph query interface |
| gRPC | Trial | Internal service communication |
| HTMX | Assess | Lightweight UI interactions |
| CRDTs | Assess | Conflict-free local-first sync |

## Quadrant 4: AI & Agents

| Item | Ring | Notes |
|------|------|-------|
| OpenAI API (GPT-4+) | Adopt | Primary LLM for agent reasoning |
| Anthropic Claude API | Adopt | Secondary LLM for agent reasoning |
| LangChain / LangGraph | Trial | Agent orchestration framework |
| Local models (Ollama) | Trial | Privacy-sensitive operations, offline agents |
| Embeddings (text-embedding-3) | Adopt | Knowledge graph semantic linking |
| Structured outputs (JSON mode) | Adopt | Agent action parsing |

---

## Principles for Technology Selection

1. **Prefer boring technology** for foundational layers — the platform's value is in the product, not the infrastructure
2. **Optimize for operator leverage** — every technology choice should be defensible by "this gives operators more power per hour of engineering"
3. **Avoid vendor lock-in at the data layer** — data must always be exportable in open formats
4. **Open source by default** for infrastructure; commercial APIs acceptable for AI models

---

## Out of Scope

Technologies explicitly excluded from LifeOS Enterprise:
- Blockchain/distributed ledger for core data storage
- NoSQL document databases as a primary store (acceptable as cache/search)
- Serverless-only architectures (limits local-first and long-running agent execution)
